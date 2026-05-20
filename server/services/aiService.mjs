import OpenAI from 'openai';
import dotenv from 'dotenv';
import logger from '../log.mjs';

dotenv.config();

let openai = null;

const getOpenAI = () => {
  if (openai) return openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'your_openai_api_key_here') {
    return null;
  }
  openai = new OpenAI({ apiKey: key });
  return openai;
};

const POSITIVE_KEYWORDS = [
  'great', 'good', 'nice', 'awesome', 'excellent', 'super', 'mass', 'thalaiva', 'vera level', 'superb', 
  'keep it up', 'thanks', 'thank you', 'love', 'wow', 'amazing', 'nandri', 'arumai', 'gethu', 'vazhthukal', 
  'massu', 'fire', 'lit', 'best', 'proud', 'heart', 'king', 'legend', 'congrats', 'brilliant'
];

const TOXIC_KEYWORDS = [
  'bad', 'useless', 'trash', 'shut up', 'idiot', 'stupid', 'fuck', 'shit', 'garbage', 'waste', 'fool', 
  'worst', 'poda', 'moodu', 'wasteu', 'kevalam', 'mokka', 'irritating', 'hate', 'die', 'fake'
];

export const classifyComment = async (text) => {
  const client = getOpenAI();
  const lowerText = text.toLowerCase().trim();
  
  // ── Step 1: Lightweight Keyword Pre-Check ──────────────────────────────────
  let keywordDetected = false;
  let detectedSentiment = null;
  let detectedWords = [];

  const positiveMatches = POSITIVE_KEYWORDS.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
  const toxicMatches = TOXIC_KEYWORDS.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });

  if (positiveMatches.length > 0 && toxicMatches.length === 0) {
    detectedSentiment = 'positive';
    keywordDetected = true;
    detectedWords = positiveMatches.map(w => ({ word: w, category: 'appreciation' }));
  } else if (toxicMatches.length > 0) {
    detectedSentiment = 'toxic';
    keywordDetected = true;
    detectedWords = toxicMatches.map(w => ({ word: w, category: 'insult' }));
  }

  // ── Step 1.5: Fast-Pass for Short Clear Comments ──────────────────────────
  if (keywordDetected && lowerText.length < 25) {
    return {
      sentiment: detectedSentiment,
      toxicityScore: detectedSentiment === 'toxic' ? 0.8 : 0,
      confidence: 0.95,
      language: 'English',
      detectedWords
    };
  }

  // ── Step 2: AI Classification ──────────────────────────────────────────────
  if (!client) {
    logger.warn('OpenAI API Key missing, using keyword fallback.');
    return {
      sentiment: detectedSentiment || 'neutral',
      toxicityScore: detectedSentiment === 'toxic' ? 0.8 : 0,
      confidence: keywordDetected ? 0.9 : 0.5,
      language: 'unknown',
      detectedWords
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a high-accuracy YouTube moderation AI. Classify comments into: [positive, neutral, moderate, toxic].
          
          Classification Rules:
          - positive: Appreciation, praise, excitement, thanks, or support. 
            IMPORTANT: Short comments like "good", "nice", "wow", "great" are ALWAYS POSITIVE, never neutral.
          - toxic: Abusive, hate speech, threats, heavy swearing, or clear insults.
          - moderate: Sarcasm, borderline toxicity, passive-aggressive remarks, or slightly disrespectful but not fully toxic.
          - neutral: Purely factual information, robotic questions, or data with NO emotion whatsoever.
          
          Confidence Scoring:
          - Return a float between 0 and 1. 
          - High confidence (0.9+) for clear cases.
          - Lower confidence for ambiguous or very short text without clear markers.

          Categorization:
          - Extract words/phrases into detectedWords with categories: [appreciation, praise, insult, threat, sarcasm, info, question].

          Languages Supported: English, Tamil, Tanglish (Tamil in English script).`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    let finalSentiment = result.sentiment || 'neutral';
    let finalConfidence = result.confidence || 0.5;
    let finalWords = result.detectedWords || [];

    if (lowerText.length < 20 && positiveMatches.length > 0 && finalSentiment === 'neutral') {
      finalSentiment = 'positive';
      finalConfidence = Math.max(finalConfidence, 0.9);
      const existingWords = new Set(finalWords.map(w => w.word.toLowerCase()));
      positiveMatches.forEach(w => {
        if (!existingWords.has(w)) {
          finalWords.push({ word: w, category: 'appreciation' });
        }
      });
    }

    return {
      sentiment: finalSentiment,
      toxicityScore: result.toxicityScore || (finalSentiment === 'toxic' ? 0.8 : (finalSentiment === 'moderate' ? 0.4 : 0)),
      confidence: finalConfidence,
      language: result.detectedLanguage || 'English',
      detectedWords: finalWords
    };
  } catch (error) {
    logger.error('AI Classification error:', error);
    return {
      sentiment: detectedSentiment || 'neutral',
      toxicityScore: detectedSentiment === 'toxic' ? 0.8 : 0,
      confidence: keywordDetected ? 0.9 : 0.5,
      language: 'unknown',
      detectedWords
    };
  }
};
