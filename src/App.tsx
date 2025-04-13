import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HeroSection from './components/HeroSection';
import SignupPage from './components/SignupPage';
import StatsSection from './components/StatsSection';

// Home page component
const HomePage = () => {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
      </main>
      <Footer />
    </>
  );
};

const App = () => {
  return (
    <div className="app">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={
            <>
              <Navbar />
              <SignupPage />
              <Footer />
            </>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App; 