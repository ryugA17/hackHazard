import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroSection.css';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const HeroSection = () => {
  const navigate = useNavigate();
  const [isSignedIn, setIsSignedIn] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsSignedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const scrollToMiddleSection = () => {
    const middleSection = document.querySelector('.middle-section');
    if (middleSection) {
      middleSection.scrollIntoView({ behavior: 'smooth' });
    }
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
        <button className="get-started-btn" onClick={handleGetStarted}>
          {isSignedIn ? 'Go to Dashboard' : 'Get Started'}
        </button>
      </div>
      <div className="scroll-indicator" onClick={scrollToMiddleSection}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection; 