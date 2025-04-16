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
import MiddleSection from './components/MiddleSection';
import GameMap from './components/GameMap';
import { NFTGallery } from './components/NFTGallery';
import { WagmiConfig } from 'wagmi';
import { config } from './config/wagmi';
import { ProfileProvider } from './context/ProfileContext';
import { WalletConnect } from './components/WalletConnect';

// Home page component
const HomePage = ({ disableSignOut = false }) => {
  return (
    <>
      <Navbar disableSignOut={disableSignOut} />
      <main>
        <HeroSection />
        <MiddleSection />
        <StatsSection />
      </main>
      <Footer />
    </>
  );
};

const App = () => {
  const [isSignedIn, setIsSignedIn] = React.useState(false);

  const handleSignUp = () => {
    setIsSignedIn(true);
  };

  return (
    <WagmiConfig config={config}>
      <ProfileProvider>
        <div className="app">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage disableSignOut={isSignedIn} />} />
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
              <Route path="/dashboard" element={
                <>
                  <Navbar hideDashboardSignOut={true} disableSignOut={isSignedIn} />
                  <Dashboard />
                </>
              } />
              <Route path="/rules" element={
                <>
                  <Navbar disableSignOut={isSignedIn} />
                  <RulesPage />
                </>
              } />
              <Route path="/community" element={
                <>
                  <Navbar disableSignOut={isSignedIn} />
                  <CommunityPage />
                </>
              } />
              <Route path="/profile" element={
                <>
                  <Navbar disableSignOut={isSignedIn} />
                  <ProfilePage />
                </>
              } />
              <Route path="/map" element={
                <>
                  <Navbar disableSignOut={isSignedIn} />
                  <GameMap />
                </>
              } />
              <Route path="/nfts" element={
                <>
                  <Navbar disableSignOut={isSignedIn} />
                  <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-between items-center mb-6">
                      <h1 className="text-3xl font-bold">My NFT Collection</h1>
                      <WalletConnect />
                    </div>
                    <NFTGallery />
                  </div>
                  <Footer />
                </>
              } />
            </Routes>
          </BrowserRouter>
        </div>
      </ProfileProvider>
    </WagmiConfig>
  );
};

export default App;
