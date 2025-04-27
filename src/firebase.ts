import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  User, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

// Get Firebase configuration from environment variables or use fallback
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_CONFIG_API_KEY || "AIzaSyC5du5Ib1lINdK-gy_poupvMfLYyF-JGz0",
  authDomain: process.env.REACT_APP_FIREBASE_CONFIG_AUTH_DOMAIN || "pikadex-d6235.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_CONFIG_PROJECT_ID || "pikadex-d6235",
  storageBucket: process.env.REACT_APP_FIREBASE_CONFIG_STORAGE_BUCKET || "pikadex-d6235.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_CONFIG_MESSAGING_SENDER_ID || "415825446566",
  appId: process.env.REACT_APP_FIREBASE_CONFIG_APP_ID || "1:415825446566:web:a9504860480da993569667",
  measurementId: process.env.REACT_APP_FIREBASE_CONFIG_MEASUREMENT_ID || "G-HP52NNDP29"
};

// Initialize Firebase lazily
let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let googleProvider: GoogleAuthProvider | undefined;

// Helper to initialize Firebase when needed
const initFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    // Add scopes to request profile information
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  }
  
  return { app, auth: auth!, googleProvider: googleProvider! };
};

// Safe logging that doesn't log in production
const safeLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

const safeError = (message: string, error: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(message, error);
  }
};

// Function to sign in with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const { auth, googleProvider } = initFirebase();
    const result = await signInWithPopup(auth, googleProvider);
    safeLog("Google sign-in successful:", result.user);
    return result.user;
  } catch (error) {
    safeError("Error signing in with Google:", error);
    return null;
  }
};

// Function to sign up with email and password
export const signUpWithEmailAndPassword = async (
  email: string, 
  password: string
): Promise<User | null> => {
  try {
    const { auth } = initFirebase();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    safeLog("Email signup successful:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    safeError("Error signing up with email:", error);
    throw error;
  }
};

// Function to sign in with email and password
export const loginWithEmailAndPassword = async (
  email: string, 
  password: string
): Promise<User | null> => {
  try {
    const { auth } = initFirebase();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    safeLog("Email login successful:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    safeError("Error logging in with email:", error);
    throw error;
  }
};

// Function to sign out
export const signOut = async (): Promise<void> => {
  try {
    const { auth } = initFirebase();
    await auth.signOut();
  } catch (error) {
    safeError("Error signing out:", error);
  }
};

export { getAuth };
// Expose auth only when needed
export const getFirebaseAuth = () => {
  const { auth } = initFirebase();
  return auth;
};