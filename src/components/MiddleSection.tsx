import React from 'react';
import './MiddleSection.css';
import './ScrollAnimations.css';
import pokeBattle1 from '../assets/poke battle 1.jpg';
import pokeBattle2 from '../assets/poke battle 22.jpg';
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
      <div className="middle-container">
        {/* Left Side - Code Lesson Interface */}
        <div className="code-interface-container slide-in-left">
          <div className="battle-image-container">
            <img src={pokeBattle1} alt="Pokemon Battle" className="battle-image" />
          </div>
        </div>

        {/* Right Side - Level Up section */}
        <div className="level-up-container slide-in-right">
          <div className="character-group">
           
          </div>
          <h2 className="level-up-title">Level up your learning</h2>
          <p className="level-up-desc">
            Gain XP and collect badges as you complete bite-sized
            lessons in Python, HTML, JavaScript, and more. Our
            beginner-friendly curriculum makes learning to code as
            motivating as completing your next quest.
          </p>
        </div>
      </div>
      
      {/* Bottom Section - Coding Chops */}
      <div className="coding-chops-container">
        <div className="coding-chops-content fade-in">
          <h2 className="coding-chops-title">Practice your coding chops</h2>
          <p className="coding-chops-desc">
            Take your skills further with code challenges and project
            tutorials designed to help you apply what you learned to
            real-world problems and examples.
          </p>
        </div>
        
        {/* Battle image on the right of the coding chops section */}
        <div className="coding-battle-image-container scale-in stagger-2">
          <img src={pokeBattle2} alt="Pokemon Battle" className="coding-battle-image" />
        </div>
      </div>
    </section>
  );
};

export default MiddleSection; 