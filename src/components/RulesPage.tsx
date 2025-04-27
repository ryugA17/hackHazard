import React from 'react';
import './RulesPage.css';
import './ScrollAnimations.css';
import Footer from './Footer';
import { setupScrollAnimations } from '../utils/scrollAnimations';

const RulesPage = () => {
  React.useEffect(() => {
    // Set up scroll animations
    setupScrollAnimations();
  }, []);

  return (
    <>
      <div className="rules-page">
        <div className="rules-container">
          <h1 className="rules-title">Game Rules</h1>
          <div className="rules-title-underline"></div>
          
          <div className="rules-content fade-in">
            <div className="rules-section">
              <h2>Getting Started</h2>
              <p>Welcome to QuestMint — where heroic tales are forged in the fires of imagination, and every adventure earns you digital glory.</p>
              <p>In this realm, your journey is not only legendary but also rewarding, with achievements minted as collectible NFTs. Here's everything you need to get started on your path to becoming a legendary hero.</p>
            </div>
            
            <div className="rules-section slide-in-left" style={{animationDelay: '0.2s'}}>
              <h2>Basic Gameplay</h2>
              <ul>
                <li>Create Your Hero — Choose your class, race, and origin. Each choice affects your strengths, abilities, and fate.</li>
                <li>Join a Campaign — Embark on story-driven adventures. Campaigns are led by Game Masters and involve strategy, combat, and teamwork.</li>
                <li>Roll the Dice — All outcomes are decided by chance and wit. Dice rolls simulate success/failure in combat, dialogue, exploration, and challenges.</li>
                <li>Earn NFT Rewards — Conquer quests, defeat monsters, and uncover treasures to earn digital NFT assets unique to your journey.</li>
              </ul>
            </div>
            
            <div className="rules-section slide-in-right" style={{animationDelay: '0.4s'}}>
              <h2>Advanced Techniques</h2>
              <ul>
                <li>Team Tactics — Coordinate with allies for combo attacks, defensive formations, or puzzle-solving strategies.</li>
                <li>Skill Checks — Use attributes like Strength, Wisdom, or Charisma to overcome narrative obstacles or unlock secrets.</li>
                <li>Loot & Crafting — Gather magical items or rare components to forge enchanted gear, trade with others, or upgrade your hero's arsenal.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RulesPage; 