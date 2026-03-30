import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Bell, Globe, ChevronRight, Download, CircleDollarSign, Ruler, Info, ChevronLeft, Shield, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsProps {
  onBack: () => void;
  setActiveTab: (tab: 'home' | 'map' | 'booking' | 'events' | 'forum' | 'chat' | 'profile' | 'about' | 'settings' | 'privacy' | 'terms') => void;
}

export default function Settings({ onBack, setActiveTab }: SettingsProps) {
  const { theme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineReady, setOfflineReady] = useState(false);
  const [currency, setCurrency] = useState('IDR');
  const [distanceUnit, setDistanceUnit] = useState('km');

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto"
    >
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-4 py-4 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Settings</h1>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">App preferences & legal</p>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        {/* App Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">App Preferences</h3>
          </div>
          
          {/* Dark Mode */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={toggleTheme}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-electric-blue/10 dark:bg-electric-blue/20 flex items-center justify-center text-electric-blue dark:text-electric-blue-light">
                {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Dark Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Toggle dark theme</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${theme === 'dark' ? 'bg-electric-blue' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Notifications */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Bell size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Push notifications</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Language */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-electric-blue/10 dark:bg-electric-blue/20 flex items-center justify-center text-electric-blue dark:text-electric-blue-light">
                <Globe size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Language</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">English (US)</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </div>

          {/* Offline Data */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setOfflineReady(!offlineReady)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Download size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Offline Maps & Data</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Save content to device</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${offlineReady ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${offlineReady ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Currency */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setCurrency(currency === 'IDR' ? 'USD' : 'IDR')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <CircleDollarSign size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Currency</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">For bookings and prices</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{currency}</span>
              <ChevronRight size={18} className="text-slate-400" />
            </div>
          </div>

          {/* Distance Unit */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setDistanceUnit(distanceUnit === 'km' ? 'mi' : 'km')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Ruler size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Distance Unit</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kilometers or Miles</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{distanceUnit === 'km' ? 'Kilometers' : 'Miles'}</span>
              <ChevronRight size={18} className="text-slate-400" />
            </div>
          </div>
        </div>

        {/* Legal & Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Legal & Info</h3>
          </div>

          {/* About GiliHub */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setActiveTab('about')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-electric-blue/10 dark:bg-electric-blue/20 flex items-center justify-center text-electric-blue dark:text-electric-blue-light">
                <Info size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">About GiliHub</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">App info and features</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </div>

          {/* Privacy Policy */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setActiveTab('privacy')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Shield size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Privacy Policy</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">How we handle your data</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </div>

          {/* Terms & Conditions */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setActiveTab('terms')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Terms & Conditions</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Rules and guidelines</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </div>

        </div>
      </div>
    </motion.div>
  );
}
