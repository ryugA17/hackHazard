import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HeroSection from './components/HeroSection';
import SignupPage from './components/SignupPage';
import StatsSection from './components/StatsSection';
import Dashboard from './components/Dashboard';
import RulesPage from './components/RulesPage';
import CommunityPage from './components/CommunityPage';
import ProfilePage from './components/ProfilePage';

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
  // This state would normally come from your authentication system
  const [isSignedIn, setIsSignedIn] = React.useState(false);

  const handleSignUp = () => {
    // This function would handle the actual signup process
    // For demo purposes, we're just setting isSignedIn to true
    setIsSignedIn(true);
  };

  return (
    <div className="app">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={
            isSignedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <>
                <Navbar />
                <SignupPage onSignUp={handleSignUp} />
              </>
            )
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App; 