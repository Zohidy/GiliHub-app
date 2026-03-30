import { useState, useEffect } from 'react';
import TripPlanner from './components/planner/TripPlanner';
import Home from './components/home/Home';
import InteractiveMap from './components/map/InteractiveMap';
import BookingList from './components/booking/BookingList';
import ForumList from './components/community/ForumList';
import UserProfile from './components/profile/UserProfile';
import ChatList from './components/chat/ChatList';
import EventCalendar from './components/events/EventCalendar';
import About from './components/about/About';
import Settings from './components/settings/Settings';
import PrivacyPolicy from './components/settings/PrivacyPolicy';
import TermsConditions from './components/settings/TermsConditions';
import Login from './components/auth/Login';
import ProfileSetup from './components/auth/ProfileSetup';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ProfileModalProvider } from './contexts/ProfileModalContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from './config/firebase';
import PublicProfileModal from './components/profile/PublicProfileModal';
import GiliBot from './components/chat/GiliBot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LogOut, User, MessageCircle, Calendar, Map as MapIcon, CalendarDays, MessageSquare, UserCircle, LayoutGrid, Sun, Moon, Home as HomeIcon, ChevronLeft, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './components/Logo';
import { Toaster, toast } from 'sonner';

function MainApp() {
  const { user, userData, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { isBottomNavVisible } = useUI();
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'booking' | 'events' | 'forum' | 'chat' | 'profile' | 'about' | 'settings' | 'privacy' | 'terms' | 'planner'>('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success(t('online_mode') || 'Back online!');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error(t('offline_mode') || 'Offline mode activated');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Real-time Notifications for Forum
    let unsubscribeForum: () => void;
    if (user) {
      const q = query(
        collection(db, 'comments'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      unsubscribeForum = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty && !snapshot.metadata.hasPendingWrites) {
          const newComment = snapshot.docs[0].data();
          // Only notify if it's not the current user's comment
          if (newComment.userId !== user.uid) {
            toast.info(`New comment from ${newComment.userName}`, {
              description: newComment.content.substring(0, 50) + '...',
              action: {
                label: 'View',
                onClick: () => setActiveTab('forum')
              }
            });
          }
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubscribeForum) unsubscribeForum();
    };
  }, [t, user]);

  // Back button logic
  useEffect(() => {
    // Push initial state so we can intercept the back button
    window.history.pushState({ app: 'gilihub' }, '');

    const handlePopState = () => {
      if ((window as any).isExiting) return;
      
      // Prevent default back behavior by pushing state again
      window.history.pushState({ app: 'gilihub' }, '');

      setActiveTab(currentTab => {
        if (currentTab !== 'home') {
          return 'home';
        } else {
          setShowExitConfirm(true);
          return currentTab;
        }
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleExitApp = () => {
    (window as any).isExiting = true;
    setShowExitConfirm(false);
    // Go back past our pushed states to actually exit
    window.history.go(-2);
    
    // Fallback if history.go doesn't close the app (e.g., opened directly)
    setTimeout(() => {
      window.close();
    }, 300);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-mesh relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[2px]" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="relative mb-8">
            <div className="w-24 h-24 glass dark:glass-dark rounded-full flex items-center justify-center shadow-2xl border-white/20">
              <div className="w-16 h-16 bg-electric-blue rounded-full animate-pulse flex items-center justify-center">
                <Logo className="text-white" size={32} />
              </div>
            </div>
            <div className="absolute -inset-4 border-2 border-electric-blue/20 rounded-full animate-spin-slow" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-slate-900 dark:text-white tracking-tight mb-2">GILIHUB</h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm uppercase tracking-[0.2em]">Preparing your island escape...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Check if profile setup is needed
  if (user && !userData) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-mesh relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[2px]" />
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center glass dark:glass-dark p-8 rounded-3xl shadow-2xl border-none"
        >
          <Loader2 className="animate-spin text-electric-blue mb-4" size={40} />
          <p className="text-slate-900 dark:text-white font-bold tracking-tight">Syncing profile...</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Fetching your island data</p>
        </motion.div>
      </div>
    );
  }

  if (user && userData && !userData.profileSetupCompleted) {
    return <ProfileSetup />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-mesh overflow-hidden font-sans transition-colors duration-300">
      {/* Header */}
      <header className="glass dark:glass-dark px-4 sm:px-6 py-3 z-30 flex justify-between items-center sticky top-0 rounded-b-3xl mx-2 mt-2 shadow-lg border-b border-white/40 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-electric-blue rounded-full flex items-center justify-center shadow-md shadow-electric-blue/20">
            <Logo className="text-white" size={18} />
          </div>
          <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white tracking-tight">GiliHub</h1>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-electric-blue dark:hover:text-electric-blue hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all font-bold text-[10px] uppercase tracking-widest"
            title="Toggle Language"
          >
            {language === 'id' ? 'ID' : 'EN'}
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-electric-blue dark:hover:text-electric-blue hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-2 pl-1">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-none">{userData?.displayName}</span>
              <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{userData?.role || 'User'}</span>
            </div>
            <button 
              onClick={() => setActiveTab('profile')}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 overflow-hidden shadow-sm hover:ring-2 hover:ring-electric-blue/30 transition-all"
            >
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <User size={18} />
                </div>
              )}
            </button>
            <button 
              onClick={signOut}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all group"
              title="Sign Out"
            >
              <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-0 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
            {activeTab === 'map' && <InteractiveMap />}
            {activeTab === 'booking' && <BookingList />}
            {activeTab === 'events' && <EventCalendar />}
            {activeTab === 'forum' && <ForumList />}
            {activeTab === 'chat' && <ChatList />}
            {activeTab === 'planner' && <TripPlanner />}
            {activeTab === 'profile' && <UserProfile setActiveTab={setActiveTab} />}
            {activeTab === 'about' && <About onBack={() => setActiveTab('settings')} />}
            {activeTab === 'settings' && <Settings onBack={() => setActiveTab('profile')} setActiveTab={setActiveTab} />}
            {activeTab === 'privacy' && <PrivacyPolicy onBack={() => setActiveTab('settings')} />}
            {activeTab === 'terms' && <TermsConditions onBack={() => setActiveTab('settings')} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar */}
      <AnimatePresence>
        {isBottomNavVisible && (
          <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none pb-[calc(env(safe-area-inset-bottom)+1rem)] px-4 flex justify-center">
            <motion.nav 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="glass dark:glass-dark px-2 py-2 flex justify-around items-center shadow-xl rounded-full pointer-events-auto w-full max-w-md border border-white/40 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl"
            >
              <NavButton 
                active={activeTab === 'home'} 
                onClick={() => setActiveTab('home')} 
                icon={<HomeIcon size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />} 
                label="Home" 
              />
              <NavButton 
                active={activeTab === 'map'} 
                onClick={() => setActiveTab('map')} 
                icon={<MapIcon size={22} strokeWidth={activeTab === 'map' ? 2.5 : 2} />} 
                label="Map" 
              />
              <NavButton 
                active={activeTab === 'booking'} 
                onClick={() => setActiveTab('booking')} 
                icon={<LayoutGrid size={22} strokeWidth={activeTab === 'booking' ? 2.5 : 2} />} 
                label="Booking" 
              />
              <NavButton 
                active={activeTab === 'events'} 
                onClick={() => setActiveTab('events')} 
                icon={<CalendarDays size={22} strokeWidth={activeTab === 'events' ? 2.5 : 2} />} 
                label="Events" 
              />
              <NavButton 
                active={activeTab === 'forum'} 
                onClick={() => setActiveTab('forum')} 
                icon={<MessageSquare size={22} strokeWidth={activeTab === 'forum' ? 2.5 : 2} />} 
                label="Forum" 
              />
              <NavButton 
                active={activeTab === 'planner'} 
                onClick={() => setActiveTab('planner')} 
                icon={<Calendar size={22} strokeWidth={activeTab === 'planner' ? 2.5 : 2} />} 
                label="Planner" 
              />
              <NavButton 
                active={activeTab === 'chat'} 
                onClick={() => setActiveTab('chat')} 
                icon={<MessageCircle size={22} strokeWidth={activeTab === 'chat' ? 2.5 : 2} />} 
                label="Chat" 
              />
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
      <GiliBot />

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setShowExitConfirm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm glass dark:glass-dark rounded-3xl p-6 shadow-2xl border-none overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-electric-blue to-electric-blue-dark"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-500">
                  <LogOut size={24} />
                </div>
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <h3 className="text-xl font-display font-semibold text-slate-900 dark:text-white tracking-tight mb-2">
                Exit Application?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to exit GiliHub? You can always come back later.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleExitApp}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all active:scale-95"
                >
                  Exit App
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function NavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all relative group ${
        active 
          ? 'text-white bg-electric-blue shadow-lg shadow-electric-blue/30 scale-110' 
          : 'text-slate-500 dark:text-slate-400 hover:text-electric-blue dark:hover:text-electric-blue-light hover:bg-slate-100 dark:hover:bg-slate-800/50'
      }`}
    >
      <motion.div 
        animate={{ y: active ? -8 : 0 }}
        className="relative z-10"
      >
        {icon}
      </motion.div>
      <AnimatePresence>
        {active && (
          <motion.span 
            initial={{ opacity: 0, y: 5, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.8 }}
            className="text-[9px] font-bold tracking-wide absolute bottom-2"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <UIProvider>
              <ProfileModalProvider>
                <MainApp />
                <PublicProfileModal />
                <Toaster position="top-center" richColors />
              </ProfileModalProvider>
            </UIProvider>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
