import React from 'react';
import { auth } from '../firebase';
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
  updateProfileData: (data: ProfileData) => void;
  loading: boolean;
  profilePic: string;
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

  // Update profile data
  const updateProfileData = (data: ProfileData) => {
    setProfileData(data);
    localStorage.setItem('profileData', JSON.stringify(data));
  };

  // Get profile pic
  const profilePic = user?.photoURL || defaultAvatar;

  // Listen for auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
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
    <ProfileContext.Provider value={{ profileData, updateProfileData, loading, profilePic }}>
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