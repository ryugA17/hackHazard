import React from 'react';
import './StatsSection.css';
import './ScrollAnimations.css';
import { setupScrollAnimations } from '../utils/scrollAnimations';
import { useNavigate } from 'react-router-dom';
import signupBackground from '../assets/dnd.avif';
import boyAvatar from '../assets/avatars/boy.gif';
import girlAvatar from '../assets/avatars/girl.gif';
import robotAvatar from '../assets/avatars/robot.gif';
import foxboyAvatar from '../assets/avatars/foxboy.gif';
import foxgirlAvatar from '../assets/avatars/foxgirl.gif';
import Dragon from '../assets/animated-dragon-image-0129.gif';

const StatsSection = () => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    // Set up scroll animations
    const cleanup = setupScrollAnimations();
    
    // Clean up on unmount
    return cleanup;
  }, []);

  const handleJoinNow = () => {
    navigate('/signup');
  };

  return (
    <section className="stats-section">
      <div className="stats-overlay"></div>
      
      <div className="cta-container">
        <div className="cta-content fade-in">
          <h2 className="cta-title">Join the Adventure</h2>
          <p className="cta-description">
            Begin your journey into the world of Dungeons & Dragons and NFT rewards. Create a character, join a party, and start collecting valuable digital assets.
          </p>
          
          <div className="stats-grid">
            <div className="stat-card slide-in-left">
              <div className="stat-icon">🏆</div>
              <div className="stat-number">250+</div>
              <div className="stat-label">Unique NFTs</div>
            </div>
            
            <div className="stat-card slide-in-left" style={{animationDelay: '0.2s'}}>
              <div className="stat-icon">👥</div>
              <div className="stat-number">5,000+</div>
              <div className="stat-label">Active Players</div>
            </div>
            
            <div className="stat-card slide-in-left" style={{animationDelay: '0.4s'}}>
              <div className="stat-icon">🎮</div>
              <div className="stat-number">100+</div>
              <div className="stat-label">Campaigns</div>
            </div>
            
            <div className="stat-card slide-in-left" style={{animationDelay: '0.6s'}}>
              <div className="stat-icon">💎</div>
              <div className="stat-number">$2M+</div>
              <div className="stat-label">NFT Value</div>
            </div>
          </div>
          
          <button className="join-now-btn" onClick={handleJoinNow}>
            Join Now
          </button>
        </div>
        
        <div className="characters-showcase scale-in stagger-2">
          <div className="character-container">
            <img src={boyAvatar} alt="Character" className="character-image char1" />
            <div className="character-label">Warrior</div>
          </div>
          <div className="character-container">
            <img src={girlAvatar} alt="Character" className="character-image char2" />
            <div className="character-label">Ranger</div>
          </div>
          <div className="character-container">
            <img src={robotAvatar} alt="Character" className="character-image char3" />
            <div className="character-label">Artificer</div>
          </div>
          <div className="character-container">
            <img src={foxboyAvatar} alt="Character" className="character-image char4" />
            <div className="character-label">Druid</div>
          </div>
          <div className="character-container">
            <img src={foxgirlAvatar} alt="Character" className="character-image char5" />
            <div className="character-label">Sorcerer</div>
          </div>
          <img src={Dragon} alt="Dragon" className="dragon-image" />
        </div>
      </div>
    </section>
  );
};

export default StatsSection; 