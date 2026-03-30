import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { User, Globe, MapPin, Heart, ArrowRight, Loader2, Camera, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetup() {
  const { user, userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    photoURL: userData?.photoURL || '',
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

      const avatarUrl = formData.photoURL || userData?.photoURL || `https://api.dicebear.com/7.x/lorelei/svg?seed=${formData.displayName || 'Guest'}`;

      const updateData = {
        ...formData,
        photoURL: avatarUrl,
        profileSetupCompleted: true,
        updatedAt: new Date().toISOString()
      };

      await setDoc(userRef, updateData, { merge: true });
      await setDoc(publicUserRef, {
        displayName: formData.displayName,
        photoURL: avatarUrl,
        bio: formData.bio,
        profileSetupCompleted: true,
        updatedAt: updateData.updatedAt
      }, { merge: true });

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
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-electric-blue/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-electric-blue/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Side: Info */}
          <div className="md:w-1/3 bg-electric-blue p-8 text-white flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <User size={24} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter leading-tight mb-4">
                TELL US <br /> ABOUT <br /> YOU.
              </h2>
              <p className="text-electric-blue-light text-sm font-medium leading-relaxed">
                Welcome to GiliHub! We're thrilled to have you. This quick setup helps us personalize your island experience. Once you're done, you'll be ready to explore, book, and connect with the Gili community.
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
            <div className="flex items-center gap-4 mb-8">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shadow-inner border border-slate-200 dark:border-slate-700">
                  <img 
                    src={formData.photoURL || `https://api.dicebear.com/7.x/lorelei/svg?seed=${formData.displayName || 'Guest'}`} 
                    alt="Avatar Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const styles = ['lorelei', 'avataaars', 'bottts', 'adventurer', 'open-peeps', 'pixel-art', 'notionists', 'rings'];
                    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
                    const newAvatar = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${formData.displayName || 'Guest'}-${Date.now()}`;
                    setFormData({...formData, photoURL: newAvatar});
                  }}
                  className="absolute -bottom-1 -right-1 p-1 bg-electric-blue text-white rounded-full shadow-lg hover:bg-electric-blue/90 transition-all"
                  title="Generate Random Avatar"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Your Avatar</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Customize your look for the community</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Your Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-electric-blue transition-colors" size={18} />
                    <input 
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      placeholder="How should we call you?"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue transition-all font-medium dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Where are you from?</label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-electric-blue transition-colors" size={18} />
                    <select 
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue transition-all font-medium dark:text-white appearance-none"
                      required
                    >
                      <option value="" disabled>Select your country</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Gender (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {genders.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({...formData, gender: g})}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          formData.gender === g 
                            ? 'bg-electric-blue text-white shadow-lg shadow-electric-blue/20' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-electric-blue'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Short Bio</label>
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell us a bit about yourself..."
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue transition-all font-medium dark:text-white min-h-[100px] resize-none"
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
