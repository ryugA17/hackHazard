import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Footer from './Footer';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import userAvatar from '../assets/random component.gif';
import computerIcon from '../assets/bot.gif';
import rocketIcon from '../assets/random component.gif';
import eggIcon from '../assets/egg-icon.png';
import codeIcon from '../assets/code-icon.png';
import loadingicon from '../assets/ass.gif';
import monadLogo from '../assets/monad logo.webp';
import groqLogo from '../assets/groq logo.png';
import screenpipeLogo from '../assets/screenpipe logo.png';
import { useProfile } from '../context/ProfileContext';
import ScrollToTopLink from './ScrollToTopLink';

const Dashboard = () => {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();
  const { profileData, profilePic } = useProfile();
  
  // Default fallback info
  const defaultUsername = "hardikiltop80299";
  
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Extract username from Google account email or profile data
  const username = profileData.username 
    || user?.displayName 
    || (user?.email ? user.email.split('@')[0] : defaultUsername);
  
  // For debugging
  console.log("Dashboard user info:", { 
    displayName: user?.displayName,
    email: user?.email,
    photoURL: user?.photoURL,
    uid: user?.uid,
    profileData
  });
  
  // Handler for the Get Started button
  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  // Determine game plan display
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
  
  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }
  
  return (
    <>
      <div className="dashboard">
        <div className="dashboard-container">
          {/* Greeting section */}
          <div className="greeting-section">
            <div className="computer-icon">
              <img src={computerIcon} alt="Computer" />
            </div>
            <div className="greeting-message">
              <p>Hi @{username}! We've been waiting for ya.</p>
            </div>
          </div>

          {/* Main content area */}
          <div className="dashboard-main">
            <div className="dashboard-welcome">
              <div className="pixel-trainer">
                <img src={loadingicon} alt="Pixel Trainer" />
              </div>
              <h1 className="welcome-title">Welcome to Gamedex!</h1>
              <p className="welcome-subtitle">Your Gaming journey awaits—but first let's find something to learn.</p>
              <button className="get-started-btn" onClick={handleGetStarted}>
                {profileData.avatarId ? 'Update Your Profile' : 'Get Started'}
              </button>
            </div>
          </div>

          {/* User profile panel */}
          <div className="profile-panel">
            <div className="profile-header">
              <img 
                src={profilePic} 
                alt="User Avatar" 
                className="profile-avatar" 
                onError={(e) => {
                  console.log("Dashboard profile image failed to load, using fallback");
                  e.currentTarget.src = userAvatar;
                }}
              />
              <div className="profile-info">
                <h2>{profileData.name || username}</h2>
                <p>{gamePlanDisplay} - Level {profileData.level || 1}</p>
              </div>
            </div>
            
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-icon xp-icon">8</span>
                <span className="stat-details"><p>XP</p></span>
              </div>
              
              <div className="stat-item">
                <span className="stat-icon badges-icon">8</span>
                <span className="stat-details"><p>BADGES</p></span>
              </div>
              
              <div className="stat-item">
                <span className="stat-icon rank-icon">BRONZE</span>
                <span className="stat-details"><p>RANK</p></span>
              </div>
              
              <div className="stat-item">
                <span className="stat-icon streak-icon">{profileData.level || 2}</span>
                <span className="stat-details"><p>STREAK</p></span>
              </div>
            </div>
            
            <button className="view-profile-btn" onClick={() => navigate('/profile')}>View profile</button>
          </div>

          {/* Events panel */}
          <div className="events-panel">
            <h2>Upcoming Events</h2>
            
            <div className="event-item">
              <div className="event-date">
                <span className="event-month">APR</span>
                <span className="event-day">16</span>
              </div>
              <div className="event-details">
                <h3>Smash Karts Tournament</h3>
                <p>Wed Apr 16th @ 3:00pm ET</p>
              </div>
            </div>
            
            <div className="event-item">
              <div className="event-date">
                <span className="event-month">APR</span>
                <span className="event-day">23</span>
              </div>
              <div className="event-details">
                <h3>Node.js Workshop</h3>
                <p>Wed Apr 23rd @ 3:00pm ET</p>
              </div>
            </div>
            
            <div className="event-item">
              <div className="event-date">
                <span className="event-month">MAY</span>
                <span className="event-day">7</span>
              </div>
              <div className="event-details">
                <h3>Resume Review Workshop</h3>
                <p>Wed May 7th @ 3:00pm ET</p>
              </div>
            </div>
          </div>

          {/* NFT Gallery Section */}
          <div className="nft-gallery-section">
            <div className="section-header">
              <h2 className="section-title">My NFT Collection</h2>
              <ScrollToTopLink to="/nfts" className="see-all-link">View All</ScrollToTopLink>
            </div>
            <div className="nft-preview-container">
              <ScrollToTopLink to="/nfts" className="nft-preview-card">
                <div className="nft-preview-icon">
                  <img src="/assets/nft-icon.png" alt="NFT" onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/40x40/4dabf7/ffffff?text=NFT";
                  }} />
                </div>
                <div className="nft-preview-content">
                  <h3>Your NFT Collection</h3>
                  <p>Check out your NFT collection and mint new ones!</p>
                </div>
              </ScrollToTopLink>
            </div>
          </div>

          {/* Sponsors section */}
          <h2 className="sponsors-title">Our Technology Partners</h2>
          <p className="sponsors-subtitle">Powered by cutting-edge technology for the best gaming experience</p>
          
          <div className="sponsors-grid">
            <div className="sponsor-card">
              <div className="sponsor-icon">
                <img src={monadLogo} alt="Monad" className="sponsor-logo" />
              </div>
              <div className="sponsor-content">
                <h3>Monad</h3>
                <p>Powering our blockchain infrastructure with high-performance Layer-1 technology.</p>
              </div>
            </div>
            
            <div className="sponsor-card">
              <div className="sponsor-icon">
                <img src={groqLogo} alt="Groq" className="sponsor-logo" />
              </div>
              <div className="sponsor-content">
                <h3>Groq</h3>
                <p>Advanced AI processing with cutting-edge LPU technology for lightning-fast responses.</p>
              </div>
            </div>
            
            <div className="sponsor-card">
              <div className="sponsor-icon">
                <img src={screenpipeLogo} alt="Screenpipe" className="sponsor-logo" />
              </div>
              <div className="sponsor-content">
                <h3>Screenpipe</h3>
                <p>Revolutionary screen reading technology for enhanced gaming accessibility.</p>
              </div>
            </div>
          </div>

          {/* New tutorials section */}
          <div className="tutorials-header">
            <h2 className="tutorials-title"></h2>
            <ScrollToTopLink to="/tutorials" className="see-all-link">See all</ScrollToTopLink>
          </div>
          
          <div className="tutorials-grid">
            <div className="tutorial-card">
              <div className="tutorial-image">
                {/* Placeholder for tutorial image */}
                <div className="image-placeholder" style={{backgroundColor: "lightblue"}}></div>
              </div>
              <div className="tutorial-info">
                <span className="tutorial-label">TUTORIAL</span>
                <h3>Animate Images with CSS keyframes</h3>
                <div className="tutorial-tags">
                  <span className="tag level-tag">BEGINNER</span>
                  <span className="tag language-tag">HTML</span>
                </div>
              </div>
            </div>
            
            <div className="tutorial-card">
              <div className="tutorial-image">
                {/* Placeholder for tutorial image */}
                <div className="image-placeholder" style={{backgroundColor: "lightgreen"}}></div>
              </div>
              <div className="tutorial-info">
                <span className="tutorial-label">TUTORIAL</span>
                <h3>Analyze U.S. Census Data with SciPy</h3>
                <div className="tutorial-tags">
                  <span className="tag level-tag">INTERMEDIATE</span>
                  <span className="tag language-tag">PYTHON</span>
                </div>
              </div>
            </div>
            
            <div className="tutorial-card">
              <div className="tutorial-image">
                {/* Placeholder for tutorial image */}
                <div className="image-placeholder" style={{backgroundColor: "purple"}}></div>
              </div>
              <div className="tutorial-info">
                <span className="tutorial-label">TUTORIAL</span>
                <h3>Build a Chat Game with p5.js</h3>
                <div className="tutorial-tags">
                  <span className="tag level-tag">INTERMEDIATE</span>
                  <span className="tag language-tag">JAVASCRIPT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard; 