import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';
import computerIcon from '../assets/bot.gif';
import foxgirlAvatar from '../assets/avatars/foxgirl.gif';
import robotAvatar from '../assets/avatars/robot.gif';
import boyAvatar from '../assets/avatars/boy.gif';
import girlAvatar from '../assets/avatars/girl.gif';
import foxboyAvatar from '../assets/avatars/foxboy.gif';
import { auth } from '../firebase';
import { updateProfile } from 'firebase/auth';

// Avatar options with actual images from assets/avatars
const avatarOptions = [
  { id: 1, src: boyAvatar, alt: 'Boy Character' },
  { id: 2, src: girlAvatar, alt: 'Girl Character' },
  { id: 3, src: foxboyAvatar, alt: 'Fox Boy Character' },
  { id: 4, src: foxgirlAvatar, alt: 'Fox Girl Character' },
  { id: 5, src: robotAvatar, alt: 'Robot Character' }
];

interface OnboardingProps {}

const Onboarding: React.FC<OnboardingProps> = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedAvatar, setSelectedAvatar] = React.useState<number | null>(null);
  const [username, setUsername] = React.useState('');
  const [visibleAvatars, setVisibleAvatars] = React.useState([0, 1, 2]); // Indexes of visible avatars
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Progress percentage calculation
  const getProgressPercentage = () => {
    return ((currentStep - 1) / 4) * 100;
  };

  // Save user data and complete onboarding
  const saveUserData = async () => {
    if (!selectedAvatar || !username || !selectedPlan) return;

    try {
      setIsSubmitting(true);
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Get the selected avatar URL
        const avatarSrc = avatarOptions.find(avatar => avatar.id === selectedAvatar)?.src || '';
        
        // Update Firebase profile
        await updateProfile(currentUser, {
          displayName: username,
          photoURL: avatarSrc
        });
        
        // Save selected plan to localStorage for now
        // In a real app, this would likely be saved to a database
        localStorage.setItem('userGamePlan', selectedPlan);
      }
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving user data:', error);
      alert('There was an error saving your preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle next button click
  const handleContinue = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step completed, save data and redirect
      saveUserData();
    }
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatarId: number) => {
    setSelectedAvatar(avatarId);
  };

  // Handle navigation through avatars
  const handlePrevAvatars = () => {
    setVisibleAvatars((current: number[]) => {
      const firstVisible = current[0];
      if (firstVisible === 0) {
        // Wrap around to the end
        const lastIdx = avatarOptions.length - 1;
        return [lastIdx - 2, lastIdx - 1, lastIdx];
      }
      return [firstVisible - 1, ...current.slice(0, 2)];
    });
  };

  const handleNextAvatars = () => {
    setVisibleAvatars((current: number[]) => {
      const lastVisible = current[2];
      if (lastVisible === avatarOptions.length - 1) {
        // Wrap around to the beginning
        return [0, 1, 2];
      }
      return [...current.slice(1), lastVisible + 1];
    });
  };

  // Handle username change
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  // Handle skip button
  const handleSkip = () => {
    navigate('/dashboard');
  };

  // Handle plan selection
  const handleSelectPlan = (plan: string) => {
    setSelectedPlan(plan);
  };

  return (
    <div className="onboarding-container">
      {/* Progress bar */}
      <div className="onboarding-progress">
        <button className="back-button" onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}>
          &lt;
        </button>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }}></div>
        </div>
        <button className="skip-button" onClick={handleSkip}>Skip</button>
      </div>
      
      {/* Step 1: Welcome */}
      {currentStep === 1 && (
        <div className="onboarding-step">
          <div className="computer-icon">
            <img src={computerIcon} alt="Computer" />
          </div>
          <div className="message-bubble">
            <p>Hey there! I'm your personal gaming companion!</p>
          </div>
          <button className="continue-button" onClick={handleContinue}>Continue</button>
        </div>
      )}
      
      {/* Step 2: Choose avatar */}
      {currentStep === 2 && (
        <div className="onboarding-step">
          <div className="computer-icon">
            <img src={computerIcon} alt="Computer" />
          </div>
          <div className="message-bubble">
            <p>First, let's choose your look. You can switch this up later, too.</p>
          </div>
          
          <div className="avatar-selection">
            <button className="avatar-nav prev" onClick={handlePrevAvatars}>&lt;</button>
            <div className="avatar-options">
              {visibleAvatars.map((index: number) => {
                const avatar = avatarOptions[index];
                return (
                  <div 
                    key={avatar.id} 
                    className={`avatar-option ${selectedAvatar === avatar.id ? 'selected' : ''}`}
                    onClick={() => handleAvatarSelect(avatar.id)}
                  >
                    <img src={avatar.src} alt={avatar.alt} />
                  </div>
                );
              })}
            </div>
            <button className="avatar-nav next" onClick={handleNextAvatars}>&gt;</button>
          </div>
          
          <button 
            className="continue-button" 
            onClick={handleContinue}
            disabled={!selectedAvatar}
          >
            Continue
          </button>
        </div>
      )}
      
      {/* Step 3: Choose username */}
      {currentStep === 3 && (
        <div className="onboarding-step">
          <div className="computer-icon">
            <img src={computerIcon} alt="Computer" />
          </div>
          <div className="message-bubble">
            <p>Looking good! What should I call you?</p>
          </div>
          
          <div className="username-input-container">
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={handleUsernameChange}
              className="username-input"
            />
          </div>
          
          <button 
            className="continue-button" 
            onClick={handleContinue}
            disabled={!username.trim()}
          >
            Continue
          </button>
        </div>
      )}
      
      {/* Step 4: Choose a plan */}
      {currentStep === 4 && (
        <div className="onboarding-step">
          <div className="computer-icon">
            <img src={computerIcon} alt="Computer" />
          </div>
          <div className="message-bubble">
            <p>Almost done! Before you start gaming, let's choose a plan to set you up for success.</p>
          </div>
          
          <div className="plan-options">
            <div 
              className={`plan-option ${selectedPlan === 'casual' ? 'selected' : ''}`}
              onClick={() => handleSelectPlan('casual')}
            >
              <h3>Casual Gamer</h3>
              <ul>
                <li>Play at your own pace</li>
                <li>Access to basic games</li>
                <li>Weekly challenges</li>
              </ul>
              <button className="select-plan-btn">Select</button>
            </div>
            
            <div 
              className={`plan-option featured ${selectedPlan === 'pro' ? 'selected' : ''}`}
              onClick={() => handleSelectPlan('pro')}
            >
              <h3>Pro Gamer</h3>
              <ul>
                <li>Structured learning path</li>
                <li>Access to all games</li>
                <li>Daily challenges</li>
                <li>Exclusive tournaments</li>
              </ul>
              <button className="select-plan-btn">Select</button>
            </div>
            
            <div 
              className={`plan-option ${selectedPlan === 'team' ? 'selected' : ''}`}
              onClick={() => handleSelectPlan('team')}
            >
              <h3>Team Player</h3>
              <ul>
                <li>Multiplayer focus</li>
                <li>Team challenges</li>
                <li>Community events</li>
              </ul>
              <button className="select-plan-btn">Select</button>
            </div>
          </div>
          
          <button 
            className="continue-button" 
            onClick={handleContinue}
            disabled={!selectedPlan || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Onboarding; 