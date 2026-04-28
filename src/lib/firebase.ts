import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export const handleRedirectResult = async () => {
  try {
    const res = await getRedirectResult(auth);
    if (res && res.user) {
      console.log("Redirect sign-in successful", res.user);
    }
  } catch (error: any) {
    console.error("Error handling redirect result", error);
    if (error.code === 'auth/api-key-not-valid') {
      console.error("CRITICAL: Firebase API Key is invalid. Check your project configuration.");
    }
  }
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    // In some environments, popup might fail immediately with internal errors
    // Attempt popup first, but be ready for fallback
    const res = await signInWithPopup(auth, provider);
    console.log("Popup sign-in successful", res.user);
  } catch (error: any) {
    console.error("Auth Error Code:", error.code);
    
    // If popup is blocked, cancelled, or fails with an internal assertion (common in iframes)
    const fallbackCodes = [
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/internal-error',
      'auth/cross-origin-opener-policy-failed'
    ];

    if (fallbackCodes.includes(error.code) || error.message?.includes('Pending promise')) {
      console.log("Falling back to redirect...");
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError: any) {
        console.error("Redirect sign-in failed", redirectError);
        alert("Login failed: " + redirectError.message);
      }
    } else {
      console.error("Error signing in with Google", error);
      alert("Login Error: " + error.message);
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
