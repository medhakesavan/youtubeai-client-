import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Zap, 
  Globe, 
  Bell, 
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Key,
  Youtube,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const Settings = () => {
  const [autoMod, setAutoMod] = useState(true);
  const [threshold, setThreshold] = useState(85);
  const [languages, setLanguages] = useState(['English', 'Tamil', 'Tanglish']);
  const [realTimeAlerts, setRealTimeAlerts] = useState(true);
  
  // YouTube API configuration
  const [apiKey, setApiKey] = useState('');
  const [channelId, setChannelId] = useState('');
  
  // Loading and request states
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [connectingYoutube, setConnectingYoutube] = useState(false);
  const [ytError, setYtError] = useState('');
  const [ytSuccess, setYtSuccess] = useState('');
  const [generalSuccess, setGeneralSuccess] = useState(false);
  const [connectedChannels, setConnectedChannels] = useState([]);

  useEffect(() => {
    loadSettings();
    fetchConnectedChannels();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/api/settings');
      const { settings, youtubeApiKey, youtubeChannelId } = res.data;
      if (settings) {
        setAutoMod(settings.autoMod ?? true);
        setThreshold(settings.confidenceThreshold ?? 85);
        setLanguages(settings.languages ?? ['English', 'Tamil', 'Tanglish']);
        setRealTimeAlerts(settings.realTimeAlerts ?? true);
      }
      setApiKey(youtubeApiKey || '');
      setChannelId(youtubeChannelId || '');
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedChannels = async () => {
    try {
      const res = await api.get('/api/youtube/channels');
      setConnectedChannels(res.data);
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
  };

  const handleSaveGeneralSettings = async () => {
    setSavingSettings(true);
    setGeneralSuccess(false);
    try {
      await api.post('/api/settings', {
        settings: {
          autoMod,
          confidenceThreshold: threshold,
          languages,
          realTimeAlerts
        }
      });
      setGeneralSuccess(true);
      setTimeout(() => setGeneralSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleConnectYoutube = async (e) => {
    e.preventDefault();
    setConnectingYoutube(true);
    setYtError('');
    setYtSuccess('');
    try {
      const res = await api.post('/api/settings/youtube', {
        apiKey,
        channelId
      });
      setYtSuccess(res.data.message);
      setApiKey(res.data.youtubeApiKey);
      setChannelId(res.data.youtubeChannelId);
      fetchConnectedChannels();
    } catch (err) {
      setYtError(err.response?.data?.error || 'Validation failed. Please verify API Key and Channel ID.');
    } finally {
      setConnectingYoutube(false);
    }
  };

  const handleDisconnectYoutube = async () => {
    if (!window.confirm('Are you sure you want to disconnect this YouTube Channel connection?')) return;
    
    setConnectingYoutube(true);
    setYtError('');
    setYtSuccess('');
    try {
      const res = await api.post('/api/settings/youtube', {
        apiKey: '',
        channelId: channelId || 'disconnect'
      });
      setYtSuccess(res.data.message);
      setApiKey('');
      setChannelId('');
      fetchConnectedChannels();
    } catch (err) {
      setYtError(err.response?.data?.error || 'Failed to disconnect channel.');
    } finally {
      setConnectingYoutube(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#ff0000]" size={36} />
          <p className="text-xs font-bold text-[#606060] uppercase tracking-wider">Loading Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto py-4 space-y-8 pb-16 font-['Inter']">
      <div>
        <h1 className="text-3xl font-black text-[#0f0f0f] tracking-tighter flex items-center gap-3">
          <div className="bg-[#f2f2f2] p-2 rounded-xl">
            <SettingsIcon size={24} />
          </div>
          System Settings
        </h1>
        <p className="text-[#606060] font-medium mt-2">Configure your AI moderation engine, notifications, and custom YouTube API credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Column - Settings forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: YouTube API Integration */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="yt-card"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f8f8f8]">
              <div className="p-2 bg-[#fff1f0] text-[#ff0000] rounded-lg">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0f0f0f]">YouTube API Integration</h3>
                <p className="text-xs text-[#909090] font-medium">Link your channel using a custom YouTube Data API v3 key</p>
              </div>
            </div>

            <form onSubmit={handleConnectYoutube} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-[#909090] uppercase tracking-widest ml-1">
                  YouTube API Key
                </label>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#e9ecef] text-[#0f0f0f] rounded-xl py-3 px-4 text-sm font-semibold focus:outline-none focus:border-[#ff0000]/50 focus:bg-white focus:ring-4 focus:ring-[#ff0000]/5 transition-all placeholder-[#adb5bd]"
                  placeholder="Paste your AIzaSy... API Key"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-[#909090] uppercase tracking-widest ml-1">
                  YouTube Channel ID
                </label>
                <input 
                  type="text"
                  required={!!apiKey}
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#e9ecef] text-[#0f0f0f] rounded-xl py-3 px-4 text-sm font-semibold focus:outline-none focus:border-[#ff0000]/50 focus:bg-white focus:ring-4 focus:ring-[#ff0000]/5 transition-all placeholder-[#adb5bd]"
                  placeholder="e.g. UCxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <AnimatePresence>
                {ytError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-xs font-semibold"
                  >
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>{ytError}</div>
                  </motion.div>
                )}

                {ytSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-green-700 text-xs font-semibold"
                  >
                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                    <div>{ytSuccess}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-2">
                {apiKey || channelId ? (
                  <button
                    type="button"
                    onClick={handleDisconnectYoutube}
                    disabled={connectingYoutube}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Disconnect Connection
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  disabled={connectingYoutube}
                  className="yt-btn-primary !py-2.5 !px-5 !text-xs"
                >
                  {connectingYoutube ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Verifying with Google...
                    </>
                  ) : (
                    'Validate & Connect API Key'
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Section 2: AI Moderation Engine */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="yt-card"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f8f8f8]">
              <div className="p-2 bg-[#fff1f0] text-[#ff0000] rounded-lg">
                <Shield size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#0f0f0f]">Moderation Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Toggle 1: Auto Mod */}
              <div className="flex items-center justify-between gap-4">
                <div className="max-w-[420px]">
                  <p className="text-[14px] font-bold text-[#0f0f0f]">Automatic Moderation</p>
                  <p className="text-[12px] text-[#909090] font-medium mt-0.5">Automatically delete highly toxic comments in the background (Requires OAuth connection).</p>
                </div>
                <button 
                  onClick={() => setAutoMod(!autoMod)}
                  className={`transition-colors duration-300 ${autoMod ? 'text-[#ff0000]' : 'text-[#cccccc]'}`}
                >
                  {autoMod ? <ToggleRight size={44} strokeWidth={1.5} /> : <ToggleLeft size={44} strokeWidth={1.5} />}
                </button>
              </div>

              {/* Slider 1: Confidence Threshold */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-[#fcfcfc]">
                <div className="max-w-[420px]">
                  <p className="text-[14px] font-bold text-[#0f0f0f]">Confidence Threshold</p>
                  <p className="text-[12px] text-[#909090] font-medium mt-0.5">Minimum AI certainty required before automatic flagging or moderation triggers.</p>
                </div>
                <div className="flex items-center gap-4 min-w-[200px]">
                  <input 
                    type="range" 
                    min="50" 
                    max="99" 
                    value={threshold} 
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="flex-1 accent-[#ff0000]"
                  />
                  <span className="text-xs font-black text-[#ff0000] bg-[#fff1f0] px-3 py-1 rounded-full min-w-[50px] text-center">
                    {threshold}%
                  </span>
                </div>
              </div>

              {/* Language Tags */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#fcfcfc]">
                <div className="max-w-[420px]">
                  <p className="text-[14px] font-bold text-[#0f0f0f]">Detection Languages</p>
                  <p className="text-[12px] text-[#909090] font-medium mt-0.5">Languages the AI model actively monitors for toxic keywords and sentiment.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {languages.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-[#f2f2f2] text-[#0f0f0f] text-[11px] font-bold rounded-full border border-[#e5e5e5] uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Real time alerts */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#fcfcfc]">
                <div className="max-w-[420px]">
                  <p className="text-[14px] font-bold text-[#0f0f0f]">Real-time Alerts</p>
                  <p className="text-[12px] text-[#909090] font-medium mt-0.5">Receive instant visual push banners for toxic comments.</p>
                </div>
                <button 
                  onClick={() => setRealTimeAlerts(!realTimeAlerts)}
                  className={`transition-colors duration-300 ${realTimeAlerts ? 'text-[#ff0000]' : 'text-[#cccccc]'}`}
                >
                  {realTimeAlerts ? <ToggleRight size={44} strokeWidth={1.5} /> : <ToggleLeft size={44} strokeWidth={1.5} />}
                </button>
              </div>

            </div>

            <div className="mt-8 pt-5 border-t border-[#f0f0f0] flex items-center justify-between">
              <AnimatePresence>
                {generalSuccess && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1.5 text-green-600 text-xs font-bold"
                  >
                    <CheckCircle2 size={14} />
                    Settings saved successfully!
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex gap-2 ml-auto">
                <button 
                  type="button"
                  onClick={loadSettings}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#606060] hover:bg-[#f2f2f2] transition-colors"
                >
                  Reset
                </button>
                <button 
                  type="button"
                  onClick={handleSaveGeneralSettings}
                  disabled={savingSettings}
                  className="yt-btn-primary !py-2 !px-4 !text-xs"
                >
                  {savingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Section 3: Diagnostic Maintenance Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="yt-card"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f8f8f8]">
              <div className="p-2 bg-[#fff1f0] text-[#ff0000] rounded-lg">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0f0f0f]">Maintenance & Re-Analysis</h3>
                <p className="text-xs text-[#909090] font-medium">Manually trigger backfills and background classification updates</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-[420px]">
                  <p className="text-[13px] font-bold text-[#0f0f0f]">Fix Incorrectly Marked "Neutral" Comments</p>
                  <p className="text-[11px] text-[#909090] font-medium mt-0.5">Runs an override search specifically for short neutral words and updates them to Positive.</p>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      await api.post('/api/comments/reanalyze', { sentimentFilter: 'neutral' });
                      alert('Targeted re-analysis for Neutral comments started! Check dashboard for updates.');
                    } catch (err) {
                      alert('Failed to start targeted re-analysis.');
                    }
                  }}
                  className="px-4 py-2 bg-[#0f0f0f] text-white text-[11px] font-bold rounded-xl hover:bg-[#222] transition-colors whitespace-nowrap"
                >
                  Fix Now
                </button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-[#fcfcfc]">
                <div className="max-w-[420px]">
                  <p className="text-[13px] font-bold text-[#0f0f0f]">Full Database AI Reclassification</p>
                  <p className="text-[11px] text-[#909090] font-medium mt-0.5">Re-evaluates every single comment stored in the system database using the latest GPT-4o model settings.</p>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      await api.post('/api/comments/reanalyze');
                      alert('Full re-analysis started! This will run in the background.');
                    } catch (err) {
                      alert('Failed to start re-analysis.');
                    }
                  }}
                  className="px-4 py-2 bg-[#0f0f0f] text-white text-[11px] font-bold rounded-xl hover:bg-[#222] transition-colors whitespace-nowrap"
                >
                  Analyze All
                </button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-[#fcfcfc]">
                <div className="max-w-[420px]">
                  <p className="text-[13px] font-bold text-[#0f0f0f]">Batch Like Positive Comments</p>
                  <p className="text-[11px] text-[#909090] font-medium mt-0.5">Likes all detected positive comments on YouTube in a single batch script (OAuth write access required).</p>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      const res = await api.post('/api/comments/batch-like');
                      alert(res.data.message || 'Batch auto-like started!');
                    } catch (err) {
                      alert(err.response?.data?.error || 'Failed to start batch auto-like.');
                    }
                  }}
                  className="px-4 py-2 bg-[#0f0f0f] text-white text-[11px] font-bold rounded-xl hover:bg-[#222] transition-colors whitespace-nowrap"
                >
                  Run Batch Like
                </button>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Right Column - Status information and links */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="yt-card bg-[#f8f9fa] border border-[#e9ecef]"
          >
            <h4 className="text-sm font-bold text-[#0f0f0f] mb-3 flex items-center gap-2">
              <Youtube className="text-[#ff0000]" size={16} />
              Connection Status
            </h4>
            
            {connectedChannels.length > 0 ? (
              <div className="space-y-4">
                {connectedChannels.map((channel) => (
                  <div key={channel.channelId} className="p-3.5 bg-white border border-[#e2e8f0] rounded-xl flex items-start gap-3">
                    <img 
                      src={channel.thumbnailUrl || `https://ui-avatars.com/api/?name=${channel.title}`} 
                      alt="" 
                      className="w-10 h-10 rounded-full bg-slate-100 object-cover" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-[#0f0f0f] truncate">{channel.title}</p>
                      <p className="text-[10px] text-[#909090] font-semibold mt-0.5 uppercase tracking-wider">
                        Connected via: {channel.apiKey ? 'API Key (Read-Only)' : 'OAuth (Full Access)'}
                      </p>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2ba640] animate-pulse"></span>
                        <span className="text-[9px] font-black text-[#2ba640] uppercase">Scanning Live</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-white border border-dashed border-[#cbd5e1] rounded-2xl">
                <Info size={24} className="text-[#94a3b8] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#64748b]">No Channels Connected</p>
                <p className="text-[10px] text-[#94a3b8] mt-1 font-medium leading-tight">Use OAuth or provide an API key to link your YouTube channel.</p>
              </div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="yt-card bg-[#fffcf0] border border-[#fef08a]"
          >
            <h4 className="text-sm font-bold text-[#854d0e] mb-3 flex items-center gap-2">
              <Info size={16} />
              API Key vs OAuth
            </h4>
            <div className="space-y-3 text-[11px] text-[#713f12] font-semibold leading-relaxed">
              <p>
                <b>YouTube API Key:</b> Permits <i>Read-Only</i> access. The AI will scan, classify, and populate your dashboard. However, automatic deletes, manual replies, or batch likes <b>cannot</b> be written back to YouTube.
              </p>
              <p>
                <b>YouTube OAuth:</b> Permits full <i>Read & Write</i> access. Highly recommended for enabling auto-delete of toxic comments and auto-reply actions.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
