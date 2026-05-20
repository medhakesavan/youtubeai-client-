import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  PlaySquare, 
  ShieldCheck, 
  Settings,
  LogOut,
  Zap,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ activeTab, setActiveTab, onLogout, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'channels', label: 'Channels', icon: PlaySquare },
    { id: 'moderation', label: 'Moderation', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          x: (typeof window !== 'undefined' && window.innerWidth >= 1024) ? 0 : (isOpen ? 0 : -280),
          opacity: 1
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed inset-y-0 left-0 bg-white border-r border-[#f0f0f0] flex flex-col z-[150] shadow-2xl lg:shadow-none lg:relative transition-all duration-300 ease-in-out ${
          !isOpen ? 'pointer-events-none lg:pointer-events-auto' : 'pointer-events-auto'
        }`}
        style={{
          width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (isOpen ? '240px' : '72px') : '280px'
        }}
      >
        {/* Sidebar Header (Mobile Only) */}
        <div className="h-[64px] flex items-center px-6 border-b border-[#f0f0f0] lg:hidden">
           <div className="flex items-center gap-3">
              <div className="w-8 h-[18px] bg-[#ff0000] flex items-center justify-center rounded-[4px] relative">
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
              </div>
           </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 lg:py-6 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.id} className="relative px-2">
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={`sidebar-item group transition-all duration-200 w-full ${
                    activeTab === item.id 
                      ? 'bg-[#fff1f0] text-[#ff0000] font-bold' 
                      : 'hover:bg-[#f9f9f9] text-[#606060]'
                  } ${isOpen || (typeof window !== 'undefined' && window.innerWidth < 1024) ? 'px-4 justify-start' : 'px-0 h-12 justify-center rounded-xl'}`}
                >
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <item.icon 
                      size={20} 
                      strokeWidth={activeTab === item.id ? 2.5 : 2} 
                      className={activeTab === item.id ? 'text-[#ff0000]' : ''}
                    />
                  </div>
                  
                  {(isOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="ml-4 whitespace-nowrap text-[14px]"
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {activeTab === item.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#ff0000] rounded-r-full" />
                  )}

                  {/* Tooltip for Collapsed State (Desktop Only) */}
                  {!isOpen && typeof window !== 'undefined' && window.innerWidth >= 1024 && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#282828] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[200] shadow-xl translate-x-2 group-hover:translate-x-0">
                      {item.label}
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer Section: AI Status & Logout */}
        <div className={`p-2 lg:p-3 mt-auto border-t border-[#f0f0f0] transition-all duration-300 ${isOpen ? 'space-y-4' : 'space-y-2'}`}>
          {/* AI Status Card */}
          <div className={`bg-[#fcfcfc] border border-[#f0f0f0] rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'p-4' : 'p-0 h-12 flex items-center justify-center border-none bg-transparent'}`}>
            <div className={`flex items-center ${isOpen ? 'gap-3 mb-2' : 'justify-center'}`}>
              <div className={`rounded-xl bg-[#fff1f0] flex items-center justify-center text-[#ff0000] flex-shrink-0 ${isOpen ? 'w-8 h-8' : 'w-12 h-12'}`}>
                <Zap size={isOpen ? 16 : 20} fill="currentColor" />
              </div>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-[11px] font-bold text-[#909090] uppercase tracking-wider leading-none">AI Status</p>
                  <p className="text-[13px] font-bold text-[#0f0f0f] mt-1">Live</p>
                </motion.div>
              )}
            </div>
            {isOpen && (
              <div className="w-full h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div className="h-full bg-[#ff0000] w-[85%] animate-pulse"></div>
              </div>
            )}
          </div>

          <div className="px-2">
            <button 
              onClick={onLogout}
              className={`sidebar-item group !text-[#d93025] hover:!bg-[#fce8e6] transition-all duration-200 !mx-0 ${
                isOpen ? 'w-full px-4' : 'h-12 w-full px-0 justify-center rounded-xl'
              }`}
            >
              <div className="flex-shrink-0 flex items-center justify-center">
                <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
              </div>
              {isOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-4 font-bold"
                >
                  Logout
                </motion.span>
              )}
              {!isOpen && typeof window !== 'undefined' && window.innerWidth >= 1024 && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#282828] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[200] shadow-xl translate-x-2 group-hover:translate-x-0">
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
