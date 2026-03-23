import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { User, Mail, Shield, Calendar, LogOut, Edit2, Check, X, Loader2, AlertTriangle, Link as LinkIcon, Settings, Moon, Sun, Bell, Globe, ChevronRight, Download, CircleDollarSign, Ruler, BadgeCheck } from 'lucide-react';
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
      
      const updates = { 
        displayName: trimmedName,
        photoURL: editPhotoURL || null,
        bio: trimmedBio || ''
      };

      await updateDoc(userRef, updates);
      await updateDoc(publicRef, updates);
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userData.uid}`);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 pb-24 relative transition-colors duration-300">
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
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account information.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-6">
        <div className="bg-sky-600 h-24"></div>
        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center shadow-md">
              {userData.photoURL ? (
                <img src={userData.photoURL} alt={userData.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={40} className="text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="p-2 bg-emerald-500 text-white rounded-full shadow-md hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                    className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full shadow-md hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleEdit}
                  className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full shadow-md border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3 mb-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Display Name</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xl font-bold text-slate-800 dark:text-white border-b-2 border-sky-500 focus:outline-none bg-transparent w-full"
                  autoFocus
                  maxLength={50}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Photo URL</label>
                <input 
                  type="text"
                  value={editPhotoURL}
                  onChange={(e) => setEditPhotoURL(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="text-sm text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 focus:outline-none focus:border-sky-500 bg-transparent w-full py-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bio</label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 bg-transparent w-full p-2 mt-1 resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{userData.displayName}</h3>
                {userData.role === 'admin' && (
                  <BadgeCheck className="text-blue-500" size={20} fill="currentColor" stroke="white" />
                )}
              </div>
              {userData.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-4 whitespace-pre-wrap">{userData.bio}</p>
              )}
              <div className="flex gap-4 mt-3 mb-2">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-800 dark:text-white">{userData.followersCount || 0}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Followers</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-800 dark:text-white">{userData.followingCount || 0}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Following</span>
                </div>
              </div>
            </>
          )}
          
          <div className="space-y-3 mt-6">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <Mail size={16} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Email</p>
                  {user && user.providerData.some(p => p.providerId === 'password') && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${user.emailVerified ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{userData.email}</p>
                {user && !user.emailVerified && user.providerData.some(p => p.providerId === 'password') && (
                  <button 
                    onClick={handleResendVerification}
                    disabled={verificationSent}
                    className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline mt-1 disabled:text-slate-400 dark:disabled:text-slate-600"
                  >
                    {verificationSent ? 'Verification Email Sent!' : 'Resend Verification Email'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <Calendar size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Joined Since</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{userData.createdAt ? formatDate(userData.createdAt) : '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight mb-3 flex items-center gap-2">
          <Settings size={20} className="text-sky-500" />
          Settings
        </h2>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          
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
        className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold py-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  );
}
