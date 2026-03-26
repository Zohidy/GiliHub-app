import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { User, Globe, MapPin, Heart, ArrowRight, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetup() {
  const { user, userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    country: '',
    gender: '',
    bio: '',
    interests: [] as string[]
  });

  const countries = [
    'Indonesia', 'Australia', 'United Kingdom', 'United States', 'Germany', 
    'France', 'Netherlands', 'Italy', 'Spain', 'Canada', 'Japan', 'South Korea',
    'Singapore', 'Malaysia', 'Thailand', 'Other'
  ];

  const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const publicUserRef = doc(db, 'users_public', user.uid);

      const updateData = {
        ...formData,
        profileSetupCompleted: true,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(userRef, updateData);
      await updateDoc(publicUserRef, {
        displayName: formData.displayName,
        bio: formData.bio,
        profileSetupCompleted: true
      });

      toast.success('Profile setup completed!');
      // The AuthContext will pick up the changes via its effect if we were using onSnapshot, 
      // but here we might need a page refresh or manual state update if not handled.
      // Actually, AuthContext uses getDoc in an effect triggered by 'user' change.
      // We might need to trigger a re-sync or just wait for the next render ifuserData is updated.
      window.location.reload(); // Simple way to ensure everything is synced
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-sky-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Side: Info */}
          <div className="md:w-1/3 bg-sky-600 p-8 text-white flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <User size={24} />
              </div>
              <h2 className="text-3xl font-black tracking-tighter leading-tight mb-4">
                TELL US <br /> ABOUT <br /> YOU.
              </h2>
              <p className="text-sky-100 text-sm font-medium leading-relaxed">
                Complete your profile to get the best experience on GiliHub and connect with other travelers.
              </p>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                Step 1 of 1
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="md:w-2/3 p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Your Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                    <input 
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      placeholder="How should we call you?"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Where are you from?</label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                    <select 
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium dark:text-white appearance-none"
                      required
                    >
                      <option value="" disabled>Select your country</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Gender (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {genders.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({...formData, gender: g})}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          formData.gender === g 
                            ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-sky-500'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Short Bio</label>
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell us a bit about yourself..."
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium dark:text-white min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Complete Setup
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
