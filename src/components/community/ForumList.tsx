import React, { useState, useEffect } from 'react';
import { 
  Mic, MessageSquare, Users, Radio, Clock, User, Plus, X, 
  ArrowLeft, Send, Filter, ThumbsUp, ChevronRight, Hash,
  Search, MoreVertical, Share2, MessageCircle, BadgeCheck, Loader2, Edit2, Trash2
} from 'lucide-react';
import { 
  collection, onSnapshot, addDoc, query, orderBy, doc, 
  updateDoc, increment, where, arrayUnion, arrayRemove, deleteDoc, getDocs 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileModal } from '../../contexts/ProfileModalContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { motion, AnimatePresence } from 'motion/react';
import { useUI } from '../../contexts/UIContext';
import { toast } from 'sonner';
import ConfirmModal from '../ui/ConfirmModal';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: <Hash size={14} /> },
  { id: 'general', label: 'General', icon: <MessageSquare size={14} /> },
  { id: 'tips', label: 'Tips', icon: <Hash size={14} /> },
  { id: 'food', label: 'Food', icon: <Hash size={14} /> },
  { id: 'transport', label: 'Transport', icon: <Hash size={14} /> },
  { id: 'party', label: 'Party', icon: <Hash size={14} /> },
  { id: 'diving', label: 'Diving', icon: <Hash size={14} /> },
  { id: 'snorkeling', label: 'Snorkeling', icon: <Hash size={14} /> },
  { id: 'accommodation', label: 'Stay', icon: <Hash size={14} /> },
  { id: 'help', label: 'Help', icon: <Hash size={14} /> },
];

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-electric-blue/10 dark:bg-electric-blue/20 text-electric-blue dark:text-electric-blue-light border-electric-blue/20 dark:border-electric-blue/30',
  tips: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  food: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  transport: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  party: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  diving: 'bg-electric-blue/10 dark:bg-electric-blue/20 text-electric-blue dark:text-electric-blue-light border-electric-blue/20 dark:border-electric-blue/30',
  snorkeling: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  accommodation: 'bg-electric-blue/10 dark:bg-electric-blue/20 text-electric-blue dark:text-electric-blue-light border-electric-blue/20 dark:border-electric-blue/30',
  help: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
};

