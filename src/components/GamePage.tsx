import React from 'react';
import Footer from './Footer';
import GameEmulator from './GameEmulator';
import './GamePage.css';

const GamePage: React.FC = () => {
  return (
    <>
      <div className="game-page">
        <div className="game-page-header">
          <h1>Play Pokémon FireRed</h1>
          <p>Experience the classic Pokémon adventure directly in your browser!</p>
        </div>
        
        <div className="game-page-content">
          <GameEmulator />
          
          <div className="game-instructions">
            <h2>How to Play</h2>
            <p>Use the keyboard controls to navigate and interact with the game.</p>
            <p>Save your progress regularly using the in-game save feature.</p>
            <p>Have fun exploring the Kanto region and catching Pokémon!</p>
          </div>
          
          <div className="disclaimer">
            <h3>Disclaimer</h3>
            <p>This emulator is provided for educational purposes only. To play this game legally, you should own a physical copy of the Pokémon FireRed game cartridge.</p>
            <p>Pokémon and Pokémon character names are trademarks of Nintendo.</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default GamePage; 