import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED 
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Menggunakan konfigurasi asli dari Firebase Console
import firebaseConfig from '../../firebase-applet-config.json';

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi layanan (Auth, Firestore, Realtime Database)
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Mengaktifkan Offline Persistence untuk Firestore
// Ini sangat krusial untuk aplikasi di area sinyal lemah seperti Gili Trawangan
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled
    // in one tab at a a time.
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the
    // features required to enable persistence
    console.warn('Firestore persistence not supported by browser');
  }
});

export default app;
