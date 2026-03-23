import React, { useState, useEffect } from 'react';
import { 
  Mic, MessageSquare, Users, Radio, Clock, User, Plus, X, 
  ArrowLeft, Send, Filter, ThumbsUp, ChevronRight, Hash,
  Search, MoreVertical, Share2, MessageCircle, BadgeCheck
} from 'lucide-react';
import { 
  collection, onSnapshot, addDoc, query, orderBy, doc, 
  updateDoc, increment, where, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileModal } from '../../contexts/ProfileModalContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: <Hash size={14} /> },
  { id: 'general', label: 'General', icon: <MessageSquare size={14} /> },
  { id: 'tips', label: 'Tips', icon: <Hash size={14} /> },
  { id: 'food', label: 'Food', icon: <Hash size={14} /> },
  { id: 'transport', label: 'Transport', icon: <Hash size={14} /> },
  { id: 'party', label: 'Party', icon: <Hash size={14} /> },
  { id: 'help', label: 'Help', icon: <Hash size={14} /> },
];

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  tips: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  food: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  transport: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  party: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  help: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
};

export default function ForumList() {
  const { user, userData } = useAuth();
  const { openProfile } = useProfileModal();
  const [threads, setThreads] = useState<any[]>([]);
  const [audioRooms, setAudioRooms] = useState<any[]>([]);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'replies' | 'likes'>('recent');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Thread Detail State
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingThread, setEditingThread] = useState<any | null>(null);
  const [editingComment, setEditingComment] = useState<any | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  // Audio Room State
  const [joinedRoom, setJoinedRoom] = useState<any | null>(null);

  useEffect(() => {
    const threadsQuery = query(collection(db, 'threads'), orderBy('createdAt', 'desc'));
    const unsubscribeThreads = onSnapshot(threadsQuery, (snapshot) => {
      const threadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setThreads(threadsData);
      
      if (selectedThread) {
        const updatedThread = threadsData.find(t => t.id === selectedThread.id);
        if (updatedThread) setSelectedThread(updatedThread);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'threads');
    });

    const roomsQuery = query(collection(db, 'audioRooms'), orderBy('createdAt', 'desc'));
    const unsubscribeRooms = onSnapshot(roomsQuery, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAudioRooms(roomsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'audioRooms');
    });

    return () => {
      unsubscribeThreads();
      unsubscribeRooms();
    };
  }, [selectedThread?.id]);

  useEffect(() => {
    if (!selectedThread) return;

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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
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
        category: newThreadCategory,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorRole: userData?.role || 'user',
        repliesCount: 0,
        likesCount: 0,
        likedBy: [],
        createdAt: new Date().toISOString()
      });
      setIsCreatingThread(false);
      setNewThreadTitle('');
      setNewThreadContent('');
      setNewThreadCategory('general');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'threads');
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
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    } finally {
      setIsSubmittingComment(false);
    }
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `threads/${editingThread.id}`);
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${editingComment.id}`);
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
    
    if (filteredComments.length === 0 && parentId === null) {
      return (
        <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
          <MessageCircle size={32} className="mx-auto mb-2 opacity-20" />
          No comments yet. Be the first to reply!
        </div>
      );
    }

    return (
      <div className={`space-y-4 ${depth > 0 ? 'ml-4 sm:ml-8 mt-4 border-l-2 border-slate-100 dark:border-slate-800 pl-4' : ''}`}>
        {filteredComments.map((comment) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={comment.id} 
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openProfile(comment.authorId)}
                  className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold hover:ring-2 hover:ring-sky-500 transition-all"
                >
                  {comment.authorName?.charAt(0) || 'A'}
                </button>
                <button 
                  onClick={() => openProfile(comment.authorId)}
                  className="font-bold text-slate-800 dark:text-slate-200 hover:underline flex items-center gap-1"
                >
                  {comment.authorName}
                  {comment.authorRole === 'admin' && (
                    <BadgeCheck className="text-blue-500" size={14} fill="currentColor" stroke="white" />
                  )}
                </button>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                <span>{formatTime(comment.createdAt)}</span>
              </div>
              {user?.uid === comment.authorId && (
                <button 
                  onClick={() => {
                    setEditingComment(comment);
                    setEditContent(comment.content);
                  }}
                  className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-bold"
                >
                  Edit
                </button>
              )}
            </div>
            {editingComment?.id === comment.id ? (
              <form onSubmit={handleUpdateComment} className="mb-3">
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[100px] bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button 
                    type="submit"
                    disabled={isSubmittingComment || !editContent.trim()}
                    className="bg-sky-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
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
                  comment.likedBy?.includes(user?.uid) ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <ThumbsUp size={14} fill={comment.likedBy?.includes(user?.uid) ? "currentColor" : "none"} />
                {comment.likesCount || 0}
              </button>
              <button 
                onClick={() => setReplyingTo(comment)}
                className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1.5 transition-colors"
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
        className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-950 relative z-10 transition-colors duration-300"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 sticky top-0 z-20">
          <button 
            onClick={() => setSelectedThread(null)}
            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">Discussion</h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              {selectedThread.category}
            </p>
          </div>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500">
            <Share2 size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-32">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
            {editingThread ? (
              <form onSubmit={handleUpdateThread}>
                <input 
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full font-bold text-xl text-slate-900 dark:text-white mb-4 border-b-2 border-sky-500 focus:outline-none py-2 bg-transparent"
                  autoFocus
                />
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-200 dark:border-slate-700 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[200px] mb-4 bg-slate-50 dark:bg-slate-800"
                />
                <div className="flex gap-2">
                  <button 
                    type="submit"
                    disabled={isSubmitting || !editTitle.trim() || !editContent.trim()}
                    className="bg-sky-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-sky-200 dark:shadow-none disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingThread(null)}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-6 py-2.5 rounded-xl text-sm font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-2xl text-slate-900 dark:text-white leading-tight tracking-tight">{selectedThread.title}</h3>
                  {user?.uid === selectedThread.authorId && (
                    <button 
                      onClick={() => {
                        setEditingThread(selectedThread);
                        setEditTitle(selectedThread.title);
                        setEditContent(selectedThread.content);
                      }}
                      className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 p-2 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-full transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-6 pb-6 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openProfile(selectedThread.authorId)}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm hover:ring-2 hover:ring-sky-500 hover:ring-offset-2 dark:hover:ring-offset-slate-900 transition-all"
                    >
                      {selectedThread.authorName?.charAt(0) || 'A'}
                    </button>
                    <div>
                      <button 
                        onClick={() => openProfile(selectedThread.authorId)}
                        className="font-bold text-slate-900 dark:text-white hover:underline text-left flex items-center gap-1"
                      >
                        {selectedThread.authorName}
                        {selectedThread.authorRole === 'admin' && (
                          <BadgeCheck className="text-blue-500" size={16} fill="currentColor" stroke="white" />
                        )}
                      </button>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatTime(selectedThread.createdAt)}</p>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${CATEGORY_COLORS[selectedThread.category] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                      {selectedThread.category}
                    </span>
                  </div>
                </div>
                
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base">{selectedThread.content}</p>

                <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center gap-6">
                  <button 
                    onClick={() => handleLikeThread(selectedThread.id)}
                    className={`flex items-center gap-2 text-sm font-bold transition-all active:scale-90 ${
                      selectedThread.likedBy?.includes(user?.uid) ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <ThumbsUp size={20} fill={selectedThread.likedBy?.includes(user?.uid) ? "currentColor" : "none"} />
                    {selectedThread.likesCount || 0}
                  </button>
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm font-bold">
                    <MessageCircle size={20} />
                    {selectedThread.repliesCount || 0}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mb-4">
            <h4 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 px-2">
              <MessageSquare size={18} className="text-sky-500" /> 
              Comments
            </h4>
            
            {renderComments()}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 p-4 pb-safe z-20">
          <AnimatePresence>
            {replyingTo && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-3xl mx-auto mb-3 px-4 py-2 bg-sky-50 dark:bg-sky-900/20 rounded-2xl flex justify-between items-center text-xs"
              >
                <span className="text-sky-700 dark:text-sky-400 font-bold">
                  Replying to <span className="text-sky-900 dark:text-sky-200 underline">{replyingTo.authorName}</span>
                </span>
                <button onClick={() => setReplyingTo(null)} className="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 p-1">
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
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                maxLength={1000}
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmittingComment || !newComment.trim()}
              className="bg-sky-600 text-white p-3.5 rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-200 dark:shadow-none disabled:opacity-50 disabled:scale-95 flex items-center justify-center min-w-[52px]"
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
        className="h-full w-full flex flex-col bg-slate-950 text-white relative z-10"
      >
        <div className="p-4 flex justify-between items-center border-b border-white/5">
          <button 
            onClick={() => setJoinedRoom(null)}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="bg-rose-500 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-widest shadow-lg shadow-rose-500/20">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Live
          </span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-32 h-32 bg-indigo-500 rounded-full flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-[-10px] border-2 border-indigo-500/30 rounded-full animate-pulse"></div>
            <Mic size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">{joinedRoom.title}</h2>
          <p className="text-slate-400 font-medium mb-12">You are listening to the conversation...</p>
          
          <div className="flex gap-6">
            <button className="bg-white/10 hover:bg-white/20 p-5 rounded-3xl transition-all active:scale-90">
              <Users size={28} />
            </button>
            <button 
              onClick={() => setJoinedRoom(null)}
              className="bg-rose-600 hover:bg-rose-700 px-10 py-5 rounded-3xl font-bold transition-all shadow-xl shadow-rose-600/20 active:scale-95"
            >
              Leave Room
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 pb-32 relative transition-colors duration-300">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Community</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Connect with locals & travelers.</p>
        </div>
        <button 
          onClick={() => setIsCreatingThread(true)}
          className="bg-sky-600 text-white p-3.5 rounded-2xl shadow-xl shadow-sky-200 dark:shadow-none hover:bg-sky-700 transition-all active:scale-90"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="mb-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeCategory === cat.id 
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-200 dark:shadow-none scale-105' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-800'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-2 mb-5 px-1">
          <Radio size={18} className="text-rose-500 animate-pulse" />
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Live Audio Rooms</h3>
        </div>
        
        {audioRooms.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm font-medium">
            No active audio rooms yet.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
            {audioRooms.map((room) => (
              <motion.div 
                whileTap={{ scale: 0.98 }}
                key={room.id} 
                onClick={() => setJoinedRoom(room)}
                className="min-w-[280px] bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-5 shadow-xl shadow-indigo-200 dark:shadow-none text-white snap-center relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="bg-rose-500 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-widest shadow-lg">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Live
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                    <Users size={12} /> {room.listenersCount}
                  </div>
                </div>
                
                <h4 className="font-bold text-xl leading-tight mb-6 relative z-10 tracking-tight">{room.title}</h4>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex -space-x-3">
                    {room.speakers?.map((speaker: string, idx: number) => (
                      <div key={idx} className="w-10 h-10 rounded-full bg-indigo-400 border-2 border-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        {speaker.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                    <Mic size={18} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-sky-500" />
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Discussions</h3>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter size={14} className="text-slate-400 dark:text-slate-500" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 focus:outline-none bg-transparent"
            >
              <option value="recent">Recent</option>
              <option value="replies">Replies</option>
              <option value="likes">Likes</option>
            </select>
          </div>
        </div>
        
        {sortedThreads.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No discussions found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedThreads.map((thread) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={thread.id} 
                onClick={() => setSelectedThread(thread)}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${CATEGORY_COLORS[thread.category] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                    {thread.category}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                    {formatTime(thread.createdAt)}
                  </span>
                </div>
                
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 leading-snug text-lg group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{thread.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 line-clamp-2 leading-relaxed">{thread.content}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openProfile(thread.authorId);
                      }}
                      className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-[10px] hover:ring-2 hover:ring-sky-500 transition-all"
                    >
                      {thread.authorName?.charAt(0) || 'A'}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openProfile(thread.authorId);
                      }}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline flex items-center gap-1"
                    >
                      {thread.authorName}
                      {thread.authorRole === 'admin' && (
                        <BadgeCheck className="text-blue-500" size={14} fill="currentColor" stroke="white" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => handleLikeThread(thread.id, e)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                        thread.likedBy?.includes(user?.uid) ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <ThumbsUp size={14} fill={thread.likedBy?.includes(user?.uid) ? "currentColor" : "none"} />
                      {thread.likesCount || 0}
                    </button>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                      <MessageCircle size={14} />
                      {thread.repliesCount || 0}
                    </div>
                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCreatingThread && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreatingThread(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] w-full max-w-lg p-8 relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">New Discussion</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Share something with the community.</p>
                </div>
                <button 
                  onClick={() => setIsCreatingThread(false)}
                  className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateThread}>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Category</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewThreadCategory(cat.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                          newThreadCategory === cat.id 
                            ? 'bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-100 dark:shadow-none' 
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Title</label>
                  <input 
                    type="text" 
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium text-slate-800 dark:text-slate-200"
                    required
                    maxLength={100}
                  />
                </div>
                
                <div className="mb-8">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Message</label>
                  <textarea 
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    placeholder="Tell us more details..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium text-slate-800 dark:text-slate-200"
                    required
                    maxLength={2000}
                  ></textarea>
                </div>
                
                <button 
                  type="submit"
                  disabled={isSubmitting || !newThreadTitle.trim() || !newThreadContent.trim()}
                  className="w-full bg-sky-600 text-white font-bold py-4 rounded-[20px] hover:bg-sky-700 transition-all shadow-xl shadow-sky-200 dark:shadow-none disabled:opacity-50 disabled:scale-95 active:scale-95"
                >
                  {isSubmitting ? 'Posting...' : 'Post Discussion'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
