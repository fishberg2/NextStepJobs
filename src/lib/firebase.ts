import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';

const firebaseConfig = {
  projectId: "nextstep-83c96",
  appId: "1:701481021696:web:6d595a7cc14457b095c3e5",
  apiKey: "AIzaSyBgVVuxIHdzJd9ODkaBcRJIPg9x1QqUazY",
  authDomain: "nextstep-83c96.firebaseapp.com",
  storageBucket: "nextstep-83c96.firebasestorage.app",
  messagingSenderId: "701481021696",
  measurementId: "G-86L8GV402N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const handleRedirectResult = async () => {
  try {
    const res = await getRedirectResult(auth);
    if (res && res.user) {
      console.log("Redirect sign-in successful", res.user);
    }
  } catch (error: any) {
    console.error("Error handling redirect result", error);
  }
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const res = await signInWithPopup(auth, provider);
    console.log("Popup sign-in successful", res.user);
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cross-origin-opener-policy-failed') {
      // Fallback to exactly what Firebase recommends: redirect
      await signInWithRedirect(auth, provider);
    } else if (error.code === 'auth/unauthorized-domain') {
      console.error("Unauthorized domain error", error);
      alert("This domain is not authorized for Firebase Authentication yet. Please add this domain to your Firebase Console under Authentication > Settings > Authorized Domains.");
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
