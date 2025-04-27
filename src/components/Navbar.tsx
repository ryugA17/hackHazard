import React from 'react';
import { useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logonav.png';
import Dragon from '../assets/animated-dragon-image-0129.gif';
import { auth, signOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useProfile } from '../context/ProfileContext';
import { WalletConnect } from './WalletConnect';
import ScrollToTopLink from './ScrollToTopLink';

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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <ScrollToTopLink to="/">
            <img src={logo} alt="Logo" className="logo-image" />
            <span className="logo-text">QuestMint</span>
            <img src={Dragon} alt="Dragon" className="dragon-gif" />
          </ScrollToTopLink>
        </div>
        
        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <div className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        
        <div className={`navbar-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
          <ScrollToTopLink to="/rules" className={`nav-link ${location.pathname === '/rules' ? 'active' : ''}`}>
            <span className="nav-icon">📜</span>
            <span className="nav-text">Rulebook</span>
          </ScrollToTopLink>
          <ScrollToTopLink to="/community" className={`nav-link ${location.pathname === '/community' ? 'active' : ''}`}>
            <span className="nav-icon">🏰</span>
            <span className="nav-text">Tavern</span>
          </ScrollToTopLink>
          <ScrollToTopLink to="/map" className={`nav-link ${location.pathname === '/map' ? 'active' : ''}`}>
            <span className="nav-icon">🗺️</span>
            <span className="nav-text">Battlemap</span>
          </ScrollToTopLink>
          <ScrollToTopLink to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <span className="nav-icon">⚔️</span>
            <span className="nav-text">Quest Board</span>
          </ScrollToTopLink>
        </div>
        
        <div className="navbar-buttons">
          <WalletConnect />
          
          {user ? (
            <div className="user-menu">
              <ScrollToTopLink to="/profile" className="user-profile-link">
                <div className="user-avatar">
                  <img src={profilePic} alt={displayName || 'User'} />
                </div>
                {displayName && <span className="user-name">{displayName}</span>}
              </ScrollToTopLink>
              {/* Hide sign out button if required */}
              {!hideSignOutButton && (
                <button 
                  onClick={handleSignOut} 
                  className="signout-btn"
                  disabled={loading}
                >
                  {loading ? 'Leaving...' : 'Leave Realm'}
                </button>
              )}
            </div>
          ) : (
            <ScrollToTopLink to="/signup" className="signup-btn">Join Adventure</ScrollToTopLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 
