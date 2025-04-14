import React from 'react';
import { Link } from 'react-router-dom';
import './ProfilePage.css';
import Footer from './Footer';
import { useProfile, ProfileData } from '../context/ProfileContext';
import headerBackground from '../assets/profile.gif';
import defaultAvatar from '../assets/random component.gif';

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
  
  // Get current date for new users
  const currentDate = new Date();
  const joinDate = `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  
  const stats = {
    exercises: 0,
    totalXp: 0, 
    courseBadges: 0,
    dailyStreak: 2
  };
  
  if (loading) {
    return <div className="loading">Loading profile...</div>;
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
              <h1>{profileData.name}</h1>
              <button className="edit-profile-btn" onClick={() => {
                setEditData({...profileData});
                setIsEditing(true);
              }}>Edit Profile</button>
            </div>
            <p className="profile-handle">@{profileData.username}</p>
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
              {profileData.bio ? (
                <p className="bio-content">{profileData.bio}</p>
              ) : (
                <p className="bio-empty-state">
                  You don't have anything in your bio. 
                  <button onClick={() => {
                    setEditData({...profileData});
                    setIsEditing(true);
                  }} className="bio-link">Edit profile</button> to add something cool about yourself.
                </p>
              )}
              <div className="profile-joined">
                <span className="joined-icon">🗓️</span> Joined {joinDate}
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

// Edit Profile Component
const EditProfilePage = ({ 
  profileData, 
  setProfileData, 
  onSave, 
  onCancel, 
  profilePic 
}: EditProfilePageProps) => {
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parentProp, childProp] = name.split('.');
      setProfileData({
        ...profileData,
        [parentProp]: {
          ...profileData[parentProp as keyof typeof profileData] as Record<string, string>,
          [childProp]: value
        }
      });
    } else {
      setProfileData({
        ...profileData,
        [name]: value
      });
    }
  };

  return (
    <>
      <div className="edit-profile-page">
        <div className="edit-profile-container">
          <div className="edit-profile-sidebar">
            <h2 className="account-heading">Account</h2>
            <ul className="account-menu">
              <li className="account-menu-item active">
                <span className="account-menu-icon">✏️</span> Edit Profile
              </li>
              <li className="account-menu-item">
                <span className="account-menu-icon">💳</span> Billing
              </li>
              <li className="account-menu-item">
                <span className="account-menu-icon">⚙️</span> Settings
              </li>
            </ul>
          </div>
          
          <div className="edit-profile-content">
            <div className="edit-profile-section">
              <h2 className="section-heading">Personal Information</h2>
              
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <div className="username-input-group">
                  <span className="username-prefix">@</span>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={profileData.location}
                  onChange={handleInputChange}
                  placeholder="Enter your location here"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="work">Work</label>
                <input
                  type="text"
                  id="work"
                  name="work"
                  value={profileData.work}
                  onChange={handleInputChange}
                  placeholder="Enter where you work here"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="education">Education</label>
                <input
                  type="text"
                  id="education"
                  name="education"
                  value={profileData.education}
                  onChange={handleInputChange}
                  placeholder="Enter your school/college here"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  placeholder="Edit your bio here"
                  rows={5}
                />
              </div>
            </div>
            
            <div className="edit-profile-section">
              <h2 className="section-heading">Skill Set</h2>
              <p className="section-description">Coming soon! You'll be able to edit your skills here.</p>
            </div>
            
            <div className="edit-profile-section">
              <h2 className="section-heading">Social Profiles</h2>
              
              <div className="form-group">
                <label htmlFor="github">GitHub</label>
                <div className="social-input-group">
                  <span className="social-prefix">@</span>
                  <input
                    type="text"
                    id="github"
                    name="social.github"
                    value={profileData.social.github}
                    onChange={handleInputChange}
                    placeholder="Enter GitHub username"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="instagram">Instagram</label>
                <div className="social-input-group">
                  <span className="social-prefix">@</span>
                  <input
                    type="text"
                    id="instagram"
                    name="social.instagram"
                    value={profileData.social.instagram}
                    onChange={handleInputChange}
                    placeholder="Enter Instagram username"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="twitch">Twitch</label>
                <div className="social-input-group">
                  <span className="social-prefix">@</span>
                  <input
                    type="text"
                    id="twitch"
                    name="social.twitch"
                    value={profileData.social.twitch}
                    onChange={handleInputChange}
                    placeholder="Enter Twitch username"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="tiktok">TikTok</label>
                <div className="social-input-group">
                  <span className="social-prefix">@</span>
                  <input
                    type="text"
                    id="tiktok"
                    name="social.tiktok"
                    value={profileData.social.tiktok}
                    onChange={handleInputChange}
                    placeholder="Enter TikTok username"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="youtube">YouTube</label>
                <div className="social-input-group">
                  <span className="social-prefix">@</span>
                  <input
                    type="text"
                    id="youtube"
                    name="social.youtube"
                    value={profileData.social.youtube}
                    onChange={handleInputChange}
                    placeholder="Enter YouTube username"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="twitter">Twitter</label>
                <div className="social-input-group">
                  <span className="social-prefix">@</span>
                  <input
                    type="text"
                    id="twitter"
                    name="social.twitter"
                    value={profileData.social.twitter}
                    onChange={handleInputChange}
                    placeholder="Enter Twitter username"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="linkedin">LinkedIn</label>
                <div className="social-input-group">
                  <span className="social-prefix">in/</span>
                  <input
                    type="text"
                    id="linkedin"
                    name="social.linkedin"
                    value={profileData.social.linkedin}
                    onChange={handleInputChange}
                    placeholder="Enter LinkedIn username"
                  />
                </div>
              </div>
            </div>
            
            <div className="edit-profile-actions">
              <button className="save-changes-btn" onClick={onSave}>
                Save Changes
              </button>
              <button className="view-profile-btn" onClick={onCancel}>
                View Profile
              </button>
            </div>
          </div>
          
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              <img 
                src={profilePic} 
                alt="Profile"
                className="edit-profile-picture" 
              />
              <button className="change-picture-btn">
                <span className="edit-icon">✏️</span>
              </button>
            </div>
            <p className="profile-picture-info">
              *Recommended ratio 1:1 and file size less than 5 MB
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfilePage; 