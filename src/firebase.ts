import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  User, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

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

// Add scopes to request profile information
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Function to sign in with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Log to debug profile info
    console.log("Google sign-in successful:", result.user);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return null;
  }
};

// Function to sign up with email and password
export const signUpWithEmailAndPassword = async (
  email: string, 
  password: string
): Promise<User | null> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Email signup successful:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up with email:", error);
    throw error;
  }
};

// Function to sign in with email and password
export const loginWithEmailAndPassword = async (
  email: string, 
  password: string
): Promise<User | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Email login successful:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in with email:", error);
    throw error;
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