import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Mic, 
  Video, 
  Bell, 
  Menu,
  Youtube,
  LogOut,
  User,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ toggleSidebar, onSearch, setActiveTab, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [aiStatus, setAiStatus] = useState({ active: false, engine: 'none' });
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchAIStatus = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://youtubeai-server.onrender.com/api'}/ai/status`);
        const data = await res.json();
        setAiStatus(data);
      } catch (err) {
        console.error('Failed to fetch AI status');
      }
    };
    fetchAIStatus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setSearchQuery(value);
    if (onSearch) onSearch(value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
    setShowMobileSearch(false);
  };

  const handleMicClick = () => {
    const speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (speech) {
      alert('Voice search is initializing...');
    } else {
      alert('Voice search is not supported in your browser.');
    }
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  return (
    <header className="h-[64px] bg-white border-b border-[#f0f0f0] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-[100] shadow-sm">
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-white z-[110] flex items-center px-4 gap-2 md:hidden"
          >
            <button onClick={() => setShowMobileSearch(false)} className="p-2 hover:bg-[#f2f2f2] rounded-full">
               <Menu size={20} className="rotate-90" />
            </button>
            <form className="flex-1 flex" onSubmit={handleSearchSubmit}>
               <input 
                type="text" 
                autoFocus
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search..." 
                className="w-full bg-[#f8f8f8] border border-[#e5e5e5] rounded-l-full py-2 px-4 text-[14px] focus:outline-none focus:border-[#ff0000]"
              />
              <button type="submit" className="bg-[#f8f8f8] border border-l-0 border-[#e5e5e5] rounded-r-full px-4 text-[#0f0f0f]">
                <Search size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Section: Logo & Menu */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-[#f2f2f2] rounded-full transition-colors active:scale-90 ml-1"
        >
          <Menu size={22} className="text-[#0f0f0f]" />
        </button>
        
        <div className="flex items-center group cursor-pointer select-none" onClick={() => setActiveTab && setActiveTab('dashboard')}>
          <div className="flex items-center transition-transform duration-200">
            {/* Custom YT Play Button */}
            <div className="w-8 h-[18px] md:w-9 md:h-[20px] bg-[#ff0000] flex items-center justify-center rounded-[4px] relative">
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
            </div>
          </div>
          <div className="flex items-center ml-2">
            <span className="text-[18px] md:text-[20px] font-bold tracking-tighter text-[#0f0f0f] leading-none" style={{ fontFamily: '"Roboto", "Arial", sans-serif' }}>
              YouTube
            </span>
            <span className="ml-1.5 text-[14px] font-medium text-[#606060] tracking-tight leading-none hidden sm:block whitespace-nowrap">
              AI Mod
            </span>
          </div>
        </div>
      </div>

      {/* Center Section: Search Bar */}
      <div className="flex-1 max-w-[720px] px-2 md:px-4 flex items-center justify-center gap-3">
        <div className="flex-1 items-center hidden md:flex">
          <form className="relative flex-1 group flex" onSubmit={handleSearchSubmit}>
            <div className="relative flex-1">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#909090] pointer-events-none group-focus-within:text-[#ff0000]">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search comments or videos..." 
                className="w-full bg-[#f8f8f8] border border-[#e5e5e5] rounded-l-full py-2.5 pl-12 pr-6 text-[14px] font-medium focus:outline-none focus:border-[#ff0000] focus:bg-white focus:shadow-sm transition-all placeholder-[#888]"
              />
            </div>
            <button 
              type="submit"
              className="bg-[#f8f8f8] border border-l-0 border-[#e5e5e5] rounded-r-full px-5 hover:bg-[#f0f0f0] transition-colors group-focus-within:border-[#ff0000]"
              title="Search"
            >
              <Search size={18} className="text-[#0f0f0f]" />
            </button>
          </form>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={() => setShowMobileSearch(true)}
            className="p-2 hover:bg-[#f2f2f2] rounded-full md:hidden transition-colors"
          >
            <Search size={20} className="text-[#0f0f0f]" />
          </button>
          <button 
            onClick={handleMicClick}
            className="p-2 bg-[#f8f8f8] hover:bg-[#f2f2f2] rounded-full border border-[#e5e5e5] transition-colors shadow-sm active:scale-95"
            title="Search with your voice"
          >
            <Mic size={18} className="text-[#0f0f0f]" />
          </button>
        </div>
      </div>

      {/* Right Section: Actions & Profile */}
      <div className="flex items-center gap-1 md:gap-2 lg:gap-4 lg:w-[240px] justify-end" ref={menuRef}>
        <button 
          className="p-2 hover:bg-[#f2f2f2] rounded-full text-[#0f0f0f] hidden lg:block transition-all active:scale-95" 
          title="Create"
          onClick={() => alert('Feature coming soon: Batch Moderate / Upload Videos')}
        >
          <Video size={20} />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 hover:bg-[#f2f2f2] rounded-full text-[#0f0f0f] transition-all active:scale-95 ${showNotifications ? 'bg-[#f2f2f2]' : ''}`} 
            title="Notifications"
          >
            <div className="relative">
              <Bell size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#ff0000] rounded-full border-2 border-white"></span>
            </div>
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-2xl shadow-2xl border border-[#f0f0f0] overflow-hidden"
              >
                <div className="p-4 border-b border-[#f0f0f0] flex items-center justify-between">
                  <h3 className="font-bold text-[#0f0f0f]">Notifications</h3>
                  <button className="text-[#065fd4] text-xs font-bold hover:underline">Settings</button>
                </div>
                <div className="p-8 text-center">
                  <Bell size={40} className="mx-auto text-[#e5e5e5] mb-3" />
                  <p className="text-[13px] text-[#606060] font-medium">No new notifications. Your channel is being moderated in real-time.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Profile Chip */}
        <div className="relative">
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1 md:gap-3 pl-2 md:ml-2 border-l border-[#f0f0f0] cursor-pointer group"
          >
            <div className="hidden lg:flex flex-col items-end mr-1">
              <span className="text-[13px] font-black text-[#0f0f0f] leading-tight group-hover:text-[#ff0000] transition-colors">{user?.name || 'Admin User'}</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-[#2ba640] rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-[#2ba640] uppercase tracking-[0.1em]">Live Mode</span>
              </div>
            </div>
            <div className="relative">
               <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-[#ff0000] to-[#ff4b4b] flex items-center justify-center text-white font-black border-2 border-white shadow-sm overflow-hidden transition-transform group-hover:scale-105 active:scale-95">
                  {user?.name?.charAt(0) || 'A'}
               </div>
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2ba640] rounded-full border-2 border-white"></div>
            </div>
            <ChevronDown size={14} className={`text-[#606060] transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#f0f0f0] overflow-hidden"
              >
                <div className="p-4 border-b border-[#f0f0f0] bg-[#fafafa]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center text-white font-bold text-lg">
                      {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#0f0f0f] truncate">{user?.name || 'Admin'}</p>
                      <p className="text-[12px] text-[#606060] truncate">{user?.email || 'admin@example.com'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <button 
                    onClick={() => {
                      if (setActiveTab) setActiveTab('dashboard');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f2f2f2] rounded-xl text-[14px] text-[#0f0f0f] font-medium transition-colors"
                  >
                    <User size={18} /> Profile
                  </button>
                  <button 
                    onClick={() => {
                      if (setActiveTab) setActiveTab('settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f2f2f2] rounded-xl text-[14px] text-[#0f0f0f] font-medium transition-colors"
                  >
                    <Settings size={18} /> AI Settings
                  </button>
                  <div className="h-px bg-[#f0f0f0] my-2 mx-2"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#fff1f0] rounded-xl text-[14px] text-[#d93025] font-bold transition-colors"
                  >
                    <LogOut size={18} /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;

