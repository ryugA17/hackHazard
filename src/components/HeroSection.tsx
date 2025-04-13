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
    </section>
  );
};

export default HeroSection; 