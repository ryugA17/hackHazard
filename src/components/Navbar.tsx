import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/navbar.png';
import pikachuRunning from '../assets/pikachu-running.gif';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <img src={logo} alt="Codedex" />
            <span>Pikadex</span>
            <img src={pikachuRunning} alt="Pikachu running" className="pikachu-gif" />
          </Link>
        </div>
        <div className="navbar-links">
          <div className="dropdown">
            <button className="dropbtn">Rules <span>▾</span></button>
          </div>
          <div className="dropdown">
            <button className="dropbtn">Play <span>▾</span></button>
          </div>
          
          <div className="dropdown">
            <button className="dropbtn">Community <span>▾</span></button>
          </div>
          
        </div>
        <div className="navbar-buttons">
          <button className="theme-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </button>
          <Link to="/signup" className="signup-btn">Sign up</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 