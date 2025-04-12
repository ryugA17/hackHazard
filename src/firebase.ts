import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';

// Your web app's Firebase configuration
// Replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: "AIzaSyC5du5Ib1lINdK-gy_poupvMfLYyF-JGz0",
  authDomain: "pikadex-d6235.firebaseapp.com",
  projectId: "pikadex-d6235",
  storageBucket: "pikadex-d6235.firebasestorage.app",
  messagingSenderId: "415825446566",
  appId: "1:415825446566:web:a9504860480da993569667",
  measurementId: "G-HP52NNDP29"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Function to sign in with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return null;
  }
};

// Function to sign out
export const signOut = async (): Promise<void> => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export { auth }; 