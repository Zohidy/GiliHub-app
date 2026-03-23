import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInAnonymously as firebaseSignInAnonymously, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  setupRecaptcha: (containerId: string) => RecaptchaVerifier;
  signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  sendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const ADJECTIVES = ['Sunny', 'Happy', 'Wandering', 'Brave', 'Clever', 'Swift', 'Chill', 'Tropical', 'Island', 'Ocean', 'Mystic', 'Coral', 'Breezy', 'Salty', 'Wild'];
  const NOUNS = ['Turtle', 'Gecko', 'Manta', 'Dolphin', 'Coconut', 'Mango', 'Surfer', 'Nomad', 'Traveler', 'Sailor', 'Diver', 'Explorer', 'Monkey', 'Shark', 'Ray'];

  const generateUniqueUsername = async (uid: string) => {
    let isUnique = false;
    let attempts = 0;
    let username = '';
    
    while (!isUnique && attempts < 10) {
      const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
      const num = Math.floor(Math.random() * 1000);
      
      username = `${adj}${noun}${num}`;

      try {
        const usernameRef = doc(db, 'usernames', username);
        const usernameSnap = await getDoc(usernameRef);
        
        if (!usernameSnap.exists()) {
          // Claim it
          await setDoc(usernameRef, {
            uid: uid,
            createdAt: new Date().toISOString()
          });
          isUnique = true;
          return username;
        }
      } catch (error) {
        console.error("Error checking username uniqueness:", error);
        // Fallback if rules prevent reading/writing usernames
        return `${adj}${noun}${num}`;
      }
      attempts++;
    }
    return username || `Guest${Math.floor(Math.random() * 100000)}`;
  };

  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    const syncUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          let displayName = user.displayName || 'User';
          
          if (user.isAnonymous) {
            displayName = await generateUniqueUsername(user.uid);
          }

          const newUserData: any = {
            uid: user.uid,
            displayName: displayName,
            email: user.email || 'user@example.com',
            role: (user.email === 'zohidydy@gmail.com' || user.email === 'zohidin384@gmail.com') ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
            bio: '',
            followersCount: 0,
            followingCount: 0
          };
          
          const publicUserData: any = {
            uid: user.uid,
            displayName: displayName,
            role: newUserData.role,
            createdAt: newUserData.createdAt,
            bio: '',
            followersCount: 0,
            followingCount: 0
          };
          
          if (user.photoURL) {
            newUserData.photoURL = user.photoURL;
            publicUserData.photoURL = user.photoURL;
          }
          
          await setDoc(userRef, newUserData);
          await setDoc(doc(db, 'users_public', user.uid), publicUserData);
          setUserData(newUserData);
        } else {
          const data = userSnap.data();
          // Auto-upgrade zohidydy@gmail.com to admin if they are not already
          if ((user.email === 'zohidydy@gmail.com' || user.email === 'zohidin384@gmail.com') && data.role !== 'admin') {
            const updatedData = { ...data, role: 'admin' };
            await setDoc(userRef, updatedData, { merge: true });
            await setDoc(doc(db, 'users_public', user.uid), { role: 'admin' }, { merge: true });
            setUserData(updatedData);
          } else {
            setUserData(data);
            // Ensure public profile exists/is synced
            await setDoc(doc(db, 'users_public', user.uid), {
              uid: data.uid,
              displayName: data.displayName,
              photoURL: data.photoURL || null,
              role: data.role,
              createdAt: data.createdAt,
              bio: data.bio || '',
              followersCount: data.followersCount || 0,
              followingCount: data.followingCount || 0
            }, { merge: true });
          }
        }
      } catch (error) {
        console.error("Error syncing user data to Firestore:", error);
      }
    };

    syncUserData();
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Google successfully');
    } catch (error) {
      console.error("Error signing in with Google", error);
      toast.error('Failed to sign in with Google');
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      await sendEmailVerification(result.user);
      toast.success('Account created! Please check your email to verify.');
    } catch (error: any) {
      console.error("Error signing up with email", error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Signed in successfully');
    } catch (error: any) {
      console.error("Error signing in with email", error);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    }
  };

  const signInAnonymously = async () => {
    try {
      await firebaseSignInAnonymously(auth);
      toast.success('Signed in as Guest');
    } catch (error) {
      console.error("Error signing in anonymously", error);
      toast.error('Failed to sign in as Guest');
      throw error;
    }
  };

  const setupRecaptcha = (containerId: string) => {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible'
    });
  };

  const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    try {
      return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    } catch (error: any) {
      console.error("Error signing in with phone", error);
      toast.error(error.message || 'Failed to send verification code');
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        toast.success('Verification email sent!');
      } catch (error: any) {
        console.error("Error sending verification email", error);
        toast.error(error.message || 'Failed to send verification email');
        throw error;
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error("Error signing out", error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, signInAnonymously, setupRecaptcha, signInWithPhone, sendVerificationEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
