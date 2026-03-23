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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="relative">
          <div className="bg-sky-600 h-24"></div>
          <button 
            onClick={closeProfile}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 pb-6 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-sky-500 mb-4" />
              <p className="text-slate-500">Loading profile...</p>
            </div>
          ) : profileData ? (
            <>
              <div className="flex justify-between items-end -mt-12 mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center shadow-md">
                  {profileData.photoURL ? (
                    <img src={profileData.photoURL} alt={profileData.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={40} className="text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                
                {currentUser && currentUser.uid !== selectedUserId && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${
                      isFollowing 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400' 
                        : 'bg-sky-500 text-white hover:bg-sky-600'
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

              <div className="flex items-center gap-1.5 mb-3">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{profileData.displayName}</h3>
                {profileData.role === 'admin' && (
                  <BadgeCheck className="text-blue-500" size={20} fill="currentColor" stroke="white" />
                )}
              </div>
              
              {profileData.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-4 whitespace-pre-wrap">{profileData.bio}</p>
              )}
              
              <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-800 dark:text-white">{profileData.followersCount || 0}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Followers</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-800 dark:text-white">{profileData.followingCount || 0}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Following</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-slate-500">Profile not available</div>
          )}
        </div>
      </div>
    </div>
  );
}
