import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import Sponsors from './components/Sponsors';
import SignupPage from './components/SignupPage';
import StatsSection from './components/StatsSection';

// Home page component
const HomePage = () => {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <Sponsors />
        <StatsSection />
      </main>
    </>
  );
};

const App = () => {
  return (
    <div className="app">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App; 