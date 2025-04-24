import React from 'react';
import './CommunityPage.css';
import './ScrollAnimations.css';
import Footer from './Footer';
import { setupScrollAnimations } from '../utils/scrollAnimations';

const CommunityPage = () => {
  React.useEffect(() => {
    // Set up scroll animations
    setupScrollAnimations();
  }, []);

  return (
    <>
      <div className="community-page">
        <div className="community-container">
          <h1 className="community-title">Community</h1>
          <div className="community-title-underline"></div>
          
          <div className="community-content fade-in">
            <div className="community-section">
              <h2>Welcome to the QuestMint Community</h2>
              <p>Gather 'round, brave souls! This is the heart of the QuestMint realm — where vision meets valor and legends are forged together.</p>
              <p>Connect with fellow adventurers, explore the greater mission behind the game, and uncover what lies beyond the horizon.</p>
              <p></p>
              <h2 className="slide-in-left" style={{animationDelay: '0.2s'}}>Future Scope</h2>
              <p>The journey is just beginning. Here's what's on our magical roadmap:</p>
              <ul className="slide-in-left" style={{animationDelay: '0.3s'}}>
                <li>Multiverse Campaigns — Support for cross-realm adventures and dynamic storytelling across multiple campaign settings.</li>
                <li>Creator Economy — Game Masters can mint their campaigns, dungeons, or custom characters as tradable digital assets.</li>
                <li>AR Integration — Immersive experiences where your tabletop realm blends with the real world using Augmented Reality</li>
              </ul>
              <p className="quote">🧙 "Every great game is but the first chapter in an epic saga." – Elric the Ever-Seer</p>
              <h2 className="slide-in-right" style={{animationDelay: '0.4s'}}>Business Model</h2>
              <p>Our economy is powered by creativity, community, and crypto.</p>
              <ul className="slide-in-right" style={{animationDelay: '0.5s'}}> 
                <li>Play-to-Own NFTs — Players earn character skins, weapons, and achievements that are actually theirs.</li>
                <li>Marketplace Royalties — Quest creators earn from secondary NFT sales when others trade their crafted content.</li>
                <li>Season Passes & Lorebooks — Premium content for hardcore adventurers who crave deeper tales and exclusive challenges.</li>
              </ul>
              <p className="highlight-text">🪙 Explore Revenue Paths</p>
              <h2 className="slide-in-left" style={{animationDelay: '0.6s'}}>Featured Community Members</h2>
              <p>This space honors our most legendary heroes, creators, and tacticians. Want to be here? Forge your legend and rise through the ranks.</p>
              <p className="creators-title">Creators</p>
              <ul className="creators-list fade-in" style={{animationDelay: '0.7s'}}>
                <li>Hardik</li>
                <li>Aditya Pawar</li>
                <li>Prateek Sinha</li>
                <li>Hardik Agrawal</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CommunityPage; 