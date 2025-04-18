import React from 'react';
import { nftService } from '../services/nftService';

interface RewardItem {
  id: string;
  achievement: string;
  transactionHash: string;
}

interface DungeonMasterContextType {
  rewards: RewardItem[];
  issueReward: (achievement: string) => Promise<void>;
}

interface DungeonMasterProviderProps {
  children: React.ReactNode;
}

export const DungeonMasterContext = React.createContext<DungeonMasterContextType>({
  rewards: [],
  issueReward: async () => {},
});

export const DungeonMasterProvider = ({ children }: DungeonMasterProviderProps) => {
  const [rewards, setRewards] = React.useState<RewardItem[]>([]);
  
  const issueReward = async (achievement: string) => {
    const transactionHash = await nftService.mintInventoryItem({ achievement });
    setRewards((prev: RewardItem[]) => [...prev, { 
      id: Date.now().toString(),
      achievement,
      transactionHash
    }]);
  };

  return (
    <DungeonMasterContext.Provider value={{ rewards, issueReward }}>
      {children}
    </DungeonMasterContext.Provider>
  );
};
