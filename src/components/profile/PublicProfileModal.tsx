import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileModal } from '../../contexts/ProfileModalContext';
import { X, User, Loader2, UserPlus, UserMinus, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';

export default function PublicProfileModal() {
  const { selectedUserId, closeProfile } = useProfileModal();
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!selectedUserId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'users_public', selectedUserId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfileData(docSnap.data());
        } else {
          toast.error('User not found');
          closeProfile();
        }

        // Check if following
        if (currentUser && currentUser.uid !== selectedUserId) {
          const followId = `${currentUser.uid}_${selectedUserId}`;
          const followRef = doc(db, 'follows', followId);
          const followSnap = await getDoc(followRef);
          setIsFollowing(followSnap.exists());
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [selectedUserId, currentUser, closeProfile]);

  if (!selectedUserId) return null;

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error('Please sign in to follow users');
      return;
    }

    if (currentUser.uid === selectedUserId) return;

    setFollowLoading(true);
    const followId = `${currentUser.uid}_${selectedUserId}`;
    const followRef = doc(db, 'follows', followId);
    
    // References for counters
    const currentUserRef = doc(db, 'users', currentUser.uid);
    const currentUserPublicRef = doc(db, 'users_public', currentUser.uid);
    const targetUserRef = doc(db, 'users', selectedUserId);
    const targetUserPublicRef = doc(db, 'users_public', selectedUserId);

    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(followRef);
        
        // Update counters
        await updateDoc(currentUserRef, { followingCount: increment(-1) });
        await updateDoc(currentUserPublicRef, { followingCount: increment(-1) });
        await updateDoc(targetUserRef, { followersCount: increment(-1) });
        await updateDoc(targetUserPublicRef, { followersCount: increment(-1) });
        
        setIsFollowing(false);
        setProfileData((prev: any) => ({ ...prev, followersCount: Math.max(0, (prev.followersCount || 0) - 1) }));
        toast.success(`Unfollowed ${profileData?.displayName}`);
      } else {
        // Follow
        await setDoc(followRef, {
          followerId: currentUser.uid,
          followingId: selectedUserId,
          createdAt: new Date().toISOString()
        });
        
        // Update counters
        await updateDoc(currentUserRef, { followingCount: increment(1) });
        await updateDoc(currentUserPublicRef, { followingCount: increment(1) });
        await updateDoc(targetUserRef, { followersCount: increment(1) });
        await updateDoc(targetUserPublicRef, { followersCount: increment(1) });
        
        setIsFollowing(true);
        setProfileData((prev: any) => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
        toast.success(`Following ${profileData?.displayName}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'follows');
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div className="glass dark:glass-dark rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20 dark:border-white/10">
        <div className="relative">
          <div className="bg-gradient-to-r from-electric-blue to-electric-blue-dark h-32"></div>
          <button 
            onClick={closeProfile}
            className="absolute top-4 right-4 p-2.5 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-xl transition-all active:scale-90 border border-white/20"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-8 pb-8 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={40} className="animate-spin text-electric-blue mb-4" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Loading profile...</p>
            </div>
          ) : profileData ? (
            <>
              <div className="flex justify-between items-end -mt-16 mb-6">
                <div className="w-32 h-32 rounded-[40px] border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                  {profileData.photoURL ? (
                    <img src={profileData.photoURL} alt={profileData.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={48} className="text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                
                {currentUser && currentUser.uid !== selectedUserId && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                      isFollowing 
                        ? 'glass dark:glass-dark text-slate-700 dark:text-slate-300 hover:bg-rose-500 hover:text-white border-white/20' 
                        : 'bg-electric-blue text-white hover:bg-electric-blue-dark shadow-electric-blue/20'
                    }`}
                  >
                    {followLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus size={16} />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profileData.displayName}</h3>
                {profileData.role === 'admin' && (
                  <BadgeCheck className="text-electric-blue" size={24} fill="currentColor" stroke="white" />
                )}
              </div>
              
              {profileData.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6 whitespace-pre-wrap font-medium leading-relaxed">{profileData.bio}</p>
              )}
              
              {profileData.interests && profileData.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {profileData.interests.map((interest: string) => (
                    <span key={interest} className="text-[10px] font-black uppercase tracking-widest bg-electric-blue/10 dark:bg-electric-blue/20 text-electric-blue dark:text-electric-blue-light px-3 py-1.5 rounded-xl border border-electric-blue/20">{interest}</span>
                  ))}
                </div>
              )}
              
              <div className="flex gap-8 mt-6 pt-6 border-t border-white/10 dark:border-white/5">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profileData.followersCount || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">Followers</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profileData.followingCount || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">Following</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 font-black uppercase tracking-widest text-xs">Profile not available</div>
          )}
        </div>
      </div>
    </div>
  );
}
