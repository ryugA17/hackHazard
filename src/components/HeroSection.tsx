import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroSection.css';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Dragon from '../assets/animated-dragon-image-0129.gif';
import boyAvatar from '../assets/avatars/boy.gif';
import foxgirlAvatar from '../assets/avatars/foxgirl.gif';
import robotAvatar from '../assets/avatars/robot.gif';

const HeroSection = () => {
  const navigate = useNavigate();
  const [isSignedIn, setIsSignedIn] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsSignedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const scrollToMiddleSection = () => {
    const middleSection = document.querySelector('.middle-section');
    if (middleSection) {
      middleSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-overlay"></div>
      <div className="floating-characters">
        <img src={boyAvatar} alt="Character" className="floating-character char1" />
        <img src={foxgirlAvatar} alt="Character" className="floating-character char2" />
        <img src={robotAvatar} alt="Character" className="floating-character char3" />
        <img src={Dragon} alt="Dragon" className="floating-dragon" />
      </div>
      
      <div className="hero-content">
        <div className="hero-text-container">
          <h2 className="hero-subtitle">EMBARK ON A</h2>
          <h1 className="hero-title">
            <span className="fantasy">FANTASY</span>
            <span className="adventure">ADVENTURE</span>
          </h1>
          <p className="hero-description">
            Play Dungeons & Dragons campaigns and earn NFTs as rewards. Join the ultimate gaming adventure where your achievements become collectible digital assets.
          </p>
          
          <div className="hero-features">
            <div className="feature">
              <div className="feature-icon">🎲</div>
              <div className="feature-text">Interactive D&D Campaigns</div>
            </div>
            <div className="feature">
              <div className="feature-icon">💰</div>
              <div className="feature-text">Earn NFT Rewards</div>
            </div>
            <div className="feature">
              <div className="feature-icon">🧙‍♂️</div>
              <div className="feature-text">Create Your Hero</div>
            </div>
          </div>
          
          <button className="get-started-btn" onClick={handleGetStarted}>
            {isSignedIn ? 'Enter the Realm' : 'Begin Your Quest'}
          </button>
        </div>
      </div>
      
      <div className="scroll-indicator" onClick={scrollToMiddleSection}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection; 