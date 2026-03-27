import { useState, useEffect } from 'react';
import Home from './components/home/Home';
import InteractiveMap from './components/map/InteractiveMap';
import BookingList from './components/booking/BookingList';
import ForumList from './components/community/ForumList';
import UserProfile from './components/profile/UserProfile';
import ChatList from './components/chat/ChatList';
import EventCalendar from './components/events/EventCalendar';
import Login from './components/auth/Login';
import ProfileSetup from './components/auth/ProfileSetup';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ProfileModalProvider } from './contexts/ProfileModalContext';
import { UIProvider, useUI } from './contexts/UIContext';
import PublicProfileModal from './components/profile/PublicProfileModal';
import GiliBot from './components/chat/GiliBot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LogOut, User, MessageCircle, Calendar, Map as MapIcon, CalendarDays, MessageSquare, UserCircle, LayoutGrid, Sun, Moon, Home as HomeIcon, ChevronLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './components/Logo';
import { Toaster } from 'sonner';

function MainApp() {
  const { user, userData, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isBottomNavVisible } = useUI();
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'booking' | 'events' | 'forum' | 'chat' | 'profile'>('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-sky-500 rounded-2xl shadow-xl shadow-sky-500/20 mb-6 flex items-center justify-center"
        >
          <Logo className="text-white" size={32} />
        </motion.div>
        <p className="text-white font-display font-bold text-lg tracking-tight">GiliHub</p>
        <p className="text-slate-500 text-xs mt-2 font-medium">Preparing your island guide...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Check if profile setup is needed
  if (user && !userData) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin text-sky-500 mb-4" size={40} />
        <p className="text-slate-400 font-medium">Syncing profile...</p>
      </div>
    );
  }

  if (user && userData && !userData.profileSetupCompleted) {
    return <ProfileSetup />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 z-20 flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-600/20">
            <Logo className="text-white" size={20} />
          </div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">GiliHub</h1>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-2 pl-1">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-none">{userData?.displayName}</span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{userData?.role || 'User'}</span>
            </div>
            <button 
              onClick={() => setActiveTab('profile')}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 overflow-hidden shadow-sm hover:ring-2 hover:ring-sky-500/20 transition-all"
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
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all group"
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
            {activeTab === 'profile' && <UserProfile />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar */}
      <AnimatePresence>
        {isBottomNavVisible && (
          <motion.nav 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 py-3 pb-8 sm:pb-3 flex justify-around items-center sticky bottom-0 z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-none"
          >
            <NavButton 
              active={activeTab === 'home'} 
              onClick={() => setActiveTab('home')} 
              icon={<HomeIcon size={20} />} 
              label="Home" 
            />
            <NavButton 
              active={activeTab === 'map'} 
              onClick={() => setActiveTab('map')} 
              icon={<MapIcon size={20} />} 
              label="Map" 
            />
            <NavButton 
              active={activeTab === 'booking'} 
              onClick={() => setActiveTab('booking')} 
              icon={<LayoutGrid size={20} />} 
              label="Booking" 
            />
            <NavButton 
              active={activeTab === 'events'} 
              onClick={() => setActiveTab('events')} 
              icon={<CalendarDays size={20} />} 
              label="Events" 
            />
            <NavButton 
              active={activeTab === 'forum'} 
              onClick={() => setActiveTab('forum')} 
              icon={<MessageSquare size={20} />} 
              label="Forum" 
            />
            <NavButton 
              active={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')} 
              icon={<MessageCircle size={20} />} 
              label="Chat" 
            />
          </motion.nav>
        )}
      </AnimatePresence>
      <GiliBot />
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
      className={`flex flex-col items-center gap-1.5 transition-all relative group ${
        active 
          ? 'text-sky-600 dark:text-sky-400' 
          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
      }`}
    >
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-sky-50 dark:bg-sky-900/30 scale-110' : 'group-hover:bg-slate-50 dark:group-hover:bg-slate-800'}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest transition-all ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -top-3 w-10 h-1 bg-sky-600 dark:bg-sky-400 rounded-full shadow-[0_0_10px_rgba(2,132,199,0.5)]"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <UIProvider>
            <ProfileModalProvider>
              <MainApp />
              <PublicProfileModal />
              <Toaster position="top-center" richColors />
            </ProfileModalProvider>
          </UIProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
