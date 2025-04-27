import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';
import signupBackground from '../assets/dnd.avif';
import { getFirebaseAuth, signInWithGoogle, signUpWithEmailAndPassword, loginWithEmailAndPassword } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import boyAvatar from '../assets/avatars/boy.gif';
import robotAvatar from '../assets/avatars/robot.gif';
import foxgirlAvatar from '../assets/avatars/foxgirl.gif';
import Dragon from '../assets/animated-dragon-image-0129.gif';

interface SignupPageProps {
  onSignUp?: () => void;
}

const SignupPage = ({ onSignUp }: SignupPageProps) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = React.useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState('');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (user) {
        // User is signed in, redirect to home page
        if (onSignUp) {
          onSignUp();
        }
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [navigate, onSignUp]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };

    // Username validation (only required for signup)
    if (!isLogin && !formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (!isLogin && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!isLogin && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    // Password confirmation (only required for signup)
    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      setAuthError('');

      try {
        if (isLogin) {
          // Login with email and password
          await loginWithEmailAndPassword(formData.email, formData.password);
          console.log('Successfully logged in with email/password');
        } else {
          // Sign up with email and password
          await signUpWithEmailAndPassword(formData.email, formData.password);
          console.log('Successfully signed up with email/password');
        }
        
        if (onSignUp) {
          onSignUp();
        }
        navigate('/dashboard');
      } catch (error) {
        console.error(`Error ${isLogin ? 'logging in' : 'signing up'} with email/password:`, error);
        // Handle specific Firebase errors
        if (error instanceof FirebaseError) {
          switch(error.code) {
            case 'auth/email-already-in-use':
              setAuthError('This email is already registered. Please login instead.');
              break;
            case 'auth/invalid-email':
              setAuthError('Invalid email address.');
              break;
            case 'auth/weak-password':
              setAuthError('Password is too weak. Please use a stronger password.');
              break;
            case 'auth/user-not-found':
              setAuthError('No account found with this email. Please sign up instead.');
              break;
            case 'auth/wrong-password':
              setAuthError('Incorrect password. Please try again.');
              break;
            default:
              setAuthError(`${isLogin ? 'Login' : 'Signup'} failed. Please try again.`);
          }
        } else {
          setAuthError(`${isLogin ? 'Login' : 'Signup'} failed. Please try again.`);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError('');
      const user = await signInWithGoogle();
      if (user) {
        console.log('Successfully signed in with Google:', user);
        if (onSignUp) {
          onSignUp();
        }
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setAuthError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login and signup modes
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setAuthError('');
    setErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="signup-page">
      <div className="signup-background" style={{ backgroundImage: `url(${signupBackground})` }} />
      
      <div className="floating-characters">
        <img src={boyAvatar} alt="Character" className="floating-character avatar1" />
        <img src={foxgirlAvatar} alt="Character" className="floating-character avatar2" />
        <img src={robotAvatar} alt="Character" className="floating-character avatar3" />
        <img src={Dragon} alt="Dragon" className="floating-dragon" />
      </div>
      
      <div className="signup-container">
        <div className="signup-header">
          <h1 className="signup-title">
            {isLogin ? 'Return to the Realm' : 'Begin Your Legend'}
          </h1>
          <p className="signup-subtitle">
            {isLogin 
              ? 'Enter your credentials to continue your quest' 
              : 'Create an account to start your adventure and collect NFT rewards'}
          </p>
        </div>
        
        {authError && <div className="auth-error">{authError}</div>}
        
        <div className="social-login">
          <button 
            type="button" 
            className="google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            <span>{loading ? 'Summoning...' : `${isLogin ? 'Enter' : 'Join'} with Google`}</span>
          </button>
        </div>
        
        <div className="separator">
          <span>or</span>
        </div>
        
        <form className="signup-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">Hero Name</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose your hero name"
                className={errors.username ? 'input-error' : ''}
              />
              {errors.username && <span className="error-message">{errors.username}</span>}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Magical Scroll (Email)</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Secret Rune (Password)</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your secret password"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Secret Rune</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'input-error' : ''}
              />
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>
          )}
          
          <button
            type="submit"
            className="signup-button"
            disabled={loading}
          >
            {loading 
              ? 'Casting Spell...' 
              : isLogin ? 'Enter the Realm' : 'Begin Your Quest'}
          </button>
        </form>
        
        <div className="login-option">
          <span>
            {isLogin 
              ? "Don't have an account yet?" 
              : "Already a legendary adventurer?"}
          </span>
          <button 
            type="button" 
            className="toggle-auth-btn" 
            onClick={toggleAuthMode}
          >
            {isLogin ? 'Sign up now' : 'Login here'}
          </button>
        </div>
        
        <div className="signup-footer">
          <div className="feature-badge">🎲 Interactive D&D Campaigns</div>
          <div className="feature-badge">💰 Earn Valuable NFTs</div>
          <div className="feature-badge">⚔️ Join Epic Adventures</div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;