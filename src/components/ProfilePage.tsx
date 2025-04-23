import React from 'react';
import { Link } from 'react-router-dom';
import './ProfilePage.css';
import Footer from './Footer';
import { useProfile, ProfileData } from '../context/ProfileContext';
import headerBackground from '../assets/profile.gif';
import defaultAvatar from '../assets/random component.gif';
import { NFTGallery } from './NFTGallery';

// Interface for EditProfilePage props
interface EditProfilePageProps {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  onSave: () => void;
  onCancel: () => void;
  profilePic: string;
}

const ProfilePage = () => {
  const { profileData, updateProfileData, loading, profilePic } = useProfile();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState<ProfileData>(profileData);
  
  // Default fallback info
  const defaultUsername = "Hardik";
  const defaultHandle = "@hardikiltop80299";
  
  // Use the join date from profile data or create a new one
  const joinDate = profileData.joinDate || `${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getDate()}, ${new Date().getFullYear()}`;
  
  // Game plan emoji mapping
  const gamePlanEmoji = {
    casual: '🎮',
    pro: '🏆',
    team: '👥'
  };
  
  // Determine what emoji to show based on the game plan
  const planEmoji = profileData.gamePlan ? 
    gamePlanEmoji[profileData.gamePlan as keyof typeof gamePlanEmoji] || '🎮' : 
    '🎮';
  
  // Determine the game plan display name
  const getPlanDisplayName = (planKey: string | null): string => {
    if (!planKey) return 'Casual Gamer';
    
    const planNames: {[key: string]: string} = {
      casual: 'Casual Gamer',
      pro: 'Pro Gamer',
      team: 'Team Player'
    };
    
    return planNames[planKey] || 'Casual Gamer';
  };
  
  const gamePlanDisplay = getPlanDisplayName(profileData.gamePlan);
  
  const stats = {
    exercises: 0,
    totalXp: 0, 
    courseBadges: 0,
    dailyStreak: profileData.level || 1
  };
  
  if (loading) {
    return <div className="loading">Loading your realm profile...</div>;
  }
  
  // Handle save profile changes
  const handleSaveProfile = () => {
    // Update the global profile data (persists across the application)
    updateProfileData(editData);
    setIsEditing(false);
  };
  
  if (isEditing) {
    return <EditProfilePage 
      profileData={editData} 
      setProfileData={setEditData} 
      onSave={handleSaveProfile} 
      onCancel={() => setIsEditing(false)}
      profilePic={profilePic}
    />;
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
            <img 
              src={profilePic} 
              alt={profileData.name} 
              onError={(e) => {
                console.log("Profile image failed to load, using fallback");
                e.currentTarget.src = defaultAvatar;
              }}
            />
          </div>
          <div className="profile-info">
            <div className="username-container">
              <h1>{profileData.name || defaultUsername}</h1>
              <button className="edit-profile-btn" onClick={() => {
                setEditData({...profileData});
                setIsEditing(true);
              }}>Edit Your Legend</button>
            </div>
            <p className="profile-handle">@{profileData.username || defaultHandle.substring(1)}</p>
            <div className="profile-follow-info">
              <span className="follow-count">0 companions</span>
              <span className="follow-count">0 followers</span>
            </div>
          </div>
        </div>

        <div className="profile-container">
          <div className="profile-main">
            <div className="profile-section profile-bio">
              <div className="bio-level">
                <span className="trophy-icon">{planEmoji}</span>
                <span>Lvl {profileData.level || 1} {gamePlanDisplay}</span>
              </div>
              {profileData.bio ? (
                <p className="bio-content">{profileData.bio}</p>
              ) : (
                <p className="bio-empty-state">
                  Your adventurer's tale remains unwritten. 
                  <button onClick={() => {
                    setEditData({...profileData});
                    setIsEditing(true);
                  }} className="bio-link">Craft your story</button> to share your quest with fellow adventurers.
                </p>
              )}
              <div className="profile-joined">
                <span className="joined-icon">🗓️</span> Joined the realm on {joinDate}
              </div>
              {profileData.location && (
                <div className="profile-location">
                  <span className="location-icon">📍</span> {profileData.location}
                </div>
              )}
              {profileData.work && (
                <div className="profile-work">
                  <span className="work-icon">💼</span> {profileData.work}
                </div>
              )}
              {profileData.education && (
                <div className="profile-education">
                  <span className="education-icon">🎓</span> {profileData.education}
                </div>
              )}
            </div>
          </div>

          <div className="stats-panel">
            <h2>Adventure Stats</h2>
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

          <div className="profile-section">
            <div className="section-header">
              <h2>My Treasure Vault</h2>
              <Link to="/nfts" className="see-all-link">View all treasures</Link>
            </div>
            <div className="nft-preview">
              <NFTGallery preview={true} maxDisplay={3} />
            </div>
          </div>

          <h2 className="skills-title">Hero Abilities</h2>
          
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
            <h2 className="projects-title">Epic Quests</h2>
            <Link to="/projects" className="see-all-link">View all quests</Link>
          </div>
          
          <div className="projects-grid">
            <div className="empty-project">
              <p>You haven't embarked on any quests yet.</p>
              <button className="create-project-btn">Begin a New Quest</button>
            </div>
          </div>
        </div> 
      </div>
      <Footer />
    </>
  );
};

