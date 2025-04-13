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

        <div className="profile-container">
          <div className="profile-main">
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
          </div>

          <div className="stats-panel">
            <h2>Your Stats</h2>
            <div className="profile-stats">
              <span className="stat-icon xp-icon">{stats.totalXp}</span>
              <span className="stat-details"><p>Total XP</p></span>
              
              <span className="stat-icon rank-icon">Bronze</span>
              <span className="stat-details"><p>Rank</p></span>
              
              <span className="stat-icon badges-icon">{stats.courseBadges}</span>
              <span className="stat-details"><p>Badges</p></span>
              
              <span className="stat-icon streak-icon">{stats.dailyStreak}</span>
              <span className="stat-details"><p>Day streak</p></span>
            </div>
          </div>

          <div className="pet-cafe-panel">
            <h2>Pet Café</h2>
            <div className="pet-egg-container">
              <img src={require('../assets/egg-icon.png')} alt="Pet egg" className="pet-egg" />
            </div>
            <p>Raise your virtual pet by coding daily!</p>
          </div>

          <h2 className="skills-title">Skills</h2>
          
          <div className="skills-grid">
            <div className="skill-card">
              <h3>HTML</h3>
              <div className="skill-level">
                <div className="level-bar" style={{width: '70%'}}></div>
              </div>
            </div>
            <div className="skill-card">
              <h3>CSS</h3>
              <div className="skill-level">
                <div className="level-bar" style={{width: '65%'}}></div>
              </div>
            </div>
            <div className="skill-card">
              <h3>JavaScript</h3>
              <div className="skill-level">
                <div className="level-bar" style={{width: '50%'}}></div>
              </div>
            </div>
            <div className="skill-card">
              <h3>React</h3>
              <div className="skill-level">
                <div className="level-bar" style={{width: '40%'}}></div>
              </div>
            </div>
          </div>

          <div className="projects-header">
            <h2 className="projects-title">Projects</h2>
            <Link to="/projects" className="see-all-link">See all</Link>
          </div>
          
          <div className="projects-grid">
            <div className="empty-project">
              <p>You haven't created any projects yet.</p>
              <button className="create-project-btn">Create a project</button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfilePage; 