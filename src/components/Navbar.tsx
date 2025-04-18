import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logogogogogogo.png';
import Dragon from '../assets/animated-dragon-image-0129.gif';
import { auth, signOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useProfile } from '../context/ProfileContext';
import { WalletConnect } from './WalletConnect';

// Properly type the interface
interface NavbarProps {
  hideDashboardSignOut?: boolean;
  disableSignOut?: boolean;
}

// Use the typed interface
const Navbar: React.FC<NavbarProps> = ({ 
  hideDashboardSignOut = false, 
  disableSignOut = false 
}) => {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const isProfile = location.pathname === '/profile';
  
  // Get profile data from context
  const { profileData, profilePic } = useProfile();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      console.log('Successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hide sign out button on dashboard, profile page, or if disabled
  const hideSignOutButton = (isDashboard && hideDashboardSignOut) || isProfile || disableSignOut;

  // Determine username to display
  const displayName = profileData.name || user?.displayName || '';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <img src={logo} alt="Codedex" />
            <span>Gamedex</span>
            <img src={Dragon} alt="Pikachu running" className="Dragon-gif" />
          </Link>
        </div>
        
        <div className="navbar-links">
          <Link to="/rules" className={`nav-link ${location.pathname === '/rules' ? 'active' : ''}`}>Rules</Link>
          <Link to="/community" className={`nav-link ${location.pathname === '/community' ? 'active' : ''}`}>Community</Link>
          <Link to="/map" className={`nav-link ${location.pathname === '/map' ? 'active' : ''}`}>Game Map</Link>
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
        </div>
        
        <div className="navbar-buttons">
          <WalletConnect />
          
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="user-profile-link">
                <div className="user-avatar">
                  <img src={profilePic} alt={displayName || 'User'} />
                </div>
                {displayName && <span className="user-name">{displayName}</span>}
              </Link>
              {/* Hide sign out button if required */}
              {!hideSignOutButton && (
                <button 
                  onClick={handleSignOut} 
                  className="signout-btn"
                  disabled={loading}
                >
                  {loading ? 'Signing out...' : 'Sign out'}
                </button>
              )}
            </div>
          ) : (
            <Link to="/signup" className="signup-btn">Sign up</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 
