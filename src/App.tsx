import { useState, useEffect } from 'react';
import InteractiveMap from './components/map/InteractiveMap';
import BookingList from './components/booking/BookingList';
import ForumList from './components/community/ForumList';
import UserProfile from './components/profile/UserProfile';
import ChatList from './components/chat/ChatList';
import EventCalendar from './components/events/EventCalendar';
import Login from './components/auth/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ProfileModalProvider } from './contexts/ProfileModalContext';
import PublicProfileModal from './components/profile/PublicProfileModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LogOut, User, MessageCircle, Calendar, Map as MapIcon, CalendarDays, MessageSquare, UserCircle, LayoutGrid, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './components/Logo';
import { Toaster } from 'sonner';

function MainApp() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'map' | 'booking' | 'events' | 'forum' | 'chat' | 'profile'>('map');
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

  const navItems = [
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'booking', label: 'Booking', icon: LayoutGrid },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'forum', label: 'Forum', icon: MessageSquare },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-5 py-3 z-20 flex justify-between items-center sticky top-0 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center shadow-md shadow-sky-500/20">
            <Logo className="text-white" size={22} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h1 className="text-[1.35rem] font-black text-slate-900 dark:text-white tracking-tight leading-none">GiliHub</h1>
              {user?.isAnonymous && (
                <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider rounded border border-amber-200/50 dark:border-amber-800/50">
                  Guest
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                {isOnline ? 'Live' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-all active:scale-95"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={20} strokeWidth={2.5} /> : <Sun size={20} strokeWidth={2.5} />}
          </button>
          <button 
            onClick={signOut}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-95"
            title="Sign Out"
          >
            <LogOut size={20} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Guest Warning Banner */}
      {user?.isAnonymous && (
        <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-200 dark:bg-amber-800/50 rounded-lg">
              <User size={16} className="text-amber-700 dark:text-amber-400" />
            </div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Peringatan: Akun guest akan dihapus setelah 30 hari. <button onClick={signOut} className="font-bold underline hover:text-amber-900 dark:hover:text-amber-200">Kaitkan akun anda sekarang!</button>
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative z-0 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            {activeTab === 'map' && <InteractiveMap />}
            {activeTab === 'booking' && <BookingList />}
            {activeTab === 'events' && <EventCalendar />}
            {activeTab === 'forum' && <ForumList />}
            {activeTab === 'chat' && <ChatList />}
            {activeTab === 'profile' && <UserProfile />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-0 right-0 px-6 z-30 pointer-events-none">
        <nav className="max-w-md mx-auto bg-slate-900/90 dark:bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex justify-around items-center shadow-2xl pointer-events-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'text-white bg-sky-600 shadow-lg shadow-sky-600/40 scale-110' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                {isActive && (
                  <motion.div 
                    layoutId="nav-pill"
                    className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                  />
                )}
                <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ProfileModalProvider>
            <MainApp />
            <PublicProfileModal />
            <Toaster position="top-center" richColors />
          </ProfileModalProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
