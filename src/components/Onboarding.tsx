import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';
import computerIcon from '../assets/bot.gif';
import foxgirlAvatar from '../assets/avatars/foxgirl.gif';
import robotAvatar from '../assets/avatars/robot.gif';
import boyAvatar from '../assets/avatars/boy.gif';
import girlAvatar from '../assets/avatars/girl.gif';
import foxboyAvatar from '../assets/avatars/foxboy.gif';
import { getFirebaseAuth } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { useProfile } from '../context/ProfileContext';

// Import background music
// @ts-ignore -- Ignoring TS error for audio file import
import backgroundMusic from '../assets/aizentheme.mp3';

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
  
  // Music state
  const [isMusicPlaying, setIsMusicPlaying] = React.useState(false);
  const [isMusicMuted, setIsMusicMuted] = React.useState(false);
  const [showMusicError, setShowMusicError] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

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

  // Play background music function
  const playMusic = React.useCallback(() => {
    if (!audioRef.current) return;
    
    // Make sure the audio is loaded
    if (audioRef.current.readyState < 2) {
      // If audio is not loaded yet, load it first
      audioRef.current.load();
      // Add an event listener to play when loaded
      const onCanPlay = () => {
        playMusic();
        audioRef.current?.removeEventListener('canplaythrough', onCanPlay);
      };
      audioRef.current.addEventListener('canplaythrough', onCanPlay);
      return;
    }
    
    // Check if audio context is suspended (browser autoplay policy)
    const playPromise = audioRef.current.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Music started playing");
          setIsMusicPlaying(true);
          setShowMusicError(false);
        })
        .catch((error: Error) => {
          console.error("Music playback failed:", error);
          setShowMusicError(true);
          // Most browsers require user interaction before audio can play
        });
    }
  }, []);
  
  // Toggle music play/pause
  const toggleMusic = React.useCallback((): void => {
    if (!audioRef.current) return;
    
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      playMusic();
    }
  }, [isMusicPlaying, playMusic]);
  
  // Toggle music mute state
  const toggleMute = React.useCallback((): void => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMusicMuted(!isMusicMuted);
      
      // If currently not playing and unmuting, try to play
      if (!isMusicPlaying && isMusicMuted) {
        playMusic();
      }
    }
  }, [isMusicMuted, isMusicPlaying, playMusic]);

  // Try to play music when component mounts
  React.useEffect(() => {
    // Attempt to play audio after component mounts
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.volume = 0.5; // Set volume to 50%
        playMusic();
      }
    }, 1000);
    
    // Clean up function to pause music when component unmounts
    return () => {
      if (audioRef.current && isMusicPlaying) {
        audioRef.current.pause();
      }
    };
  }, [playMusic, isMusicPlaying]);
  
  // Handle audio event listeners
  React.useEffect(() => {
    const audioElement = audioRef.current;
    
    if (audioElement) {
      // Set up audio properties
      audioElement.volume = 0.5;
      
      // Add event listeners
      const handleCanPlay = () => {
        console.log("Audio can now be played");
      };
      
      const handleError = (e: Event) => {
        console.error("Audio error:", e);
        setShowMusicError(true);
      };
      
      audioElement.addEventListener('canplaythrough', handleCanPlay);
      audioElement.addEventListener('error', handleError);
      
      // Clean up
      return () => {
        audioElement.removeEventListener('canplaythrough', handleCanPlay);
        audioElement.removeEventListener('error', handleError);
      };
    }
  }, []);

  // Save user data and complete onboarding
  const saveUserData = async () => {
    if (!selectedAvatar || !username || !selectedPlan) return;

    try {
      setIsSubmitting(true);
      const currentUser = getFirebaseAuth().currentUser;
      
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
        <div className="right-buttons">
          {/* Music controls */}
          <button 
            className="music-button" 
            onClick={toggleMusic}
            title={isMusicPlaying ? "Pause Music" : "Play Music"}
          >
            {isMusicPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button 
            className="music-button" 
            onClick={toggleMute}
            title={isMusicMuted ? "Unmute" : "Mute"}
            disabled={!isMusicPlaying}
          >
            {isMusicMuted ? '🔇' : '🔊'}
          </button>
          
          <button className="skip-button" onClick={handleSkip}>Skip</button>
        </div>
      </div>
      
      {/* Music error message */}
      {showMusicError && (
        <div className="music-error-message">
          Click the ▶️ button to play background music
        </div>
      )}
      
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
                <li>Access to all premium games</li>
                <li>Daily challenges & rewards</li>
                <li>Performance analytics</li>
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
                <li>Group leaderboards</li>
              </ul>
              <button className="select-plan-btn">Select</button>
            </div>
          </div>
          
          <button 
            className="continue-button" 
            onClick={handleContinue}
            disabled={!selectedPlan || isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Let\'s Begin!'}
          </button>
        </div>
      )}
      
      {/* Audio element for background music */}
      <audio 
        ref={audioRef}
        src={backgroundMusic}
        loop
        preload="auto"
        crossOrigin="anonymous"
        playsInline
      />
    </div>
  );
};

export default Onboarding; 