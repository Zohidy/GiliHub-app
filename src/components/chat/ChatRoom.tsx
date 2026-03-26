import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileModal } from '../../contexts/ProfileModalContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { ArrowLeft, Send, User as UserIcon, BadgeCheck } from 'lucide-react';

interface ChatRoomProps {
  chatId: string;
  onBack: () => void;
}

export default function ChatRoom({ chatId, onBack }: ChatRoomProps) {
  const { user } = useAuth();
  const { openProfile } = useProfileModal();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatDetails, setChatDetails] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Listen to chat details
    const chatRef = doc(db, 'chats', chatId);
    const unsubscribeChat = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setChatDetails(data);
        
        // Mark as read if user is in unreadBy
        if (data.unreadBy?.includes(user.uid)) {
          updateDoc(chatRef, {
            unreadBy: arrayRemove(user.uid)
          }).catch(err => console.error("Error marking as read:", err));
        }
      }
    });

    // Listen to messages
    const messagesQuery = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [chatId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatDetails) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const now = new Date().toISOString();
      const otherUserId = chatDetails.participants.find((id: string) => id !== user.uid);
      
      // Add message
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        chatId,
        senderId: user.uid,
        text,
        createdAt: now
      });

      // Update chat last message and unreadBy
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageTime: now,
        unreadBy: arrayUnion(otherUserId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}/messages`);
    }
  };

  if (!chatDetails || !user) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const otherUserId = chatDetails.participants.find((id: string) => id !== user.uid);
  const otherUser = chatDetails.participantDetails[otherUserId];

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <button 
          onClick={() => openProfile(otherUserId)}
          className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 hover:ring-2 hover:ring-sky-500 transition-all"
        >
          {otherUser?.photoURL ? (
            <img src={otherUser.photoURL} alt={otherUser.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <UserIcon size={20} />
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <button 
            onClick={() => openProfile(otherUserId)}
            className="text-base font-bold text-slate-800 truncate hover:underline text-left flex items-center gap-1.5"
          >
            {otherUser?.displayName || 'User'}
            {otherUser?.role === 'admin' && (
              <BadgeCheck className="text-blue-500 flex-shrink-0" size={16} fill="currentColor" stroke="white" />
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Start a conversation with {otherUser?.displayName || 'this user'}
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user.uid;
            const showTime = index === 0 || 
              new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60 * 1000;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {showTime && (
                  <span className="text-[10px] text-slate-400 mb-2 mt-2 px-2">
                    {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <div 
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isMe 
                      ? 'bg-sky-600 text-white rounded-tr-sm' 
                      : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="absolute bottom-[72px] left-0 right-0 bg-white border-t border-slate-100 p-3">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-sky-600 text-white p-2.5 rounded-full hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
