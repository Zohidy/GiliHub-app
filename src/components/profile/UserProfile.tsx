import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { User, Mail, Shield, Calendar, LogOut, Edit2, Check, X, Loader2, AlertTriangle, Link as LinkIcon, Settings, Moon, Sun, Bell, Globe, ChevronRight, Download, CircleDollarSign, Ruler, BadgeCheck, Plus, Trash2, Twitter, Instagram, Facebook, Linkedin, Github, RefreshCw } from 'lucide-react';
import { doc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { toast } from 'sonner';

export default function UserProfile() {
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineReady, setOfflineReady] = useState(false);
  const [currency, setCurrency] = useState('IDR');
  const [distanceUnit, setDistanceUnit] = useState('km');

  if (!userData) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
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
    <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 pb-24 transition-colors duration-300">
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

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">My Profile</h2>
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
                  className="absolute -bottom-1 -right-1 p-1.5 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-700 transition-all"
                  title="Generate Random Avatar"
                >
                  <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
            <button 
              onClick={isEditing ? handleSave : handleEdit}
              disabled={isSubmitting}
              className="p-3 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (isEditing ? <Check size={20} /> : <Edit2 size={20} />)}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="text-2xl font-bold bg-transparent border-b border-sky-500 w-full focus:outline-none" maxLength={50} />
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
                <span key={interest} className="text-xs font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-3 py-1 rounded-full">{interest}</span>
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
                    className="text-[10px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
                    className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                  <button onClick={() => removeSocialLink(index)} className="text-rose-500 p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={addSocialLink}
                className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-400 hover:border-sky-500 hover:text-sky-500 transition-all flex items-center justify-center gap-2"
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
                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
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
      </div>

      {/* Settings Section */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight mb-3 flex items-center gap-2">
          <Settings size={20} className="text-sky-500" />
          Settings
        </h2>
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          
          {/* Theme Toggle */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={toggleTheme}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Dark Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Toggle dark theme</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${theme === 'dark' ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Notifications */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Bell size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Push notifications</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Language */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Globe size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Language</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">English (US)</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </div>

          {/* Offline Data */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setOfflineReady(!offlineReady)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Download size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Offline Maps & Data</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Save content to device</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${offlineReady ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${offlineReady ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Currency */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setCurrency(currency === 'IDR' ? 'USD' : 'IDR')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <CircleDollarSign size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Currency</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">For bookings and prices</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{currency}</span>
              <ChevronRight size={18} className="text-slate-400" />
            </div>
          </div>

          {/* Distance Unit */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setDistanceUnit(distanceUnit === 'km' ? 'mi' : 'km')}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Ruler size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Distance Unit</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kilometers or Miles</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{distanceUnit === 'km' ? 'Kilometers' : 'Miles'}</span>
              <ChevronRight size={18} className="text-slate-400" />
            </div>
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