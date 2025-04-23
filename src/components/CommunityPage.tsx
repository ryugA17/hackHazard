import React from 'react';
import './CommunityPage.css';
import Footer from './Footer';

const CommunityPage = () => {
  return (
    <>
      <div className="community-page">
        <div className="community-container">
          <h1 className="community-title">Community</h1>
          
          <div className="community-content">
            <div className="community-section">
              <h2>Welcome to the QuestMint Community</h2>
              <p>Gather 'round, brave souls! This is the heart of the QuestMint realm — where vision meets valor and legends are forged together.</p>
              <p>Connect with fellow adventurers, explore the greater mission behind the game, and uncover what lies beyond the horizon.</p>
              <p></p>
              <h2>Future Scope</h2>
              <p>The journey is just beginning. Here's what's on our magical roadmap:</p>
              <ul>
                <li>Multiverse Campaigns — Support for cross-realm adventures and dynamic storytelling across multiple campaign settings.</li>
                <li>Creator Economy — Game Masters can mint their campaigns, dungeons, or custom characters as tradable digital assets.</li>
                <li>AR Integration — Immersive experiences where your tabletop realm blends with the real world using Augmented Reality</li>
              </ul>
              <p>🧙 “Every great game is but the first chapter in an epic saga.” – Elric the Ever-Seer</p>
              <h2>Business Model</h2>
              <p>Our economy is powered by creativity, community, and crypto.</p>
              <ul> 
                <li>Play-to-Own NFTs — Players earn character skins, weapons, and achievements that are actually theirs.</li>
                <li>Marketplace Royalties — Quest creators earn from secondary NFT sales when others trade their crafted content.</li>
                <li>Season Passes & Lorebooks — Premium content for hardcore adventurers who crave deeper tales and exclusive challenges.</li>
              </ul>
              <p>🪙 Explore Revenue Paths</p>
              <h2>Featured Community Members</h2>
              <p>This space honors our most legendary heroes, creators, and tacticians. Want to be here? Forge your legend and rise through the ranks.</p>
              <p>Craetors</p>
              <ul>
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