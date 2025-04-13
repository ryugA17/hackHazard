import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h2 className="hero-subtitle">START YOUR</h2>
        <h1 className="hero-title">
          <span className="coding">Gaming</span>
          <span className="adventure">Adventure</span>
        </h1>
        <p className="hero-description">
          The most fun and beginner-friendly way to learn to code. +♦
        </p>
        <button className="get-started-btn" onClick={handleGetStarted}>Get Started</button>
      </div>
    </section>
  );
};

export default HeroSection; 