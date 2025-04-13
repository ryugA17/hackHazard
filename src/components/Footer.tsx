import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Pikadex</h3>
            <p>Your ultimate Pokémon encyclopedia and community platform.</p>
          </div>
          
          <div className="footer-section">
            <h3>Explore</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/pokedex">Pokédex</Link></li>
              <li><Link to="/rules">Game Rules</Link></li>
              <li><Link to="/community">Community</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Connect</h3>
            <ul>
              <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a></li>
              <li><a href="https://discord.com" target="_blank" rel="noopener noreferrer">Discord</a></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact</h3>
            <ul>
              <li><a href="mailto:support@pikadex.com">support@pikadex.com</a></li>
              <li><a href="tel:+15551234567">+1 555 123 4567</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Pikadex. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 