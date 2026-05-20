import React, { useState, useEffect } from 'react';
import api from '../api';
import { io } from 'socket.io-client';
import { 
  ThumbsUp, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  ExternalLink,
  Loader2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Heart
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getSentimentConfig } from '../constants/sentimentColors';

const ModerationQueue = ({ onAction, searchQuery }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ sentiment: '', status: '', note: '' });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchComments();

    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socket.on('stats_updated', fetchComments);
    socket.on('new_comment_analyzed', fetchComments);
    
    return () => socket.disconnect();
  }, [filter]);

  const fetchComments = async () => {
    try {
      const res = await api.get('/comments', {
        params: {
          sentiment: filter !== 'all' && ['positive', 'neutral', 'moderate', 'toxic'].includes(filter) ? filter : undefined,
          status: filter === 'deleted' ? 'deleted' : (filter === 'liked' ? undefined : undefined),
          autoLiked: filter === 'liked' ? true : undefined
        }
      });
      setComments(res.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.post(`/comments/${id}/action`, { action });
      fetchComments();
      if (onAction) onAction();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditForm({
      sentiment: comment.sentiment,
      status: comment.status,
      note: comment.note || ''
    });
  };

  const saveEdit = async (id) => {
    try {
      await api.patch(`/comments/${id}/edit`, editForm);
      setEditingId(null);
      fetchComments();
      if (onAction) onAction();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#ff0000]" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Bar */}
      <div className="flex items-center gap-2 p-4 bg-white border-b border-[#f0f0f0] overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-black uppercase text-[#909090] mr-2">Filter By:</span>
        {[
          { id: 'all', label: 'All Activity' },
          { id: 'toxic', label: 'Toxic' },
          { id: 'moderate', label: 'Moderate' },
          { id: 'neutral', label: 'Neutral' },
          { id: 'positive', label: 'Positive' },
          { id: 'deleted', label: 'Auto-Deleted' },
          { id: 'liked', label: 'Auto-Liked' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setLoading(true); }}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
              filter === f.id 
                ? 'bg-[#0f0f0f] text-white border-[#0f0f0f] shadow-md' 
                : 'bg-[#f9f9f9] text-[#606060] border-[#e5e5e5] hover:bg-[#f0f0f0]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="w-full overflow-x-auto custom-scroll">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b border-[#f0f0f0]">
            <th className="w-[45%] text-left py-4 px-3 text-[11px] font-black text-[#909090] uppercase tracking-wider">User & Comment</th>
            <th className="w-[12%] text-left py-4 px-3 text-[11px] font-black text-[#909090] uppercase tracking-wider">Sentiment</th>
            <th className="w-[12%] text-left py-4 px-3 text-[11px] font-black text-[#909090] uppercase tracking-wider">Confidence</th>
            <th className="w-[15%] text-left py-4 px-3 text-[11px] font-black text-[#909090] uppercase tracking-wider">Status</th>
            <th className="w-[6%] text-left py-4 px-3 text-[11px] font-black text-[#909090] uppercase tracking-wider">Video</th>
            <th className="w-[10%] text-right py-4 px-3 text-[11px] font-black text-[#909090] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {comments.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-12 text-[#909090] font-medium italic">
                No moderation logs found.
              </td>
            </tr>
          ) : (
            comments
              .filter(c => c.text.toLowerCase().includes((searchQuery || '').toLowerCase()) || c.author.toLowerCase().includes((searchQuery || '').toLowerCase()))
              .map((comment) => (
              <tr key={comment._id} className={`group transition-colors ${editingId === comment._id ? 'bg-[#fef2f2]/50' : ''}`}>
                <td className="py-5 px-3">
                  <div className="flex gap-4">
                    <img 
                      src={comment.authorProfileImageUrl || `https://ui-avatars.com/api/?name=${comment.author}&background=f0f0f0&color=606060`} 
                      className="w-10 h-10 rounded-full border border-[#f0f0f0] flex-shrink-0 shadow-sm" 
                      alt=""
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-black text-[#0f0f0f]">@{comment.author}</span>
                        {comment.language && (
                          <span className="text-[9px] font-black uppercase bg-[#f0f0f0] text-[#909090] px-1.5 py-0.5 rounded border border-[#e0e0e0]">
                            {comment.language}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-[#909090] ml-auto">
                          {formatDistanceToNow(new Date(comment.publishedAt))} ago
                        </span>
                      </div>
                      <p className="text-[13px] text-[#222] leading-relaxed mb-2">{comment.text}</p>
                      
                      {comment.detectedWords && comment.detectedWords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {comment.detectedWords.slice(0, 3).map((item, idx) => {
                            const cat = item.category?.toLowerCase();
                            const isPositive = ['appreciation', 'praise', 'greeting', 'support'].includes(cat);
                            const isNegative = ['abusive', 'toxic', 'insult', 'threat'].includes(cat);
                            
                            return (
                              <span 
                                key={idx} 
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${
                                  isPositive ? 'bg-green-50 text-green-600 border-green-100' :
                                  isNegative ? 'bg-red-50 text-red-600 border-red-100' :
                                  'bg-blue-50 text-blue-600 border-blue-100'
                                }`}
                              >
                                {item.word}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-5 px-3">
                  {editingId === comment._id ? (
                    <select 
                      value={editForm.sentiment}
                      onChange={(e) => setEditForm({...editForm, sentiment: e.target.value})}
                      className="text-[11px] font-bold border rounded-lg px-2 py-1 w-full"
                    >
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="moderate">Moderate</option>
                      <option value="toxic">Toxic</option>
                    </select>
                  ) : (
                    <span className={`yt-badge ${getSentimentConfig(comment.sentiment).badgeClass} capitalize w-full text-center py-1`}>
                      {comment.sentiment}
                    </span>
                  )}
                </td>
                <td className="py-5 px-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-700" 
                        style={{ 
                          width: `${(comment.confidence || 0.5) * 100}%`,
                          backgroundColor: getSentimentConfig(comment.sentiment).color
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-[#909090] tracking-tighter">
                      CONFIDENCE: {Math.round((comment.confidence || 0) * 100)}%
                    </span>
                  </div>
                </td>
                <td className="py-5 px-3">
                  {editingId === comment._id ? (
                    <select 
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      className="text-[11px] font-bold border rounded-lg px-2 py-1 w-full"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="flagged">Flagged</option>
                      <option value="deleted">Deleted</option>
                    </select>
                  ) : (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight">
                        {comment.status === 'deleted' ? (
                          <ShieldAlert size={12} className="text-[#d93025]" />
                        ) : comment.status === 'approved' ? (
                          <CheckCircle2 size={12} className="text-[#2ba640]" />
                        ) : comment.status === 'flagged' ? (
                          <AlertTriangle size={12} className="text-[#f9ab00]" />
                        ) : (
                          <Clock size={12} className="text-[#909090]" />
                        )}
                        <span className={
                          comment.status === 'deleted' ? 'text-[#d93025]' : 
                          comment.status === 'approved' ? 'text-[#2ba640]' :
                          comment.status === 'flagged' ? 'text-[#f9ab00]' : 'text-[#909090]'
                        }>
                          {comment.status === 'approved' ? 'AI Approved' : comment.status}
                        </span>
                      </div>
                      {comment.deleteFailed && (
                        <div className="mt-1.5 text-[9px] font-bold text-[#d93025] uppercase tracking-wider flex items-center gap-1">
                           <XCircle size={10} /> DELETE FAILED
                        </div>
                      )}
                      {(comment.likeStatus === 'failed' || comment.likeStatus === 'not_supported') && (
                        <div className="mt-1.5 text-[9px] font-bold text-[#d93025] uppercase tracking-wider flex items-center gap-1">
                           <XCircle size={10} /> LIKE FAILED
                        </div>
                      )}
                      {comment.autoLiked && (
                        <div className="mt-1.5 text-[9px] font-bold text-[#065fd4] uppercase tracking-wider flex items-center gap-1">
                           <ThumbsUp size={10} /> AUTO LIKED
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-5 px-3">
                  <a href={`https://youtube.com/watch?v=${comment.videoId}`} target="_blank" className="p-2.5 hover:bg-[#f0f0f0] rounded-xl inline-block transition-colors text-[#065fd4]">
                    <ExternalLink size={16} />
                  </a>
                </td>
                <td className="py-5 px-3 text-right">
                  <div className="flex justify-end gap-2">
                    {editingId === comment._id ? (
                      <>
                        <button onClick={() => saveEdit(comment._id)} className="p-2 bg-[#2ba640] text-white rounded-lg hover:bg-[#137333] shadow-md"><CheckCircle2 size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-[#f0f0f0] text-[#606060] rounded-lg border border-[#e5e5e5]"><XCircle size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleAction(comment._id, 'like')} className="p-2.5 hover:bg-blue-50 text-[#5f6368] hover:text-[#065fd4] rounded-xl border border-[#f0f0f0] transition-all hover:shadow-sm" title="Auto-Like"><Heart size={16} /></button>
                        <button onClick={() => handleAction(comment._id, 'approve')} className="p-2.5 hover:bg-green-50 text-[#5f6368] hover:text-[#137333] rounded-xl border border-[#f0f0f0] transition-all hover:shadow-sm" title="Approve"><CheckCircle2 size={16} /></button>
                        <button onClick={() => handleAction(comment._id, 'hide')} className="p-2.5 hover:bg-yellow-50 text-[#5f6368] hover:text-[#f9ab00] rounded-xl border border-[#f0f0f0] transition-all hover:shadow-sm" title="Hold"><ShieldAlert size={16} /></button>
                        <button onClick={() => startEdit(comment)} className="p-2.5 hover:bg-gray-50 text-[#5f6368] rounded-xl border border-[#f0f0f0] transition-all hover:shadow-sm" title="Edit"><Edit3 size={16} /></button>
                        <button onClick={() => handleAction(comment._id, 'delete')} className="p-2.5 hover:bg-red-50 text-[#5f6368] hover:text-[#c5221f] rounded-xl border border-[#f0f0f0] transition-all hover:shadow-sm" title="Delete"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                  {editingId === comment._id && (
                    <div className="mt-2">
                      <input 
                        type="text" 
                        placeholder="Add note..."
                        value={editForm.note}
                        onChange={(e) => setEditForm({...editForm, note: e.target.value})}
                        className="text-[10px] w-full border border-[#f0f0f0] rounded-lg p-1.5 focus:outline-none focus:border-[#065fd4]"
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default ModerationQueue;
