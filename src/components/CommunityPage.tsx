import React from 'react';
import './CommunityPage.css';
import Footer from './Footer';

const CommunityPage = () => {
  return (
    <>
      <div className="community-page">
        <div className="community-container">
          <h1 className="community-title">Community</h1>
          
          <div className="community-content">
            <div className="community-section">
              <h2>Welcome to the Pikadex Community!</h2>
              <p>Connect with fellow players, participate in events, and share your experiences.</p>
              <p>This page is ready for your content. You can add community features, event listings, forums, and more.</p>
            </div>
            
            <div className="community-grid">
              <div className="community-card">
                <div className="card-icon">
                  <span role="img" aria-label="Trophy">🏆</span>
                </div>
                <h3>Tournaments</h3>
                <p>Join competitive gameplay with other members of the community. Weekly and monthly tournaments with prizes!</p>
                <button className="community-btn">Learn More</button>
              </div>
              
              <div className="community-card">
                <div className="card-icon">
                  <span role="img" aria-label="Forum">💬</span>
                </div>
                <h3>Forums</h3>
                <p>Discuss strategies, share tips, and connect with other players in our community forums.</p>
                <button className="community-btn">Visit Forums</button>
              </div>
              
              <div className="community-card">
                <div className="card-icon">
                  <span role="img" aria-label="Calendar">📅</span>
                </div>
                <h3>Events</h3>
                <p>Stay up to date with the latest tournaments, workshops, and community gatherings.</p>
                <button className="community-btn">See Calendar</button>
              </div>
              
              <div className="community-card">
                <div className="card-icon">
                  <span role="img" aria-label="Discord">🎮</span>
                </div>
                <h3>Discord</h3>
                <p>Join our Discord server to chat in real-time with other players and get instant updates.</p>
                <button className="community-btn">Join Discord</button>
              </div>
            </div>
            
            <div className="community-section">
              <h2>Featured Community Members</h2>
              <p>This section can showcase active community members, high-ranking players, or other highlights.</p>
              <div className="featured-members">
                {/* Placeholder for featured members */}
                <p>Ready for you to add content!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CommunityPage; 