export default function ForumList() {
  const { user, userData } = useAuth();
  const { openProfile } = useProfileModal();
  const { setBottomNavVisible, showImageViewer } = useUI();
  const [threads, setThreads] = useState<any[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [audioRooms, setAudioRooms] = useState<any[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadImageUrl, setNewThreadImageUrl] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'replies' | 'likes'>('recent');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Thread Detail State
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingThread, setEditingThread] = useState<any | null>(null);
  const [editingComment, setEditingComment] = useState<any | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Audio Room State
  const [joinedRoom, setJoinedRoom] = useState<any | null>(null);

  useEffect(() => {
    if (isCreatingThread || selectedThread || joinedRoom) {
      setBottomNavVisible(false);
    } else {
      setBottomNavVisible(true);
    }
    return () => setBottomNavVisible(true);
  }, [isCreatingThread, selectedThread, joinedRoom]);

  useEffect(() => {
    const threadsQuery = query(collection(db, 'threads'), orderBy('createdAt', 'desc'));
    const unsubscribeThreads = onSnapshot(threadsQuery, (snapshot) => {
      const threadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setThreads(threadsData);
      setIsLoadingThreads(false);
      
      if (selectedThread) {
        const updatedThread = threadsData.find(t => t.id === selectedThread.id);
        if (updatedThread) setSelectedThread(updatedThread);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'threads');
      setIsLoadingThreads(false);
    });

    const roomsQuery = query(collection(db, 'audioRooms'), orderBy('createdAt', 'desc'));
    const unsubscribeRooms = onSnapshot(roomsQuery, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAudioRooms(roomsData);
      setIsLoadingRooms(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'audioRooms');
      setIsLoadingRooms(false);
    });

    return () => {
      unsubscribeThreads();
      unsubscribeRooms();
    };
  }, [selectedThread?.id]);

  useEffect(() => {
    if (!selectedThread) return;

    setIsLoadingComments(true);
    const commentsQuery = query(
      collection(db, 'comments'), 
      where('threadId', '==', selectedThread.id)
    );
    
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      commentsData.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setComments(commentsData);
      setIsLoadingComments(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
      setIsLoadingComments(false);
    });

    return () => unsubscribeComments();
  }, [selectedThread?.id]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'threads'), {
        title: newThreadTitle,
        content: newThreadContent,
        imageUrl: newThreadImageUrl.trim() || null,
        category: newThreadCategory,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorAvatar: userData?.photoURL || user.photoURL || null,
        authorRole: userData?.role || 'user',
        repliesCount: 0,
        likesCount: 0,
        likedBy: [],
        createdAt: new Date().toISOString()
      });
      setIsCreatingThread(false);
      setNewThreadTitle('');
      setNewThreadContent('');
      setNewThreadImageUrl('');
      setNewThreadCategory('general');
      toast.success('Discussion created successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'threads');
      toast.error('Failed to create discussion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeThread = async (threadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;

    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    const isLiked = thread.likedBy?.includes(user.uid);
    const threadRef = doc(db, 'threads', threadId);

    try {
      await updateDoc(threadRef, {
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likesCount: increment(isLiked ? -1 : 1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `threads/${threadId}`);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const isLiked = comment.likedBy?.includes(user.uid);
    const commentRef = doc(db, 'comments', commentId);

    try {
      await updateDoc(commentRef, {
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likesCount: increment(isLiked ? -1 : 1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !selectedThread) return;

    setIsSubmittingComment(true);
    try {
      const commentData: any = {
        threadId: selectedThread.id,
        content: newComment,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorAvatar: userData?.photoURL || user.photoURL || null,
        authorRole: userData?.role || 'user',
        createdAt: new Date().toISOString(),
        repliesCount: 0,
        likesCount: 0,
        likedBy: []
      };

      if (replyingTo) {
        commentData.parentId = replyingTo.id;
      }

      await addDoc(collection(db, 'comments'), commentData);
      
      const threadRef = doc(db, 'threads', selectedThread.id);
      await updateDoc(threadRef, {
        repliesCount: increment(1)
      });

      if (replyingTo) {
        const parentCommentRef = doc(db, 'comments', replyingTo.id);
        await updateDoc(parentCommentRef, {
          repliesCount: increment(1)
        });
      }
      
      setNewComment('');
      setReplyingTo(null);
      toast.success('Comment posted');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
      toast.error('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteThread = (threadId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Thread',
      message: 'Are you sure you want to delete this thread? This will also delete all comments.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          // Delete comments first
          const commentsQuery = query(collection(db, 'comments'), where('threadId', '==', threadId));
          const commentsSnapshot = await getDocs(commentsQuery);
          const deletePromises = commentsSnapshot.docs.map(commentDoc => deleteDoc(doc(db, 'comments', commentDoc.id)));
          await Promise.all(deletePromises);
          
          // Delete thread
          await deleteDoc(doc(db, 'threads', threadId));
          toast.success('Thread deleted successfully');
          setSelectedThread(null);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `threads/${threadId}`);
          toast.error('Failed to delete thread');
        }
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, 'comments', commentId));
          toast.success('Comment deleted successfully');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
          toast.error('Failed to delete comment');
        }
      }
    });
  };

  const handleUpdateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingThread || !editTitle.trim() || !editContent.trim()) return;

    setIsSubmitting(true);
    try {
      const threadRef = doc(db, 'threads', editingThread.id);
      await updateDoc(threadRef, {
        title: editTitle,
        content: editContent
      });
      setEditingThread(null);
      toast.success('Discussion updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `threads/${editingThread.id}`);
      toast.error('Failed to update discussion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment || !editContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      const commentRef = doc(db, 'comments', editingComment.id);
      await updateDoc(commentRef, {
        content: editContent
      });
      setEditingComment(null);
      toast.success('Comment updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${editingComment.id}`);
      toast.error('Failed to update comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const filteredThreads = threads.filter(t => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'replies') {
      return b.repliesCount - a.repliesCount;
    }
    if (sortBy === 'likes') {
      return (b.likesCount || 0) - (a.likesCount || 0);
    }
    return 0;
  });

  const renderComments = (parentId: string | null = null, depth = 0) => {
    const filteredComments = comments.filter(c => (parentId === null ? !c.parentId : c.parentId === parentId));
    
    if (isLoadingComments && parentId === null) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin text-electric-blue mb-2" size={32} />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading comments...</p>
        </div>
      );
    }

    if (filteredComments.length === 0 && parentId === null) {
      return (
        <div className="text-center py-12 text-slate-400 text-sm glass dark:glass-dark rounded-3xl border border-dashed border-white/20 dark:border-white/10 shadow-xl">
          <MessageCircle size={32} className="mx-auto mb-2 opacity-20" />
          No comments yet. Be the first to reply!
        </div>
      );
    }

    return (
      <div className={`space-y-4 ${depth > 0 ? 'ml-4 sm:ml-8 mt-4 border-l-2 border-white/10 dark:border-white/5 pl-4' : ''}`}>
        {filteredComments.map((comment) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={comment.id} 
            className="glass dark:glass-dark p-4 rounded-2xl shadow-md border border-white/20 dark:border-white/10"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openProfile(comment.authorId)}
                  className="w-8 h-8 rounded-full bg-electric-blue/10 dark:bg-electric-blue/20 flex items-center justify-center text-electric-blue dark:text-electric-blue-light font-bold hover:ring-2 hover:ring-electric-blue transition-all overflow-hidden"
                >
                  {comment.authorAvatar ? (
                    <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    comment.authorName?.charAt(0) || 'A'
                  )}
                </button>
                <button 
                  onClick={() => openProfile(comment.authorId)}
                  className="font-bold text-slate-800 dark:text-slate-200 hover:underline flex items-center gap-1"
                >
                  {comment.authorName}
                  {comment.authorRole === 'admin' && (
                    <BadgeCheck className="text-electric-blue" size={14} fill="currentColor" stroke="white" />
                  )}
                  {comment.authorRole && comment.authorRole !== 'user' && (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {comment.authorRole}
                    </span>
                  )}
                </button>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                <span>{formatTime(comment.createdAt)}</span>
              </div>
              <div className="flex gap-3 items-center">
                {user?.uid === comment.authorId && (
                  <button 
                    onClick={() => {
                      setEditingComment(comment);
                      setEditContent(comment.content);
                    }}
                    className="text-electric-blue dark:text-electric-blue-light hover:text-electric-blue-dark dark:hover:text-white font-bold"
                  >
                    Edit
                  </button>
                )}
                {userData?.role === 'admin' && (
                  <button 
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            {editingComment?.id === comment.id ? (
              <form onSubmit={handleUpdateComment} className="mb-3">
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue min-h-[100px] bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button 
                    type="submit"
                    disabled={isSubmittingComment || !editContent.trim()}
                    className="bg-electric-blue text-white px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingComment(null)}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-1.5 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap mb-4 leading-relaxed">{comment.content}</p>
            )}
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleLikeComment(comment.id)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  comment.likedBy?.includes(user?.uid) ? 'text-electric-blue dark:text-electric-blue-light' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <ThumbsUp size={14} fill={comment.likedBy?.includes(user?.uid) ? "currentColor" : "none"} />
                {comment.likesCount || 0}
              </button>
              <button 
                onClick={() => setReplyingTo(comment)}
                className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-electric-blue dark:hover:text-electric-blue-light flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare size={14} /> Reply
              </button>
              {comment.repliesCount > 0 && (
                <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-wider">
                  {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>

            {renderComments(comment.id, depth + 1)}
          </motion.div>
        ))}
      </div>
    );
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  if (selectedThread) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-full w-full flex flex-col relative z-10 transition-colors duration-300 bg-mesh"
      >
        <div className="glass dark:glass-dark backdrop-blur-xl border-b border-white/20 dark:border-white/10 p-4 flex items-center gap-3 sticky top-0 z-20 shadow-lg">
          <button 
            onClick={() => setSelectedThread(null)}
            className="p-2 -ml-2 hover:bg-white/10 dark:hover:bg-slate-800/50 rounded-full transition-colors text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="font-black text-slate-900 dark:text-white text-base line-clamp-1">Discussion</h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
              {selectedThread.category}
            </p>
          </div>
          <button className="p-2 hover:bg-white/10 dark:hover:bg-slate-800/50 rounded-full text-slate-400 dark:text-slate-500">
            <Share2 size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-32">
          <div className="glass dark:glass-dark p-6 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 mb-8">
            {editingThread ? (
              <form onSubmit={handleUpdateThread}>
                <input 
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={200}
                  className="w-full font-black text-xl text-slate-900 dark:text-white mb-4 border-b-2 border-electric-blue focus:outline-none py-2 bg-transparent"
                  autoFocus
                />
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  maxLength={5000}
                  className="glass-input dark:glass-input-dark w-full text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-electric-blue/50 min-h-[200px] mb-4"
                />
                <div className="flex gap-2">
                  <button 
                    type="submit"
                    disabled={isSubmitting || !editTitle.trim() || !editContent.trim()}
                    className="bg-electric-blue hover:bg-electric-blue-dark text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-electric-blue/20 disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingThread(null)}
                    className="glass dark:glass-dark text-slate-600 dark:text-slate-400 px-6 py-2.5 rounded-xl text-sm font-black border border-white/20 dark:border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-6 pb-6 border-b border-white/10 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openProfile(selectedThread.authorId)}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-blue to-electric-blue-dark flex items-center justify-center text-white font-black text-sm hover:ring-2 hover:ring-electric-blue hover:ring-offset-2 dark:hover:ring-offset-slate-900 transition-all overflow-hidden shadow-lg"
                    >
                      {selectedThread.authorAvatar ? (
                        <img src={selectedThread.authorAvatar} alt={selectedThread.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        selectedThread.authorName?.charAt(0) || 'A'
                      )}
                    </button>
                    <div>
                      <button 
                        onClick={() => openProfile(selectedThread.authorId)}
                        className="font-black text-slate-900 dark:text-white hover:underline text-left flex items-center gap-1 text-sm"
                      >
                        {selectedThread.authorName}
                        {selectedThread.authorRole === 'admin' && (
                          <BadgeCheck className="text-electric-blue" size={16} fill="currentColor" stroke="white" />
                        )}
                        {selectedThread.authorRole && selectedThread.authorRole !== 'user' && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {selectedThread.authorRole}
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-electric-blue dark:text-electric-blue-light">
                          {selectedThread.authorRole}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{formatTime(selectedThread.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${CATEGORY_COLORS[selectedThread.category] || 'glass dark:glass-dark text-slate-600 dark:text-slate-400 border-white/20 dark:border-white/10'}`}>
                      {selectedThread.category}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-black text-2xl text-slate-900 dark:text-white leading-tight tracking-tight">{selectedThread.title}</h3>
                  {(user?.uid === selectedThread.authorId || userData?.role === 'admin') && (
                    <div className="flex gap-2">
                      {user?.uid === selectedThread.authorId && (
                        <button 
                          onClick={() => {
                            setEditingThread(selectedThread);
                            setEditTitle(selectedThread.title);
                            setEditContent(selectedThread.content);
                          }}
                          className="text-electric-blue dark:text-electric-blue-light hover:text-electric-blue-dark dark:hover:text-white p-2 hover:bg-electric-blue/10 dark:hover:bg-electric-blue/20 rounded-full transition-colors"
                          title="Edit Thread"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                      {userData?.role === 'admin' && (
                        <button 
                          onClick={() => handleDeleteThread(selectedThread.id)}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors"
                          title="Delete Thread"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {selectedThread.imageUrl && (
                  <div 
                    className="mb-6 rounded-3xl overflow-hidden cursor-pointer group/detailimg relative shadow-xl"
                    onClick={() => showImageViewer(selectedThread.imageUrl)}
                  >
                    <img 
                      src={selectedThread.imageUrl} 
                      alt="Post content" 
                      className="w-full h-auto max-h-[400px] object-cover group-hover/detailimg:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/detailimg:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-black border border-white/30">
                        View Full Image
                      </span>
                    </div>
                  </div>
                )}
                
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base font-medium">{selectedThread.content}</p>

                <div className="mt-8 pt-6 border-t border-white/10 dark:border-white/5 flex items-center gap-6">
                  <button 
                    onClick={() => handleLikeThread(selectedThread.id)}
                    className={`flex items-center gap-2 text-sm font-black transition-all active:scale-90 ${
                      selectedThread.likedBy?.includes(user?.uid) ? 'text-electric-blue dark:text-electric-blue-light' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <ThumbsUp size={20} fill={selectedThread.likedBy?.includes(user?.uid) ? "currentColor" : "none"} />
                    {selectedThread.likesCount || 0}
                  </button>
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm font-black">
                    <MessageCircle size={20} />
                    {selectedThread.repliesCount || 0}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mb-4">
            <h4 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 px-2 text-lg">
              <MessageSquare size={20} className="text-electric-blue" /> 
              Comments
            </h4>
            
            {renderComments()}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 glass dark:glass-dark backdrop-blur-xl border-t border-white/20 dark:border-white/10 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <AnimatePresence>
            {replyingTo && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-3xl mx-auto mb-3 px-4 py-2 bg-electric-blue/10 dark:bg-electric-blue/20 rounded-2xl flex justify-between items-center text-xs border border-electric-blue/20"
              >
                <span className="text-electric-blue dark:text-electric-blue-light font-black">
                  Replying to <span className="text-electric-blue-dark dark:text-white underline">{replyingTo.authorName}</span>
                </span>
                <button onClick={() => setReplyingTo(null)} className="text-electric-blue dark:text-electric-blue-light hover:text-electric-blue-dark dark:hover:text-white p-1">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleCreateComment} className="flex gap-3 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? "Write a reply..." : "Share your thoughts..."}
                className="glass-input dark:glass-input-dark w-full rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all text-slate-900 dark:text-white"
                maxLength={1000}
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmittingComment || !newComment.trim()}
              className="bg-electric-blue hover:bg-electric-blue-dark text-white p-4 rounded-2xl transition-all shadow-xl shadow-electric-blue/20 disabled:opacity-50 active:scale-95 flex items-center justify-center min-w-[56px]"
            >
              <Send size={20} className="ml-0.5" />
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  if (joinedRoom) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full w-full flex flex-col bg-slate-950 text-white relative z-10 overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-electric-blue/20 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 blur-[120px] animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)]"></div>
        </div>

        <div className="p-4 flex justify-between items-center border-b border-white/5 relative z-10 backdrop-blur-md bg-black/20">
          <button 
            onClick={() => setJoinedRoom(null)}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="bg-rose-500 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-widest shadow-lg shadow-rose-500/20">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Live
          </span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
          <div className="w-40 h-40 bg-electric-blue rounded-full flex items-center justify-center mb-10 relative shadow-[0_0_50px_rgba(51,106,255,0.3)]">
            <div className="absolute inset-0 bg-electric-blue rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-[-15px] border-2 border-electric-blue/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-[-30px] border border-electric-blue/10 rounded-full animate-pulse delay-300"></div>
            <Mic size={56} className="text-white drop-shadow-lg" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight text-white drop-shadow-md">{joinedRoom.title}</h2>
          <p className="text-slate-400 font-bold mb-12 uppercase tracking-widest text-xs">You are listening to the conversation...</p>
          
          <div className="flex gap-6">
            <button className="glass-dark p-6 rounded-[2rem] transition-all active:scale-90 border border-white/10 hover:bg-white/10">
              <Users size={32} />
            </button>
            <button 
              onClick={() => setJoinedRoom(null)}
              className="bg-rose-600 hover:bg-rose-700 px-12 py-6 rounded-[2rem] font-black transition-all shadow-2xl shadow-rose-600/40 active:scale-95 text-lg tracking-tight"
            >
              Leave Room
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto p-4 pb-32 relative transition-colors duration-300 bg-mesh">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Community</h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Connect with locals & travelers</p>
        </div>
        <button 
          onClick={() => {
            if (!user) {
              toast.error('Please login to create a new post');
              return;
            }
            setIsCreatingThread(true);
          }}
          className="bg-electric-blue hover:bg-electric-blue-dark text-white p-4 rounded-2xl shadow-xl shadow-electric-blue/20 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all border-none ${
                activeCategory === cat.id 
                  ? 'bg-electric-blue text-white shadow-lg shadow-electric-blue/20' 
                  : 'glass dark:glass-dark text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-electric-blue transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input dark:glass-input-dark w-full rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all text-slate-900 dark:text-white border-none shadow-lg"
          />
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Radio size={20} className="text-rose-500" /> 
            Live Audio Rooms
          </h3>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {audioRooms.length} Active
          </span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
          {isLoadingRooms ? (
            [1, 2].map(i => (
              <div key={i} className="w-[85vw] sm:w-[280px] flex-shrink-0 h-40 glass dark:glass-dark rounded-3xl animate-pulse border border-white/20 dark:border-white/10" />
            ))
          ) : audioRooms.length === 0 ? (
            <div className="w-full glass dark:glass-dark p-8 rounded-3xl text-center border border-dashed border-white/20 dark:border-white/10">
              <Mic size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">No active rooms right now.</p>
            </div>
          ) : (
            audioRooms.map(room => (
              <motion.div 
                whileHover={{ y: -4 }}
                key={room.id} 
                className="w-[85vw] sm:w-[280px] flex-shrink-0 glass-card dark:glass-card-dark p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-xl flex flex-col justify-between group cursor-pointer"
                onClick={() => setJoinedRoom(room)}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-widest border border-rose-500/20">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span> Live
                    </span>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                          <User size={14} className="text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <h4 className="font-black text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-electric-blue dark:group-hover:text-electric-blue-light transition-colors">{room.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Started by {room.hostName}</p>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                    <Users size={14} />
                    <span className="text-xs font-bold">{room.listenersCount || 0} listening</span>
                  </div>
                  <button className="bg-electric-blue/90 hover:bg-electric-blue text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all shadow-lg shadow-electric-blue/20 backdrop-blur-md border border-white/20">
                    JOIN
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-xl">
            <MessageSquare size={24} className="text-electric-blue" /> 
            Discussions
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSortBy('recent')}
              className={`p-2 rounded-xl transition-all ${sortBy === 'recent' ? 'bg-electric-blue/10 dark:bg-electric-blue/20 text-electric-blue dark:text-electric-blue-light' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Sort by Recent"
            >
              <Clock size={18} />
            </button>
            <button 
              onClick={() => setSortBy('likes')}
              className={`p-2 rounded-xl transition-all ${sortBy === 'likes' ? 'bg-electric-blue/10 dark:bg-electric-blue/20 text-electric-blue dark:text-electric-blue-light' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Sort by Popular"
            >
              <ThumbsUp size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoadingThreads ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-48 glass dark:glass-dark rounded-3xl animate-pulse border border-white/20 dark:border-white/10" />
            ))
          ) : sortedThreads.length === 0 ? (
            <div className="text-center py-20 glass dark:glass-dark rounded-3xl border border-dashed border-white/20 dark:border-white/10">
              <MessageSquare size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
              <h4 className="text-lg font-black text-slate-900 dark:text-white">No discussions yet</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Be the first to start a conversation!</p>
            </div>
          ) : (
            sortedThreads.map(thread => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                key={thread.id} 
                className="glass-card dark:glass-card-dark p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-xl group cursor-pointer relative overflow-hidden"
                onClick={() => setSelectedThread(thread)}
              >
                <div className="flex items-start gap-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openProfile(thread.authorId);
                    }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-electric-blue to-electric-blue-dark flex items-center justify-center text-white font-black text-lg shadow-lg hover:ring-2 hover:ring-electric-blue hover:ring-offset-2 dark:hover:ring-offset-slate-900 transition-all overflow-hidden shrink-0"
                  >
                    {thread.authorAvatar ? (
                      <img src={thread.authorAvatar} alt={thread.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      thread.authorName?.charAt(0) || 'A'
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openProfile(thread.authorId);
                          }}
                          className="text-xs font-black text-slate-900 dark:text-white hover:underline flex items-center gap-1"
                        >
                          {thread.authorName}
                          {thread.authorRole === 'admin' && (
                            <BadgeCheck className="text-electric-blue" size={14} fill="currentColor" stroke="white" />
                          )}
                          {thread.authorRole && thread.authorRole !== 'user' && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {thread.authorRole}
                            </span>
                          )}
                        </button>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{formatTime(thread.createdAt)}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${CATEGORY_COLORS[thread.category] || 'glass dark:glass-dark text-slate-500 dark:text-slate-400 border-white/20 dark:border-white/10'}`}>
                        {thread.category}
                      </span>
                    </div>
                    
                    <h4 className="font-black text-xl text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-electric-blue dark:group-hover:text-electric-blue-light transition-colors leading-tight">{thread.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{thread.content}</p>
                    
                    {thread.imageUrl && (
                      <div className="mb-4 rounded-2xl overflow-hidden h-48 relative group/img">
                        <img src={thread.imageUrl} alt="Post" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                      </div>
                    )}

                    <div className="flex items-center gap-6">
                      <button 
                        onClick={(e) => handleLikeThread(thread.id, e)}
                        className={`flex items-center gap-2 text-xs font-black transition-all active:scale-90 ${
                          thread.likedBy?.includes(user?.uid) ? 'text-electric-blue dark:text-electric-blue-light' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        <ThumbsUp size={16} fill={thread.likedBy?.includes(user?.uid) ? "currentColor" : "none"} />
                        {thread.likesCount || 0}
                      </button>
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-black">
                        <MessageCircle size={16} />
                        {thread.repliesCount || 0}
                      </div>
                      <div className="ml-auto text-slate-300 dark:text-slate-700">
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isCreatingThread && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass dark:glass-dark w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 dark:border-white/10"
            >
              <div className="sticky top-0 glass dark:glass-dark px-6 py-5 border-b border-white/20 dark:border-white/10 flex justify-between items-center z-10 backdrop-blur-xl">
                <h3 className="font-black text-xl text-slate-900 dark:text-white">Start Discussion</h3>
                <button 
                  onClick={() => setIsCreatingThread(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100/50 dark:bg-slate-800/50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateThread} className="p-6 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNewThreadCategory(cat.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                            newThreadCategory === cat.id 
                              ? 'bg-electric-blue text-white border-electric-blue-dark shadow-lg shadow-electric-blue/20' 
                              : 'glass dark:glass-dark text-slate-500 dark:text-slate-400 border-white/20 dark:border-white/10 hover:border-electric-blue/30'
                          }`}
                        >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                  <input 
                    required
                    type="text" 
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="What's on your mind?"
                    className="glass-input dark:glass-input-dark w-full rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all text-slate-900 dark:text-white"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Content</label>
                  <textarea 
                    required
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    placeholder="Share more details..."
                    className="glass-input dark:glass-input-dark w-full rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all min-h-[150px] resize-none text-slate-900 dark:text-white"
                    maxLength={5000}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Image URL (Optional)</label>
                  <input 
                    type="url" 
                    value={newThreadImageUrl}
                    onChange={(e) => setNewThreadImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="glass-input dark:glass-input-dark w-full rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all text-slate-900 dark:text-white"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !newThreadTitle.trim() || !newThreadContent.trim()}
                  className="w-full bg-electric-blue hover:bg-electric-blue-dark text-white font-black py-4 rounded-2xl shadow-xl shadow-electric-blue/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  Post Discussion
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
