import React from 'react';
import { Link } from 'react-router-dom';
import './ProfilePage.css';
import Footer from './Footer';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Placeholder image imports - replace with actual assets later
import defaultAvatar from '../assets/random component.gif';
import headerBackground from '../assets/profile.gif';

const ProfilePage = () => {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  
  // Default fallback info
  const defaultUsername = "Hardik";
  const defaultHandle = "@hardikiltop80299";
  
  // Get current date for new users
  const currentDate = new Date();
  const joinDate = `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  
  const stats = {
    exercises: 0,
    totalXp: 0, 
    courseBadges: 0,
    dailyStreak: 2
  };
  
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Extract display name and profile pic from Google account
  const username = user?.displayName || defaultUsername;
  const handle = user?.email ? `@${user.email.split('@')[0]}` : defaultHandle;
  const profilePic = user?.photoURL || defaultAvatar;
  
  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }
  
  return (
    <>
      <div className="profile-page">
        <div className="profile-header">
          <div className="profile-header-bg">
            <img src={headerBackground} alt="Profile background" />
          </div>
          <div className="profile-header-content">
          </div>
        </div>

        <div className="profile-avatar-container">
          <div className="profile-avatar-large">
            <img src={profilePic} alt={username} />
          </div>
          <div className="profile-info">
            <div className="username-container">
              <h1>{username}</h1>
              <button className="edit-profile-btn">Edit Profile</button>
            </div>
            <p className="profile-handle">{handle}</p>
            <div className="profile-follow-info">
              <span className="follow-count">0 following</span>
              <span className="follow-count">0 followers</span>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <div className="tab active">Bio</div>
          <div className="tab">Pinned</div>
          <div className="tab">Stats</div>
          <div className="tab">Skills</div>
          <div className="tab">Pet Café</div>
          <div className="tab">Posts (0)</div>
          <div className="tab">Projects (0)</div>
          <div className="tab">Certificates</div>
        </div>

        <div className="profile-content">
          <div className="profile-section profile-bio">
            <div className="bio-level">
              <span className="trophy-icon">🏆</span>
              <span>Lvl 1</span>
            </div>
            <p className="bio-empty-state">
              You don't have anything in your bio. 
              <Link to="/account" className="bio-link">Go to account</Link> and edit profile to add something cool about yourself.
            </p>
            <div className="profile-joined">
              <span className="joined-icon">🗓️</span> Joined {joinDate}
            </div>
          </div>

          <div className="profile-section profile-pinned">
            <div className="pinned-placeholder">
              <p>Pin a project</p>
            </div>
          </div>

          <div className="profile-section profile-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>EXERCISES</h3>
                <span className="stat-value">{stats.exercises}</span>
              </div>
              <div className="stat-card">
                <h3>TOTAL XP</h3>
                <span className="stat-value">{stats.totalXp}</span>
              </div>
              <div className="stat-card">
                <h3>COURSE BADGES</h3>
                <span className="stat-value">{stats.courseBadges}</span>
              </div>
              <div className="stat-card">
                <h3>DAILY STREAK</h3>
                <span className="stat-value">{stats.dailyStreak}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-section profile-skills">
            <p>Add skills from <Link to="/account/settings">account settings</Link>.</p>
          </div>

          <div className="profile-section pet-cafe">
            <div className="pet-egg-container">
              <img src={require('../assets/egg-icon.png')} alt="Pet egg" className="pet-egg" />
            </div>
          </div>

          <div className="profile-section profile-posts">
            <div className="empty-state">
              <p>You have not made a post yet.</p>
              <p>Say hi in the <Link to="/community">community</Link></p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfilePage; 