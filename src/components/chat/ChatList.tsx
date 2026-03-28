import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileModal } from '../../contexts/ProfileModalContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { MessageCircle, Plus, X, User as UserIcon, BadgeCheck, Loader2, Search, Filter } from 'lucide-react';
import ChatRoom from './ChatRoom';
import { toast } from 'sonner';

export default function ChatList() {
  const { user, userData } = useAuth();
  const { openProfile } = useProfileModal();
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    if (!user) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort on client side to avoid requiring a composite index
      chatsData.sort((a: any, b: any) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : new Date(a.createdAt).getTime();
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      setChats(chatsData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users_public'));
      const usersData = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== user?.uid);
      setUsers(usersData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users_public');
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const startChat = async (otherUser: any) => {
    if (!user || !userData) return;

    // Check if chat already exists
    const existingChat = chats.find(chat => chat.participants.includes(otherUser.id));
    if (existingChat) {
      setSelectedChatId(existingChat.id);
      setIsNewChatModalOpen(false);
      return;
    }

    setIsStartingChat(true);
    try {
      const newChatRef = await addDoc(collection(db, 'chats'), {
        participants: [user.uid, otherUser.id],
        participantDetails: {
          [user.uid]: {
            displayName: userData.displayName,
            photoURL: userData.photoURL || null,
            role: userData.role || 'user'
          },
          [otherUser.id]: {
            displayName: otherUser.displayName,
            photoURL: otherUser.photoURL || null,
            role: otherUser.role || 'user'
          }
        },
        createdAt: new Date().toISOString(),
        unreadBy: []
      });
      
      setSelectedChatId(newChatRef.id);
      setIsNewChatModalOpen(false);
      toast.success('Chat started');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
      toast.error('Failed to start chat');
    } finally {
      setIsStartingChat(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    const otherUserId = chat.participants.find((id: string) => id !== user?.uid);
    const otherUser = chat.participantDetails[otherUserId];
    const matchesName = otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    const isUnread = chat.unreadBy?.includes(user?.uid);
    
    if (showUnreadOnly) {
      return matchesName && isUnread;
    }
    return matchesName;
  });

  if (selectedChatId) {
    return <ChatRoom chatId={selectedChatId} onBack={() => setSelectedChatId(null)} />;
  }

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-950 flex flex-col relative transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Messages</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Chat with other users</p>
          </div>
          <button 
            onClick={() => {
              loadUsers();
              setIsNewChatModalOpen(true);
            }}
            className="bg-electric-blue/10 dark:bg-electric-blue/20 text-electric-blue dark:text-electric-blue-light p-2.5 rounded-full hover:bg-electric-blue/20 dark:hover:bg-electric-blue/30 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/20 transition-all"
            />
          </div>
          <button 
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              showUnreadOnly 
                ? 'bg-electric-blue text-white shadow-lg shadow-electric-blue/20' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Unread</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-electric-blue mb-4" size={40} />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={32} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              {searchQuery || showUnreadOnly ? 'No matching chats' : 'No messages yet'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {searchQuery || showUnreadOnly 
                ? 'Try adjusting your filters or search query.' 
                : 'Start a new chat with other users in the community.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChats.map(chat => {
              const otherUserId = chat.participants.find((id: string) => id !== user?.uid);
              const otherUser = chat.participantDetails[otherUserId];
              const isUnread = chat.unreadBy?.includes(user?.uid);
              
              return (
                <div 
                  key={chat.id} 
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border flex items-center gap-4 cursor-pointer transition-all active:scale-[0.98] ${
                    isUnread 
                      ? 'border-electric-blue dark:border-electric-blue bg-electric-blue/5 dark:bg-electric-blue/10' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-electric-blue/20 dark:hover:border-electric-blue/20'
                  }`}
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openProfile(otherUserId);
                    }}
                    className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-electric-blue transition-all"
                  >
                    {otherUser?.photoURL ? (
                      <img src={otherUser.photoURL} alt={otherUser.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                        <UserIcon size={24} />
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openProfile(otherUserId);
                        }}
                        className={`font-bold truncate hover:underline flex items-center gap-1 ${
                          isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {otherUser?.displayName || 'User'}
                        {otherUser?.role === 'admin' && (
                          <BadgeCheck className="text-electric-blue flex-shrink-0" size={14} fill="currentColor" stroke="white" />
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <span className="w-2 h-2 bg-electric-blue rounded-full"></span>
                        )}
                        {chat.lastMessageTime && (
                          <span className={`text-[10px] flex-shrink-0 ${isUnread ? 'text-electric-blue dark:text-electric-blue-light font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                            {new Date(chat.lastMessageTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm truncate ${isUnread ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl h-[80vh] sm:h-[600px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">New Message</h3>
              <button 
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingUsers ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-electric-blue mb-2" size={32} />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Finding users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">No users found</div>
              ) : (
                <div className="space-y-2">
                  {users.map(u => (
                    <button 
                      key={u.id}
                      disabled={isStartingChat}
                      onClick={() => startChat(u)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <UserIcon size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 dark:text-white truncate flex items-center gap-1">
                          {u.displayName}
                          {u.role === 'admin' && (
                            <BadgeCheck className="text-electric-blue flex-shrink-0" size={14} fill="currentColor" stroke="white" />
                          )}
                        </h4>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
