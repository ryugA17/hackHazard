import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>QuestMint</h3>
            <p>Crafted by Trainers, Powered by Legends.</p>
          </div>
          
          <div className="footer-section">
            <h3>Explore</h3>
            <ul>
              <li><Link to="/" onClick={() => window.scrollTo(0, 0)}>Home</Link></li>
              <li><Link to="/rules">Game Rules</Link></li>
              <li><Link to="/community">Community</Link></li>
              <li><Link to="/map">Battlemap</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Connect</h3>
            <ul>
              <li><a href="https://github.com/ryugA17/hackHazard.git" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact</h3>
            <ul>
              <li><a href="mailto:ps826105@gmail.com">ps826105@gmail.com</a></li>
              <li><a href="tel:+919142116703">+9142116703</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} QuestMint. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 