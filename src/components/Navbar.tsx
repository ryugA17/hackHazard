import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logogogogogogo.png';
import pikachuRunning from '../assets/pikachu-running.gif';
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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <img src={logo} alt="Codedex" />
            <span>Pikadex</span>
            <img src={pikachuRunning} alt="Pikachu running" className="pikachu-gif" />
          </Link>
        </div>
        
        <div className="navbar-links">
          <Link to="/rules" className="nav-link">Rules</Link>
          <Link to="/community" className="nav-link">Community</Link>
          <Link to="/map" className="nav-link">Game Map</Link>
          <Link to="/nfts" className="nav-link">NFT Gallery</Link>
        </div>
        
        <div className="navbar-buttons">
          <WalletConnect />
          <button className="theme-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </button>
          
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="user-profile-link">
                <div className="user-avatar">
                  <img src={profilePic} alt={profileData.name || 'User'} />
                </div>
                {profileData.name && <span className="user-name">{profileData.name}</span>}
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
