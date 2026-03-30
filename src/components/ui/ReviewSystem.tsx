import React, { useState, useEffect } from 'react';
import { 
  Star, MessageSquare, Send, Loader2, User, 
  Trash2, Filter, ChevronDown, ChevronUp 
} from 'lucide-react';
import { 
  collection, onSnapshot, addDoc, query, orderBy, 
  where, doc, deleteDoc, limit 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';

interface ReviewSystemProps {
  targetId: string;
  targetType: 'service' | 'location' | 'event' | 'island';
}

export default function ReviewSystem({ targetId, targetType }: ReviewSystemProps) {
  const { user, userData } = useAuth();
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!targetId) return;

    const q = query(
      collection(db, 'reviews'),
      where('targetId', '==', targetId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [targetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to leave a review');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please add a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        targetId,
        targetType,
        userId: user.uid,
        userName: userData?.displayName || 'Traveler',
        userPhoto: userData?.photoURL || '',
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      });
      setComment('');
      setRating(5);
      toast.success('Review submitted!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      toast.success('Review deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reviews/${reviewId}`);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-500 shadow-lg">
            <Star size={24} fill="currentColor" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{averageRating} / 5.0</h4>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{reviews.length} {t('reviews')}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      {user && (
        <form onSubmit={handleSubmit} className="glass dark:glass-dark p-6 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setRating(num)}
                className={`p-1 transition-all ${rating >= num ? 'text-amber-400 scale-110' : 'text-slate-300 dark:text-slate-700'}`}
              >
                <Star size={24} fill={rating >= num ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('comment')}
            className="w-full bg-white/50 dark:bg-slate-900/50 border border-white/20 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all dark:text-white resize-none"
            rows={3}
          />
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-electric-blue hover:bg-electric-blue-dark text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-electric-blue/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            {t('submit')}
          </button>
        </form>
      )}

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-electric-blue" size={30} />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-10">{t('no_reviews')}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {displayedReviews.map((review, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={review.id}
                  className="glass dark:glass-dark p-5 rounded-[2rem] border border-white/10 dark:border-white/5 shadow-lg flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-white/20">
                        {review.userPhoto ? (
                          <img src={review.userPhoto} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User size={18} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">{review.userName}</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={10} className={review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {(user?.uid === review.userId || userData?.role === 'admin') && (
                      <button onClick={() => handleDelete(review.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{review.comment}</p>
                </motion.div>
              ))}
            </div>

            {reviews.length > 3 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-electric-blue transition-all flex items-center justify-center gap-2"
              >
                {showAll ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Show All {reviews.length} Reviews</>}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
