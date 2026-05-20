import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './log.mjs';
import { Server } from 'socket.io';
import http from 'http';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { getYouTubeClient, getYouTubeAuth, fetchLatestComments, likeComment, deleteCommentFromYouTube } from './services/youtubeService.mjs';
import { classifyComment } from './services/aiService.mjs';
import Comment from './models/Comment.mjs';
import Channel from './models/Channel.mjs';
import User from './models/User.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://youtubeclients.vercel.app';
const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, 'https://youtubeclients.vercel.app', 'http://localhost:5174'],
    credentials: true,
  }
});

app.set('io', io);

app.use(helmet());
app.use(cors({ origin: [FRONTEND_URL, 'https://youtubeclients.vercel.app', 'http://localhost:5174'], credentials: true }));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB Connected (Client/Server)'))
  .catch(err => logger.error('MongoDB Error:', err));

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_fallback');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/analytics', authMiddleware, async (req, res) => {
  try {
    const totalComments = await Comment.countDocuments();
    const toxicDeleted = await Comment.countDocuments({ status: 'deleted' });
    const positiveLiked = await Comment.countDocuments({ autoLiked: true });
    const pendingModeration = await Comment.countDocuments({ status: { $in: ['pending', 'flagged'] } });

    const sentimentCounts = await Comment.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } }
    ]);

    const recentActivities = await Comment.find()
      .sort({ updatedAt: -1 })
      .limit(5);

    const activities = recentActivities.map(c => ({
      ...c.toObject(),
      id: c._id,
      type: c.status === 'deleted' ? 'delete' : (c.autoLiked ? 'like' : 'new_comment')
    }));

    res.json({
      totalComments,
      toxicDeleted,
      positiveLiked,
      pendingModeration,
      categories: sentimentCounts,
      activities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ai/status', (_req, res) => {
  const hasKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
  res.json({ active: !!hasKey, engine: hasKey ? 'GPT-4o-mini' : 'none' });
});

app.get('/api/comments', authMiddleware, async (req, res) => {
  const { status, sentiment } = req.query;
  const query = {};
  if (status) query.status = status;
  if (sentiment) query.sentiment = sentiment;
  const comments = await Comment.find(query).sort({ publishedAt: -1 }).limit(100);
  res.json(comments);
});

app.post('/api/comments/reanalyze', authMiddleware, async (req, res) => {
  try {
    const { sentimentFilter } = req.body;
    const query = sentimentFilter ? { sentiment: sentimentFilter } : {};
    const comments = await Comment.find(query);
    
    const runReanalysis = async () => {
      let updatedCount = 0;
      for (const comment of comments) {
        const oldSentiment = comment.sentiment;
        const aiResult = await classifyComment(comment.text);
        
        comment.sentiment = aiResult.sentiment;
        comment.toxicityScore = aiResult.toxicityScore;
        comment.confidence = aiResult.confidence;
        comment.language = aiResult.language;
        comment.detectedWords = aiResult.detectedWords;
        
        const isPositive = aiResult.sentiment === 'positive' && aiResult.confidence > 0.8;
        const isMeaningful = comment.text.trim().length > 5;
        
        if (oldSentiment !== aiResult.sentiment) {
          const channel = await Channel.findOne({ channelId: comment.channelId }) || await Channel.findOne();
          if (channel) {
            const youtube = getYouTubeClient({
              access_token: channel.accessToken,
              refresh_token: channel.refreshToken,
              expiry_date: channel.expiryDate,
            });

            if (isPositive && isMeaningful && (!comment.autoLiked)) {
              const result = await likeComment(youtube, comment.youtubeId);
              comment.likeStatus = result.status;
              comment.likeError = result.reason;
              comment.autoLiked = result.success;
              if (result.success) comment.aiActionTaken = true;
            }
          }
          updatedCount++;
        }
        await comment.save();
      }
      if (io) io.emit('stats_updated');
    };

    runReanalysis();
    res.json({ success: true, message: 'Re-analysis started.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simplistic Auth for sync
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // This is a dummy for sync purposes, assuming root server handles real auth
  // But we need a token to pass middleware
  const token = jwt.sign({ email }, process.env.JWT_SECRET || 'supersecret_fallback');
  res.cookie('token', token, { httpOnly: true, maxAge: 3600000 });
  res.json({ success: true });
});

server.listen(PORT, () => logger.info(`Client/Server sync running on port ${PORT}`));
