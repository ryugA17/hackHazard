import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { WagmiConfig } from 'wagmi';
import { config } from './config/wagmi';
import { ProfileProvider } from './context/ProfileContext';
import { NFTProvider } from './context/NFTContext';
import { DungeonMasterProvider } from './context/DungeonMasterContext';
import ScrollToTop from './components/ScrollToTop';
import ScrollTopButton from './components/ScrollTopButton';
import { useAccount } from 'wagmi';

// Lazy load components for better performance
const HeroSection = React.lazy(() => import('./components/HeroSection'));
const MiddleSection = React.lazy(() => import('./components/MiddleSection'));
const StatsSection = React.lazy(() => import('./components/StatsSection'));
const SignupPage = React.lazy(() => import('./components/SignupPage'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const RulesPage = React.lazy(() => import('./components/RulesPage'));
const CommunityPage = React.lazy(() => import('./components/CommunityPage'));
const ProfilePage = React.lazy(() => import('./components/ProfilePage'));
const GameMap = React.lazy(() => import('./components/GameMap'));
const NFTGallery = React.lazy(() => import('./components/NFTGallery').then(module => ({ default: module.NFTGallery })));
const WalletConnect = React.lazy(() => import('./components/WalletConnect').then(module => ({ default: module.WalletConnect })));
const Onboarding = React.lazy(() => import('./components/Onboarding'));

// Loading component for suspense fallback
const Loading = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
  </div>
);

// Home page component
const HomePage = () => {
  return (
    <>
      <Navbar />
      <main>
        <React.Suspense fallback={<Loading />}>
          <HeroSection />
          <MiddleSection />
          <StatsSection />
        </React.Suspense>
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
          <React.Suspense fallback={<Loading />}>
            {!isConnected && <WalletConnect />}
          </React.Suspense>
        </div>
        <React.Suspense fallback={<Loading />}>
          <NFTGallery />
        </React.Suspense>
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
                        <React.Suspense fallback={<Loading />}>
                          <SignupPage onSignUp={handleSignUp} />
                        </React.Suspense>
                      </>
                    )
                  } />
                  <Route path="/dashboard" element={
                    <>
                      <Navbar hideDashboardSignOut={true} />
                      <React.Suspense fallback={<Loading />}>
                        <Dashboard />
                      </React.Suspense>
                    </>
                  } />
                  <Route path="/onboarding" element={
                    <React.Suspense fallback={<Loading />}>
                      <Onboarding />
                    </React.Suspense>
                  } />
                  <Route path="/rules" element={
                    <>
                      <Navbar />
                      <React.Suspense fallback={<Loading />}>
                        <RulesPage />
                      </React.Suspense>
                    </>
                  } />
                  <Route path="/community" element={
                    <>
                      <Navbar />
                      <React.Suspense fallback={<Loading />}>
                        <CommunityPage />
                      </React.Suspense>
                    </>
                  } />
                  <Route path="/profile" element={
                    <>
                      <Navbar />
                      <React.Suspense fallback={<Loading />}>
                        <ProfilePage />
                      </React.Suspense>
                    </>
                  } />
                  <Route path="/map" element={
                    <>
                      <Navbar />
                      <React.Suspense fallback={<Loading />}>
                        <GameMap />
                      </React.Suspense>
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
