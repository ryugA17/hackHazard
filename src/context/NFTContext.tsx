import React from 'react';
import { useProfile } from './ProfileContext';

// Import NFT assets
import growlingDinosaur from '../assets/growling-dinosaur.gif';
import minecraftSword from '../assets/minecraft-sword.gif';
import witchWizard from '../assets/witch-wizard.gif';
import dragonAmulet from '../assets/lockgrin-8bits.gif';
import ancientScroll from '../assets/alcohol-poison.gif';
import goldenPotion from '../assets/potion.gif';

// Define NFT structure
export interface NFTItem {
  id: string;
  name: string;
  image: string;
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythical';
  acquired: boolean;
  acquiredDate?: string;
  condition: string;
}

interface NFTContextType {
  nfts: NFTItem[];
  userNFTs: NFTItem[];
  checkAndAwardNFTs: () => void;
}

// Create the context
const NFTContext = React.createContext<NFTContextType | undefined>(undefined);

// Create the provider component
interface NFTProviderProps {
  children: React.ReactNode;
}

export function NFTProvider({ children }: NFTProviderProps) {
  const { profileData } = useProfile();
  
  // Define all available NFTs with their acquisition conditions
  const [nfts, setNfts] = React.useState<NFTItem[]>([
    {
      id: "nft-001",
      name: "Growling Dinosaur",
      image: growlingDinosaur,
      description: "A ferocious dinosaur that appears when you complete your registration. Your first companion in the journey.",
      rarity: "Rare",
      acquired: false,
      condition: "Complete user registration"
    },
    {
      id: "nft-002",
      name: "Minecraft Sword",
      image: minecraftSword,
      description: "A powerful sword that appears after you complete 3 challenges in the game. Cut through any obstacle with ease.",
      rarity: "Epic",
      acquired: false,
      condition: "Complete 3 in-game challenges"
    },
    {
      id: "nft-003",
      name: "Witch Wizard",
      image: witchWizard,
      description: "A mystical wizard that appears when you reach level 5. Grants magical powers to their owner.",
      rarity: "Mythical",
      acquired: false,
      condition: "Reach level 5"
    },
    {
      id: "nft-004",
      name: "Dragon Amulet",
      image: dragonAmulet,
      description: "An ancient amulet with dragon powers. Appears when you refer 2 friends to the platform.",
      rarity: "Legendary",
      acquired: false,
      condition: "Refer 2 friends to the platform"
    },
    {
      id: "nft-005",
      name: "Ancient Scroll",
      image: ancientScroll,
      description: "A scroll containing ancient wisdom. Appears when you participate in a community event.",
      rarity: "Epic",
      acquired: false,
      condition: "Participate in a community event"
    },
    {
      id: "nft-006",
      name: "Golden Potion",
      image: goldenPotion,
      description: "A rare potion that enhances abilities. Appears when you connect your wallet for the first time.",
      rarity: "Rare",
      acquired: false,
      condition: "Connect your wallet for the first time"
    }
  ]);

  // Initialize NFTs from localStorage or from the default values
  React.useEffect(() => {
    const savedNFTs = localStorage.getItem('userNFTs');
    if (savedNFTs) {
      setNfts(JSON.parse(savedNFTs));
    }
  }, []);

  // Save NFTs to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('userNFTs', JSON.stringify(nfts));
  }, [nfts]);

  // Filter NFTs that the user has acquired
  const userNFTs = nfts.filter((nft: NFTItem) => nft.acquired);

  // Function to check and award NFTs based on conditions
  const checkAndAwardNFTs = () => {
    let updatedNFTs = [...nfts];
    const currentDate = new Date().toISOString();

    // Check registration completion (first NFT condition)
    if (profileData.name && profileData.username && !updatedNFTs[0].acquired) {
      updatedNFTs[0] = {
        ...updatedNFTs[0],
        acquired: true,
        acquiredDate: currentDate
      };
    }

    // Check level achievement for Witch Wizard
    if (profileData.level >= 5 && !updatedNFTs[2].acquired) {
      updatedNFTs[2] = {
        ...updatedNFTs[2],
        acquired: true,
        acquiredDate: currentDate
      };
    }

    // Check other conditions (for demo purposes, we'll simulate some conditions)
    // In a real app, these would be tied to actual game events and achievements
    
    // For demonstration:
    // Check if user has a game plan (for Minecraft Sword)
    if (profileData.gamePlan && !updatedNFTs[1].acquired) {
      updatedNFTs[1] = {
        ...updatedNFTs[1],
        acquired: true,
        acquiredDate: currentDate
      };
    }

    // If any NFTs have been updated, save the changes
    if (JSON.stringify(updatedNFTs) !== JSON.stringify(nfts)) {
      setNfts(updatedNFTs);
    }
  };

  // Check for NFT awards when profile data changes
  React.useEffect(() => {
    checkAndAwardNFTs();
  }, [profileData]);

  return (
    <NFTContext.Provider value={{ 
      nfts, 
      userNFTs,
      checkAndAwardNFTs
    }}>
      {children}
    </NFTContext.Provider>
  );
}

// Create a custom hook to use the NFT context
export const useNFTs = () => {
  const context = React.useContext(NFTContext);
  if (context === undefined) {
    throw new Error('useNFTs must be used within an NFTProvider');
  }
  return context;
}; 