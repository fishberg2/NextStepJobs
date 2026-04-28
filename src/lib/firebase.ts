import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserData } from './store';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const handleRedirectResult = async () => {
  try {
    const res = await getRedirectResult(auth);
    if (res && res.user) {
      const userDocRef = doc(db, 'users', res.user.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        await setDoc(userDocRef, {
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
          email: res.user.email,
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (error: any) {
    console.error("Error handling redirect result", error);
  }
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const res = await signInWithPopup(auth, provider);
    // Initialize user doc if not exists
    const userDocRef = doc(db, 'users', res.user.uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      await setDoc(userDocRef, {
        displayName: res.user.displayName,
        photoURL: res.user.photoURL,
        email: res.user.email,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cross-origin-opener-policy-failed') {
      // Fallback to exactly what Firebase recommends: redirect
      await signInWithRedirect(auth, provider);
    } else {
      console.error("Error signing in with Google", error);
      alert("Error signing in with Google: " + error.message);
    }
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export const fetchUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data", error);
    return null;
  }
};

export const updateUserData = async (uid: string, data: Partial<UserData>) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating user data", error);
  }
};

export const fetchNetworkUsers = async (): Promise<(UserData & { id: string })[]> => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as (UserData & { id: string }));
  } catch (error) {
    console.error("Error fetching network users", error);
    return [];
  }
};
