import React from 'react';
import './RulesPage.css';
import Footer from './Footer';

const RulesPage = () => {
  return (
    <>
      <div className="rules-page">
        <div className="rules-container">
          <h1 className="rules-title">Game Rules</h1>
          
          <div className="rules-content">
            <div className="rules-section">
              <h2>Getting Started</h2>
              <p>Welcome to Pikadex! Here you'll find all the rules and guidelines for playing the game.</p>
              <p>This page is ready for your content. You can add game rules, instructions, and any guidelines here.</p>
            </div>
            
            <div className="rules-section">
              <h2>Basic Gameplay</h2>
              <ul>
                <li>Rule 1: Add your content here</li>
                <li>Rule 2: Add your content here</li>
                <li>Rule 3: Add your content here</li>
              </ul>
            </div>
            
            <div className="rules-section">
              <h2>Advanced Techniques</h2>
              <p>Add your content here describing advanced gameplay techniques.</p>
            </div>
            
            <div className="rules-section">
              <h2>Tournaments</h2>
              <p>Add your content here about tournament rules and structures.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RulesPage; 