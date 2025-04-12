import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Sponsors from './components/Sponsors';

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <main>
        <HeroSection />
        <Sponsors />
      </main>
    </div>
  );
};

export default App; 