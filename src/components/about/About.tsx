import { Info, ShieldCheck, FileText, Heart, Map, Users, Calendar, MessageCircle, ChevronLeft } from 'lucide-react';
import { Logo } from '../Logo';

interface AboutProps {
  onBack?: () => void;
}

export default function About({ onBack }: AboutProps) {
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 pb-32 transition-colors duration-300">
      <div className="flex items-center gap-3 mb-8">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-electric-blue transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">About GiliHub</h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Your island companion</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center text-center mb-6">
        <div className="w-20 h-20 bg-electric-blue rounded-2xl flex items-center justify-center shadow-lg shadow-electric-blue/20 mb-4">
          <Logo className="text-white" size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">GiliHub</h1>
        <p className="text-sm font-bold text-electric-blue dark:text-electric-blue-light uppercase tracking-widest mb-4">Version 1.0.0</p>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
          Your ultimate companion for exploring the Gili Islands. Discover hidden gems, connect with fellow travelers, and make the most of your island escape.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight mb-3 px-2">Key Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FeatureCard 
            icon={<Map className="text-emerald-500" size={24} />}
            title="Interactive Map"
            description="Explore the islands with our detailed, offline-ready map featuring points of interest."
            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <FeatureCard 
            icon={<Users className="text-electric-blue" size={24} />}
            title="Community Forum"
            description="Ask questions, share tips, and connect with locals and other travelers."
            bgColor="bg-electric-blue/10 dark:bg-electric-blue/20"
          />
          <FeatureCard 
            icon={<Calendar className="text-rose-500" size={24} />}
            title="Events & Bookings"
            description="Stay updated on island events and book activities directly through the app."
            bgColor="bg-rose-50 dark:bg-rose-900/20"
          />
          <FeatureCard 
            icon={<MessageCircle className="text-electric-blue" size={24} />}
            title="Real-time Chat"
            description="Message other users instantly to coordinate meetups or share experiences."
            bgColor="bg-electric-blue/10 dark:bg-electric-blue/20"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 mb-6">
        <div className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
            <ShieldCheck size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800 dark:text-white">Privacy Policy</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">How we handle your data</p>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
            <FileText size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800 dark:text-white">Terms of Service</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Rules and guidelines</p>
          </div>
        </div>
      </div>

      <div className="text-center pb-8">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
          Made with <Heart size={12} className="text-rose-500" /> for the Gili Islands
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">
          © {new Date().getFullYear()} GiliHub. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, bgColor }: { icon: React.ReactNode, title: string, description: string, bgColor: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor} mb-2`}>
        {icon}
      </div>
      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
