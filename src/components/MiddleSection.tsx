import React from 'react';
import './MiddleSection.css';
import './ScrollAnimations.css';
import pokeBattle1 from '../assets/bg1.png';
import pokeBattle2 from '../assets/dragon2.webp';
import codeGif from '../assets/battle.gif';
import robotAvatar from '../assets/avatars/robot.gif';
import foxboyAvatar from '../assets/avatars/foxboy.gif';
import foxgirlAvatar from '../assets/avatars/foxgirl.gif';
import { setupScrollAnimations } from '../utils/scrollAnimations';

const MiddleSection = () => {
  React.useEffect(() => {
    // Set up scroll animations
    const cleanup = setupScrollAnimations();
    
    // Clean up on unmount
    return cleanup;
  }, []);

  return (
    <section className="middle-section">
      <div className="section-title-container">
        <h2 className="section-title">How It Works</h2>
        <div className="section-title-underline"></div>
      </div>
      
      {/* Main Features */}
      <div className="features-container">
        <div className="feature-card slide-in-left">
          <div className="feature-icon-container">
            <span className="feature-icon">🎲</span>
          </div>
          <h3 className="feature-title">Play D&D Campaigns</h3>
          <p className="feature-description">
            Join immersive Dungeons & Dragons campaigns with friends or other players. Our interactive map system makes gameplay smooth and engaging.
          </p>
        </div>
        
        <div className="feature-card slide-in-left" style={{animationDelay: '0.2s'}}>
          <div className="feature-icon-container">
            <span className="feature-icon">⚔️</span>
          </div>
          <h3 className="feature-title">Complete Quests</h3>
          <p className="feature-description">
            Embark on quests, battle monsters, and solve puzzles. Your decisions matter and shape the story's outcome and rewards.
          </p>
        </div>
        
        <div className="feature-card slide-in-left" style={{animationDelay: '0.4s'}}>
          <div className="feature-icon-container">
            <span className="feature-icon">💰</span>
          </div>
          <h3 className="feature-title">Earn NFT Rewards</h3>
          <p className="feature-description">
            Turn your achievements into valuable NFTs. Collect rare items, character skins, and magical artifacts as blockchain assets.
          </p>
        </div>
      </div>
      
      {/* Game Experience Section */}
      <div className="game-experience-container">
        <div className="game-image-container slide-in-right">
          <div className="game-image">
            <img src={pokeBattle1} alt="D&D Gameplay" className="main-game-image" />
            <div className="character-overlay">
              <img src={foxboyAvatar} alt="Character" className="character-avatar avatar1" />
              <img src={robotAvatar} alt="Character" className="character-avatar avatar2" />
              <img src={foxgirlAvatar} alt="Character" className="character-avatar avatar3" />
            </div>
          </div>
        </div>
        
        <div className="game-description fade-in">
          <h2 className="game-title">Immersive Fantasy Experience</h2>
          <p className="game-text">
            Our platform combines traditional D&D gameplay with modern technology. Create your character, join a party, and embark on epic adventures led by experienced Dungeon Masters.
          </p>
          <ul className="game-features-list">
            <li className="game-feature-item">Interactive battle maps</li>
            <li className="game-feature-item">Character customization</li>
            <li className="game-feature-item">Voice and text chat integration</li>
            <li className="game-feature-item">Dice rolling mechanics</li>
          </ul>
        </div>
      </div>
      
      {/* NFT Rewards Section */}
      <div className="nft-rewards-container">
        <div className="nft-description fade-in">
          <h2 className="nft-title">Unique NFT Rewards</h2>
          <p className="nft-text">
            Your achievements in the game are transformed into exclusive NFTs. These digital assets can be collected, traded, or sold on our marketplace.
          </p>
          <ul className="nft-features-list">
            <li className="nft-feature-item">Character skins</li>
            <li className="nft-feature-item">Magical weapons and items</li>
            <li className="nft-feature-item">Achievement badges</li>
            <li className="nft-feature-item">Limited edition collectibles</li>
          </ul>
        </div>
        
        <div className="nft-image-container scale-in stagger-2">
          <div className="nft-image">
            <img src={pokeBattle2} alt="NFT Rewards" className="main-nft-image" />
            <div className="nft-glow"></div>
          </div>
          <div className="battle-gif-container">
            <img src={codeGif} alt="Battle Animation" className="battle-gif" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MiddleSection; 