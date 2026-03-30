import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { User, Mail, Shield, Calendar, LogOut, Edit2, Check, X, Loader2, AlertTriangle, Link as LinkIcon, Settings, ChevronRight, BadgeCheck, Plus, Trash2, Twitter, Instagram, Facebook, Linkedin, Github, RefreshCw, Compass, Clock, MapPin } from 'lucide-react';
import { doc, updateDoc, getDoc, setDoc, deleteDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { toast } from 'sonner';

interface UserProfileProps {
  setActiveTab?: (tab: 'home' | 'map' | 'booking' | 'events' | 'forum' | 'chat' | 'profile' | 'about' | 'settings' | 'privacy' | 'terms' | 'planner') => void;
}

export default function UserProfile({ setActiveTab }: UserProfileProps) {
  const { user, userData, signOut, sendVerificationEmail } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [editSocialLinks, setEditSocialLinks] = useState<{ platform: string, url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    const tripsQuery = query(
      collection(db, 'trips'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTrips = onSnapshot(tripsQuery, (snapshot) => {
      setMyTrips(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      setMyBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoadingData(false);
    });

    return () => {
      unsubscribeTrips();
      unsubscribeBookings();
    };
  }, [user]);

  if (!userData) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
      </div>
    );
  }

  const handleEdit = () => {
    setEditName(userData.displayName);
    setEditPhotoURL(userData.photoURL || '');
    setEditBio(userData.bio || '');
    setEditInterests(userData.interests?.join(', ') || '');
    const links = userData.socialLinks ? Object.entries(userData.socialLinks).map(([platform, url]) => ({ 
      platform: platform.charAt(0).toUpperCase() + platform.slice(1), 
      url: url as string 
    })) : [];
    setEditSocialLinks(links);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedName = editName.trim();
      const trimmedBio = editBio.trim();
      const interestsArray = editInterests.split(',').map(i => i.trim()).filter(i => i !== '');
      
      const socialLinksObj = editSocialLinks.reduce((acc, link) => {
        if (link.platform && link.url) {
          acc[link.platform.toLowerCase()] = link.url;
        }
        return acc;
      }, {} as Record<string, string>);
      
      // Check if username changed and if it's unique
      if (trimmedName !== userData.displayName) {
        const newUsernameRef = doc(db, 'usernames', trimmedName);
        const newUsernameSnap = await getDoc(newUsernameRef);

        if (newUsernameSnap.exists() && newUsernameSnap.data().uid !== userData.uid) {
          toast.error('Username is already taken. Please choose another one.');
          setIsSubmitting(false);
          return;
        }

        // Claim new username
        try {
          await setDoc(newUsernameRef, {
            uid: userData.uid,
            createdAt: new Date().toISOString()
          });
          
          // Delete old username
          if (userData.displayName) {
            await deleteDoc(doc(db, 'usernames', userData.displayName));
          }
        } catch (e) {
          console.error("Could not update username registry", e);
        }
      }

      const userRef = doc(db, 'users', userData.uid);
      const publicRef = doc(db, 'users_public', userData.uid);
      
      // If photoURL is empty, use Dicebear as default
      const finalPhotoURL = editPhotoURL || `https://api.dicebear.com/7.x/lorelei/svg?seed=${trimmedName}`;
      
      const updates = { 
        displayName: trimmedName,
        photoURL: finalPhotoURL,
        bio: trimmedBio || '',
        interests: interestsArray,
        socialLinks: socialLinksObj,
        updatedAt: new Date().toISOString()
      };

      await setDoc(userRef, updates, { merge: true });
      await setDoc(publicRef, updates, { merge: true });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userData.uid}`);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateDicebearAvatar = () => {
    const seed = editName.trim() || userData.displayName;
    const styles = ['lorelei', 'avataaars', 'bottts', 'adventurer', 'open-peeps', 'pixel-art', 'notionists', 'rings'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const newAvatar = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}-${Date.now()}`;
    setEditPhotoURL(newAvatar);
    toast.success('New avatar generated!');
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
      toast.success('Verification email sent!');
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (error) {
      console.error("Failed to send verification email", error);
      toast.error('Failed to send verification email');
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const addSocialLink = () => {
    setEditSocialLinks([...editSocialLinks, { platform: 'Website', url: '' }]);
  };

  const removeSocialLink = (index: number) => {
    setEditSocialLinks(editSocialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const newLinks = [...editSocialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setEditSocialLinks(newLinks);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return <Twitter size={18} />;
      case 'instagram': return <Instagram size={18} />;
      case 'facebook': return <Facebook size={18} />;
      case 'linkedin': return <Linkedin size={18} />;
      case 'github': return <Github size={18} />;
      default: return <LinkIcon size={18} />;
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 pb-32 transition-colors duration-300">
      {user?.isAnonymous && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col gap-3 shadow-sm">
          <div className="flex items-start gap-3 text-amber-700 dark:text-amber-400">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Peringatan Akun Tamu</p>
              <p className="text-xs mt-1 leading-relaxed">
                Anda menggunakan akun tamu. Data Anda akan <strong>dihapus otomatis setelah 30 hari</strong> jika tidak digunakan.
              </p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full py-2 bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-700 transition-colors"
          >
            <LinkIcon size={14} />
            Kaitkan Akun Anda Sekarang!
          </button>
        </div>
      )}

      <div className="mb-8 flex justify-between items-end relative z-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900 dark:text-white tracking-tight uppercase">My Profile</h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Manage your account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile Card - Spans 2 columns */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center shadow-md">
                {(isEditing ? editPhotoURL : userData.photoURL) ? (
                  <img src={isEditing ? editPhotoURL : userData.photoURL} alt={userData.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={40} className="text-slate-400 dark:text-slate-500" />
                )}
              </div>
              {isEditing && (
                <button 
                  onClick={generateDicebearAvatar}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-electric-blue text-white rounded-full shadow-lg hover:bg-electric-blue-dark transition-all"
                  title="Generate Random Avatar"
                >
                  <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
            <button 
              onClick={isEditing ? handleSave : handleEdit}
              disabled={isSubmitting}
              className="p-3 bg-electric-blue/10 dark:bg-electric-blue/20 text-electric-blue dark:text-electric-blue-light rounded-full hover:bg-electric-blue/20 dark:hover:bg-electric-blue/30 transition-colors"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (isEditing ? <Check size={20} /> : <Edit2 size={20} />)}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="text-2xl font-bold bg-transparent border-b border-electric-blue w-full focus:outline-none" maxLength={50} />
              <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="text-sm bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl w-full p-3" rows={3} maxLength={500} placeholder="Bio..." />
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{userData.displayName}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">{userData.bio || 'No bio yet.'}</p>
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between">
          <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Community</h4>
          <div className="flex justify-between mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{userData.followersCount || 0}</p>
              <p className="text-xs text-slate-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{userData.followingCount || 0}</p>
              <p className="text-xs text-slate-500">Following</p>
            </div>
          </div>
        </div>

        {/* Interests Card - Spans 2 columns */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Interests</h4>
          {isEditing ? (
            <input type="text" value={editInterests} onChange={(e) => setEditInterests(e.target.value)} className="text-sm bg-transparent border-b border-slate-200 dark:border-slate-700 w-full p-2" placeholder="surfing, coding, travel" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {userData.interests?.map((interest: string) => (
                <span key={interest} className="text-xs font-bold bg-electric-blue/10 dark:bg-electric-blue/20 text-electric-blue dark:text-electric-blue-light px-3 py-1 rounded-full">{interest}</span>
              )) || <p className="text-slate-400 text-sm">No interests added.</p>}
            </div>
          )}
        </div>

        {/* Social Links Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Social</h4>
          {isEditing ? (
            <div className="space-y-3">
              {editSocialLinks.map((link, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select 
                    value={link.platform} 
                    onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                    className="text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-electric-blue/20"
                  >
                    <option value="Twitter">Twitter</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Website">Website</option>
                  </select>
                  <input 
                    type="url" 
                    value={link.url} 
                    onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-electric-blue/20"
                  />
                  <button onClick={() => removeSocialLink(index)} className="text-rose-500 p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={addSocialLink}
                className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-400 hover:border-electric-blue hover:text-electric-blue transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Add Link
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {userData.socialLinks && Object.entries(userData.socialLinks).length > 0 ? (
                Object.entries(userData.socialLinks).map(([platform, url]) => (
                  <a 
                    key={platform} 
                    href={url as string} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-electric-blue dark:hover:text-electric-blue-light hover:bg-electric-blue/10 dark:hover:bg-electric-blue/20 transition-all"
                    title={platform}
                  >
                    {getPlatformIcon(platform)}
                  </a>
                ))
              ) : (
                <p className="text-slate-400 text-sm italic">No social links.</p>
              )}
            </div>
          )}
        </div>

        {/* My Activity Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* My Trips Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Compass size={18} />
                </div>
                <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">My Trips</h4>
              </div>
              <button 
                onClick={() => setActiveTab?.('planner')}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {myTrips.length > 0 ? (
                myTrips.slice(0, 2).map((trip) => (
                  <div key={trip.id} className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <MapPin size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{trip.title}</h4>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">{trip.dates}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No trips planned yet.</p>
                  <button 
                    onClick={() => setActiveTab?.('planner')}
                    className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
                  >
                    Start Planning
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* My Bookings Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Calendar size={18} />
                </div>
                <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">My Bookings</h4>
              </div>
              <button 
                onClick={() => setActiveTab?.('booking')}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {myBookings.length > 0 ? (
                myBookings.slice(0, 2).map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-600' : 
                      booking.status === 'cancelled' ? 'bg-rose-500/20 text-rose-600' : 'bg-amber-500/20 text-amber-600'
                    }`}>
                      <Clock size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{booking.serviceTitle}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{booking.date}</span>
                        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600' : 
                          booking.status === 'cancelled' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No bookings found.</p>
                  <button 
                    onClick={() => setActiveTab?.('booking')}
                    className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline"
                  >
                    Explore Services
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="mt-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          
          {/* Settings Button */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setActiveTab && setActiveTab('settings')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                <Settings size={20} />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-white">Settings</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Preferences, Privacy, and About</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </div>

        </div>
      </div>

      <button 
        onClick={signOut}
        className="w-full mt-6 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold py-4 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  );
}