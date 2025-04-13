import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/navbar.png';
import pikachuRunning from '../assets/pikachu-running.gif';
import { auth, signOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface NavbarProps {
  hideDashboardSignOut?: boolean;
}

const Navbar = ({ hideDashboardSignOut = false }: NavbarProps) => {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

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
        </div>
        
        <div className="navbar-buttons">
          <button className="theme-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </button>
          
          {user ? (
            <div className="user-menu">
              <div className="user-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} />
                ) : (
                  <span>{user.displayName?.[0] || user.email?.[0] || '?'}</span>
                )}
              </div>
              {/* Hide sign out button on dashboard */}
              {!(isDashboard && hideDashboardSignOut) && (
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