import React, { useState, useEffect } from 'react';
import { Users, MapPin, MessageCircle, UserPlus, Loader2, ChevronRight, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  avatar: string;
  location: string;
  nationality: string;
  isOnline: boolean;
  role: string;
}

export default function ActiveMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://randomuser.me/api/?results=8&nat=us,gb,au,id,de,fr');
      const data = await response.json();
      
      const mappedMembers = data.results.map((user: any) => ({
        id: user.login.uuid,
        name: `${user.name.first} ${user.name.last}`,
        avatar: user.picture.large,
        location: user.location.city,
        nationality: user.nat,
        isOnline: Math.random() > 0.3,
        role: Math.random() > 0.7 ? 'Local Guide' : (Math.random() > 0.5 ? 'Traveler' : 'Resident')
      }));
      
      setMembers(mappedMembers);
      setError(null);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load community members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleMessage = (name: string) => {
    toast.info(`Opening chat with ${name}`, {
      description: "This feature will be available soon!",
    });
  };

  const handleFollow = (name: string) => {
    toast.success(`Following ${name}`, {
      description: "You'll now see their updates in your feed.",
    });
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h3 className="text-xl font-display font-semibold text-slate-900 dark:text-white tracking-tight uppercase">Meet the Community</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase mt-1">Active travelers & locals on Gili T</p>
        </div>
        <button 
          onClick={fetchMembers}
          className="p-2.5 glass dark:glass-dark rounded-2xl text-slate-500 hover:text-electric-blue transition-all active:scale-90"
          title="Refresh Members"
        >
          <Users size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 glass dark:glass-dark rounded-[2.5rem] border-none shadow-xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-electric-blue" size={32} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Finding people...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 glass dark:glass-dark rounded-[2.5rem] border-none shadow-xl text-center">
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">{error}</p>
          <button 
            onClick={fetchMembers}
            className="mt-4 text-electric-blue font-bold text-xs uppercase tracking-widest hover:underline"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="glass dark:glass-dark rounded-[2rem] p-4 border-none shadow-xl hover:shadow-2xl hover:shadow-electric-blue/10 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-electric-blue/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative mb-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg group-hover:scale-105 transition-transform duration-500">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {member.isOnline && (
                    <div className="absolute bottom-0 right-1/2 translate-x-6 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-lg"></div>
                  )}
                </div>

                <div className="text-center mb-4">
                  <h4 className="text-sm font-display font-semibold text-slate-900 dark:text-white tracking-tight line-clamp-1">{member.name}</h4>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="text-[9px] font-bold text-electric-blue dark:text-electric-blue-light uppercase tracking-widest px-2 py-0.5 bg-electric-blue/10 rounded-full">
                      {member.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <MapPin size={10} className="text-slate-400" />
                    <span className="text-[9px] font-bold uppercase tracking-wide truncate">{member.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Globe size={10} className="text-slate-400" />
                    <span className="text-[9px] font-bold uppercase tracking-wide">{member.nationality}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleMessage(member.name)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-electric-blue hover:text-white p-2 rounded-xl transition-all active:scale-90 text-slate-500 dark:text-slate-400"
                  >
                    <MessageCircle size={14} className="mx-auto" />
                  </button>
                  <button 
                    onClick={() => handleFollow(member.name)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-electric-blue hover:text-white p-2 rounded-xl transition-all active:scale-90 text-slate-500 dark:text-slate-400"
                  >
                    <UserPlus size={14} className="mx-auto" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      <div className="mt-6 flex justify-center">
        <button className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-electric-blue uppercase tracking-[0.2em] transition-colors group">
          View all community members
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
