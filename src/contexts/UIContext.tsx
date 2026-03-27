import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion } from 'motion/react';

interface UIContextType {
  isBottomNavVisible: boolean;
  setBottomNavVisible: (visible: boolean) => void;
  showImageViewer: (url: string) => void;
  hideImageViewer: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isBottomNavVisible, setBottomNavVisible] = useState(true);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const showImageViewer = (url: string) => {
    setViewerImage(url);
    setBottomNavVisible(false);
  };

  const hideImageViewer = () => {
    setViewerImage(null);
    setBottomNavVisible(true);
  };

  return (
    <UIContext.Provider value={{ 
      isBottomNavVisible, 
      setBottomNavVisible,
      showImageViewer,
      hideImageViewer
    }}>
      {children}
      {viewerImage && (
        <div 
          className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={hideImageViewer}
        >
          <div className="absolute top-6 right-6 flex gap-3 z-10">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.open(viewerImage, '_blank');
              }}
              className="text-white/70 hover:text-white p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md border border-white/10"
              title="Open in new tab"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </button>
            <button 
              onClick={hideImageViewer}
              className="text-white/70 hover:text-white p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-md border border-white/10"
              title="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative max-w-5xl w-full h-full flex items-center justify-center p-4 sm:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={viewerImage} 
              alt="Full view" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-6 text-white/60 text-xs font-bold uppercase tracking-widest">
            <span>GiliHub Viewer</span>
            <div className="w-1 h-1 bg-white/20 rounded-full"></div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.share) {
                  navigator.share({
                    title: 'GiliHub Image',
                    url: viewerImage
                  });
                }
              }}
              className="hover:text-white transition-colors"
            >
              Share
            </button>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
