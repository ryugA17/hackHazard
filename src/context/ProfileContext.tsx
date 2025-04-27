import React from 'react';
import { getFirebaseAuth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import defaultAvatar from '../assets/random component.gif';

// Define the profile data structure
export interface ProfileData {
  name: string;
  username: string;
  location: string;
  work: string;
  education: string;
  bio: string;
  gamePlan: string | null; // Type of gamer from onboarding
  level: number;
  avatarId: number | null; // ID of selected avatar from onboarding
  joinDate: string; // When the user joined
  social: {
    github: string;
    instagram: string;
    twitch: string;
    tiktok: string;
    youtube: string;
    twitter: string;
    linkedin: string;
  }
}

interface ProfileContextType {
  profileData: ProfileData;
  updateProfileData: (data: Partial<ProfileData>) => void;
  loading: boolean;
  profilePic: string;
  getAvatarById: (id: number | null) => string;
}

// Create the context
const ProfileContext = React.createContext<ProfileContextType | undefined>(undefined);

// Create the provider component
interface ProfileProviderProps {
  children: React.ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  
  // Default profile data
  const defaultUsername = "Hardik";
  const defaultHandle = "hardikiltop80299";
  const currentDate = new Date();
  const defaultJoinDate = `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

  // Initialize profile data from localStorage or default values
  const [profileData, setProfileData] = React.useState<ProfileData>(() => {
    const savedProfile = localStorage.getItem('profileData');
    if (savedProfile) {
      return JSON.parse(savedProfile);
    }
    return {
      name: "",
      username: "",
      location: "",
      work: "",
      education: "",
      bio: "",
      gamePlan: null,
      level: 1,
      avatarId: null,
      joinDate: defaultJoinDate,
      social: {
        github: "",
        instagram: "",
        twitch: "",
        tiktok: "",
        youtube: "",
        twitter: "",
        linkedin: ""
      }
    };
  });

  // Function to get avatar image URL from ID
  const getAvatarById = (id: number | null): string => {
    if (!id) return defaultAvatar;
    
    try {
      // This would typically be a mapping of IDs to avatar image paths
      // You'll need to adjust this to match your actual avatar paths
      const avatarMap: {[key: number]: string} = {
        1: require('../assets/avatars/boy.gif'),
        2: require('../assets/avatars/girl.gif'),
        3: require('../assets/avatars/foxboy.gif'),
        4: require('../assets/avatars/foxgirl.gif'),
        5: require('../assets/avatars/robot.gif')
      };
      return avatarMap[id] || defaultAvatar;
    } catch (e) {
      console.error("Error loading avatar:", e);
      return defaultAvatar;
    }
  };

  // Update profile data
  const updateProfileData = (data: Partial<ProfileData>) => {
    setProfileData((prevData: ProfileData) => {
      const newData = { ...prevData, ...data };
      localStorage.setItem('profileData', JSON.stringify(newData));
      return newData;
    });
  };

  // Get profile pic - use avatar from onboarding if available, otherwise from Google
  const profilePic = profileData.avatarId 
    ? getAvatarById(profileData.avatarId)
    : (user?.photoURL || defaultAvatar);

  // Check for onboarding data saved in localStorage
  React.useEffect(() => {
    const savedGamePlan = localStorage.getItem('userGamePlan');
    if (savedGamePlan && profileData.gamePlan === null) {
      updateProfileData({ gamePlan: savedGamePlan });
    }
  }, []);

  // Listen for auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // Initialize profile data when user is loaded if not already set
      if (currentUser && (!profileData.name || !profileData.username)) {
        const updatedProfile = {
          ...profileData,
          name: profileData.name || currentUser.displayName || defaultUsername,
          username: profileData.username || (currentUser.email ? currentUser.email.split('@')[0] : defaultHandle)
        };
        updateProfileData(updatedProfile);
      }
    });
    
    return () => unsubscribe();
  }, [profileData, defaultUsername, defaultHandle]);

  return (
    <ProfileContext.Provider value={{ 
      profileData, 
      updateProfileData, 
      loading, 
      profilePic, 
      getAvatarById 
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

// Create a custom hook to use the profile context
export const useProfile = () => {
  const context = React.useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}; 