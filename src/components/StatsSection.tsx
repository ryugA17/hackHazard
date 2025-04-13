import React from 'react';
import './StatsSection.css';
import './ScrollAnimations.css';
import { setupScrollAnimations } from '../utils/scrollAnimations';
import childhoodGif from '../assets/childhood _) _3.gif';
import signupBackground from '../assets/pokebg.jpg';

const StatsSection = () => {
  React.useEffect(() => {
    // Set up scroll animations
    const cleanup = setupScrollAnimations();
    
    // Clean up on unmount
    return cleanup;
  }, []);

  return (
    <section className="stats-section" style={{ backgroundImage: `url(${signupBackground})` }}>
      <div className="stats-overlay">
        <div className="pixel-world-container">
          <div className="level-up-section slide-in-left">
            <h1 className="level-up-title">Ready to level up</h1>
            <button className="start-learning-btn">Start Gaming for Free</button>
          </div>
          
          <div className="game-world scale-in stagger-2">
            <div className="pixel-characters">
              <img src={childhoodGif} alt="Pixel Characters" className="character-gif" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection; 