// Edit Profile Component
const EditProfilePage = ({ 
  profileData, 
  setProfileData, 
  onSave, 
  onCancel, 
  profilePic 
}: EditProfilePageProps) => {
  // Add game plan options for editing
  const gamePlanOptions = [
    { value: 'casual', label: 'Casual Gamer' },
    { value: 'pro', label: 'Pro Gamer' },
    { value: 'team', label: 'Team Player' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        <div className="edit-profile-sidebar">
          <h2 className="account-heading">Account Settings</h2>
          <ul className="account-menu">
            <li className="account-menu-item active">
              <span className="account-menu-icon">👤</span>
              Profile
            </li>
            <li className="account-menu-item">
              <span className="account-menu-icon">🔐</span>
              Security
            </li>
            <li className="account-menu-item">
              <span className="account-menu-icon">💰</span>
              Wallet
            </li>
            <li className="account-menu-item">
              <span className="account-menu-icon">🔔</span>
              Notifications
            </li>
          </ul>
        </div>
        
        <div className="edit-profile-content">
          <div className="edit-profile-section">
            <h3 className="section-heading">Your Hero Profile</h3>
            <p className="section-description">
              Customize your hero's legend that will be shown to other adventurers in the realm.
            </p>
            
            <div className="profile-picture-section">
              <div className="profile-picture-container">
                <img 
                  src={profilePic} 
                  alt="Profile picture" 
                  className="edit-profile-picture"
                  onError={(e) => {
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
                <div className="change-picture-btn">
                  <span className="edit-icon">📷</span>
                  Change
                </div>
              </div>
              <div className="profile-picture-info">
                <p>Upload a character portrait that represents your heroic identity.</p>
                <p>Recommended: Square image, at least 400x400 pixels.</p>
              </div>
            </div>
          </div>
          
          <div className="edit-profile-section">
            <h3 className="section-heading">Hero Details</h3>
            
            <div className="form-group">
              <label htmlFor="name">Display Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name || ''}
                onChange={handleInputChange}
                placeholder="Enter your display name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="username-input-group">
                <span className="username-prefix">@</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={profileData.username || ''}
                  onChange={handleInputChange}
                  placeholder="username"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={profileData.bio || ''}
                onChange={handleInputChange}
                placeholder="Write a brief description about yourself and your journey..."
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="gamePlan">Gaming Style</label>
              <select 
                id="gamePlan" 
                name="gamePlan"
                value={profileData.gamePlan || 'casual'}
                onChange={handleInputChange}
              >
                {gamePlanOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="edit-profile-section">
            <h3 className="section-heading">Personal Details</h3>
            
            <div className="form-group">
              <label htmlFor="location">Kingdom (Location)</label>
              <input
                type="text"
                id="location"
                name="location"
                value={profileData.location || ''}
                onChange={handleInputChange}
                placeholder="e.g., Stormwind, Azeroth"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="work">Guild (Work/Company)</label>
              <input
                type="text"
                id="work"
                name="work"
                value={profileData.work || ''}
                onChange={handleInputChange}
                placeholder="e.g., Knight of the Silver Hand"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="education">Training (Education)</label>
              <input
                type="text"
                id="education"
                name="education"
                value={profileData.education || ''}
                onChange={handleInputChange}
                placeholder="e.g., Mage Academy of Dalaran"
              />
            </div>
          </div>
          
          <div className="edit-profile-actions">
            <button className="save-changes-btn" onClick={onSave}>
              Save Legend
            </button>
            <button className="view-profile-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 
