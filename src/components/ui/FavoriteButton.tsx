import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface FavoriteButtonProps {
  targetId: string;
  targetType: 'service' | 'location' | 'event';
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ targetId, targetType, className = "" }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const favoriteId = `${user.uid}_${targetId}`;
    const unsub = onSnapshot(doc(db, 'favorites', favoriteId), (doc) => {
      setIsFavorite(doc.exists());
      setLoading(false);
    });

    return () => unsub();
  }, [user, targetId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error(t('please_login'));
      return;
    }

    const favoriteId = `${user.uid}_${targetId}`;
    const favoriteRef = doc(db, 'favorites', favoriteId);

    try {
      if (isFavorite) {
        await deleteDoc(favoriteRef);
        toast.success(t('remove_favorite'));
      } else {
        await setDoc(favoriteRef, {
          userId: user.uid,
          targetId,
          targetType,
          createdAt: new Date().toISOString()
        });
        toast.success(t('add_favorite'));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error(t('error_occurred'));
    }
  };

  if (loading) return null;

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleFavorite}
      className={`p-2 rounded-full transition-colors ${
        isFavorite 
          ? 'bg-red-50 text-red-500' 
          : 'bg-gray-100 text-gray-400 hover:text-red-500'
      } ${className}`}
      title={isFavorite ? t('remove_favorite') : t('add_favorite')}
    >
      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
    </motion.button>
  );
};

export default FavoriteButton;
