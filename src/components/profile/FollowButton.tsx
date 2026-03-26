import { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface FollowButtonProps {
  targetUserId: string;
}

export default function FollowButton({ targetUserId }: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.uid === targetUserId) return;

    const checkFollowStatus = async () => {
      const followDocRef = doc(db, 'follows', `${user.uid}_${targetUserId}`);
      const followDoc = await getDoc(followDocRef);
      setIsFollowing(followDoc.exists());
      setIsLoading(false);
    };

    checkFollowStatus();
  }, [user, targetUserId]);

  const handleFollow = async () => {
    if (!user || user.uid === targetUserId) return;
    setIsLoading(true);

    try {
      const followDocRef = doc(db, 'follows', `${user.uid}_${targetUserId}`);
      if (isFollowing) {
        await deleteDoc(followDocRef);
        setIsFollowing(false);
        toast.success('Unfollowed');
      } else {
        await setDoc(followDocRef, {
          followerId: user.uid,
          followingId: targetUserId,
          createdAt: serverTimestamp()
        });
        setIsFollowing(true);
        toast.success('Followed');
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.uid === targetUserId) return null;

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
        isFollowing
          ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
          : 'bg-sky-600 text-white hover:bg-sky-700'
      }`}
    >
      {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
