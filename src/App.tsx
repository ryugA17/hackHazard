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
import { NFTProvider } from './context/NFTContext';
import { WalletConnect } from './components/WalletConnect';
import { useAccount } from 'wagmi';
import Onboarding from './components/Onboarding';
import { DungeonMasterProvider } from './context/DungeonMasterContext';
import ScrollToTop from './components/ScrollToTop';
import ScrollTopButton from './components/ScrollTopButton';

// Home page component
const HomePage = () => {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <MiddleSection />
        <StatsSection />
      </main>
      <Footer />
    </>
  );
};

// NFT Gallery page component with wallet connection check
const NFTPage = () => {
  const { isConnected } = useAccount();
  
  return (
    <>
      <Navbar />
      <div className="nft-container">
        <div className="nft-header">
          <h1 className="nft-title">My NFT Collection</h1>
          {!isConnected && <WalletConnect />}
        </div>
        <NFTGallery />
      </div>
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
        <NFTProvider>
          <DungeonMasterProvider>
            <div className="app">
              <BrowserRouter>
                <ScrollToTop />
                <ScrollTopButton />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/signup" element={
                    isSignedIn ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <>
                        <Navbar disableSignOut={true} />
                        <SignupPage onSignUp={handleSignUp} />
                      </>
                    )
                  } />
                  <Route path="/dashboard" element={
                    <>
                      <Navbar hideDashboardSignOut={true} />
                      <Dashboard />
                    </>
                  } />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/rules" element={
                    <>
                      <Navbar />
                      <RulesPage />
                    </>
                  } />
                  <Route path="/community" element={
                    <>
                      <Navbar />
                      <CommunityPage />
                    </>
                  } />
                  <Route path="/profile" element={
                    <>
                      <Navbar />
                      <ProfilePage />
                    </>
                  } />
                  <Route path="/map" element={
                    <>
                      <Navbar />
                      <GameMap />
                    </>
                  } />
                  <Route path="/nfts" element={<NFTPage />} />
                </Routes>
              </BrowserRouter>
            </div>
          </DungeonMasterProvider>
        </NFTProvider>
      </ProfileProvider>
    </WagmiConfig>
  );
};

export default App;
