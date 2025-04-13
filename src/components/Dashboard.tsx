import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import Navbar from './Navbar';
import Footer from './Footer';
import userAvatar from '../assets/pixel-trainer.png';
import computerIcon from '../assets/computer-icon.png';
import rocketIcon from '../assets/rocket-icon.png';
import eggIcon from '../assets/egg-icon.png';
import codeIcon from '../assets/code-icon.png';

const Dashboard = () => {
  const username = "hardikiltop80299";
  
  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="dashboard-container">
          {/* Greeting section */}
          <div className="greeting-section">
            <div className="computer-icon">
              <img src={computerIcon} alt="Computer" />
            </div>
            <div className="greeting-message">
              <p>Hi @{username}! We've been waiting for ya.</p>
            </div>
          </div>

          {/* Main content area */}
          <div className="dashboard-main">
            <div className="dashboard-welcome">
              <div className="pixel-trainer">
                <img src={userAvatar} alt="Pixel Trainer" />
              </div>
              <h1 className="welcome-title">Welcome to Codédex!</h1>
              <p className="welcome-subtitle">Your coding journey awaits—but first let's find something to learn.</p>
              <button className="get-started-btn">Get Started</button>
            </div>
          </div>

          {/* User profile panel */}
          <div className="profile-panel">
            <div className="profile-header">
              <img src={userAvatar} alt="User Avatar" className="profile-avatar" />
              <div className="profile-info">
                <h2>{username}</h2>
                <p>Level 1</p>
              </div>
            </div>
            
            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-icon xp-icon">8</div>
                <div className="stat-details">
                  <p>Total XP</p>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon rank-icon">Bronze</div>
                <div className="stat-details">
                  <p>Rank</p>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon badges-icon">8</div>
                <div className="stat-details">
                  <p>Badges</p>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon streak-icon">2</div>
                <div className="stat-details">
                  <p>Day streak</p>
                </div>
              </div>
            </div>
            
            <button className="view-profile-btn">View profile</button>
          </div>

          {/* Events panel */}
          <div className="events-panel">
            <h2>Upcoming Events</h2>
            
            <div className="event-item">
              <div className="event-date">
                <span className="event-month">APR</span>
                <span className="event-day">16</span>
              </div>
              <div className="event-details">
                <h3>Smash Karts Tournament</h3>
                <p>Wed Apr 16th @ 3:00pm ET</p>
              </div>
            </div>
            
            <div className="event-item">
              <div className="event-date">
                <span className="event-month">APR</span>
                <span className="event-day">23</span>
              </div>
              <div className="event-details">
                <h3>Node.js Workshop</h3>
                <p>Wed Apr 23rd @ 3:00pm ET</p>
              </div>
            </div>
            
            <div className="event-item">
              <div className="event-date">
                <span className="event-month">MAY</span>
                <span className="event-day">7</span>
              </div>
              <div className="event-details">
                <h3>Resume Review Workshop</h3>
                <p>Wed May 7th @ 3:00pm ET</p>
              </div>
            </div>
          </div>

          {/* Explore more section */}
          <h2 className="explore-title">Explore more</h2>
          
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <img src={userAvatar} alt="Challenge" />
              </div>
              <div className="feature-content">
                <h3>Challenge Packs</h3>
                <p>Practice what you learned with bite-sized code challenges.</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <img src={rocketIcon} alt="Rocket" />
              </div>
              <div className="feature-content">
                <h3>Project Tutorials</h3>
                <p>Explore fun, step-by-step projects from beginner to advanced.</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <img src={eggIcon} alt="Egg" />
              </div>
              <div className="feature-content">
                <h3>#30NitesOfCode</h3>
                <p>Commit to 30 days of learning and building—while raising a virtual pet!</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <img src={codeIcon} alt="Code" />
              </div>
              <div className="feature-content">
                <h3>Builds</h3>
                <p>Create and share code snippets and projects directly in the browser.</p>
              </div>
            </div>
          </div>

          {/* New tutorials section */}
          <div className="tutorials-header">
            <h2 className="tutorials-title">New project tutorials</h2>
            <Link to="/tutorials" className="see-all-link">See all</Link>
          </div>
          
          <div className="tutorials-grid">
            <div className="tutorial-card">
              <div className="tutorial-image">
                {/* Placeholder for tutorial image */}
                <div className="image-placeholder" style={{backgroundColor: "lightblue"}}></div>
              </div>
              <div className="tutorial-info">
                <span className="tutorial-label">TUTORIAL</span>
                <h3>Animate Images with CSS keyframes</h3>
                <div className="tutorial-tags">
                  <span className="tag level-tag">BEGINNER</span>
                  <span className="tag language-tag">HTML</span>
                </div>
              </div>
            </div>
            
            <div className="tutorial-card">
              <div className="tutorial-image">
                {/* Placeholder for tutorial image */}
                <div className="image-placeholder" style={{backgroundColor: "lightgreen"}}></div>
              </div>
              <div className="tutorial-info">
                <span className="tutorial-label">TUTORIAL</span>
                <h3>Analyze U.S. Census Data with SciPy</h3>
                <div className="tutorial-tags">
                  <span className="tag level-tag">INTERMEDIATE</span>
                  <span className="tag language-tag">PYTHON</span>
                </div>
              </div>
            </div>
            
            <div className="tutorial-card">
              <div className="tutorial-image">
                {/* Placeholder for tutorial image */}
                <div className="image-placeholder" style={{backgroundColor: "purple"}}></div>
              </div>
              <div className="tutorial-info">
                <span className="tutorial-label">TUTORIAL</span>
                <h3>Build a Chat Game with p5.js</h3>
                <div className="tutorial-tags">
                  <span className="tag level-tag">INTERMEDIATE</span>
                  <span className="tag language-tag">JAVASCRIPT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard; 