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
import { useProfile } from '../context/ProfileContext';

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
  const { updateProfileData } = useProfile();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedAvatar, setSelectedAvatar] = React.useState<number | null>(null);
  const [username, setUsername] = React.useState('');
  const [currentAvatarIndex, setCurrentAvatarIndex] = React.useState(0);
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Effect to automatically select the current avatar
  React.useEffect(() => {
    if (currentAvatarIndex >= 0 && currentAvatarIndex < avatarOptions.length) {
      setSelectedAvatar(avatarOptions[currentAvatarIndex].id);
    }
  }, [currentAvatarIndex]);

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
        // Update Firebase profile
        await updateProfile(currentUser, {
          displayName: username
        });
      }
      
      // Get current date for join date
      const currentDate = new Date();
      const joinDate = `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
      
      // Update ProfileContext with onboarding data
      updateProfileData({
        name: username,
        username: username.toLowerCase().replace(/\s+/g, '_'),
        avatarId: selectedAvatar,
        gamePlan: selectedPlan,
        joinDate: joinDate
      });
      
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

  // Navigate to previous avatar
  const handlePrevAvatar = () => {
    setCurrentAvatarIndex((prevIndex: number) => {
      const newIndex = prevIndex === 0 ? avatarOptions.length - 1 : prevIndex - 1;
      return newIndex;
    });
  };

  // Navigate to next avatar
  const handleNextAvatar = () => {
    setCurrentAvatarIndex((prevIndex: number) => {
      const newIndex = prevIndex === avatarOptions.length - 1 ? 0 : prevIndex + 1;
      return newIndex;
    });
  };

  // Handle username change
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  // Handle plan selection
  const handleSelectPlan = (plan: string) => {
    setSelectedPlan(plan);
  };

  // Handle skip button
  const handleSkip = () => {
    navigate('/dashboard');
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
            <button className="avatar-nav prev" onClick={handlePrevAvatar}>&lt;</button>
            
            <div className="avatar-options">
              <div className="avatar-platform"></div>
              
              {avatarOptions.map((avatar, index) => (
                <div 
                  key={avatar.id} 
                  className={`avatar-option ${currentAvatarIndex === index ? 'active' : ''} ${selectedAvatar === avatar.id ? 'selected' : ''}`}
                >
                  <img src={avatar.src} alt={avatar.alt} />
                </div>
              ))}
            </div>
            
            <button className="avatar-nav next" onClick={handleNextAvatar}>&gt;</button>
          </div>
          
          <button 
            className="continue-button" 
            onClick={handleContinue}
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