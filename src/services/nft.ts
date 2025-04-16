import { ethers } from 'ethers';
import GameItemsABI from '../contracts/GameItems.json';

interface MintItemParams {
  name: string;
  description: string;
  image: string;
  type: string;
  level: number;
  rarity: string;
}

type GameItemsContract = ethers.Contract & {
  mintItem(player: string, uri: string): Promise<{
    wait(): Promise<ethers.ContractTransactionReceipt>;
    hash: string;
  }>;
};

export class NFTService {
  private contract: GameItemsContract;
  private provider: ethers.BrowserProvider;
  
  constructor() {
    if (!window.ethereum) {
      throw new Error("No ethereum provider found. Please install MetaMask.");
    }
    
    const contractAddress = process.env.REACT_APP_GAME_ITEMS_ADDRESS;
    if (!contractAddress) {
      throw new Error("Game Items contract address not configured");
    }
    
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.contract = new ethers.Contract(
      contractAddress,
      GameItemsABI,
      this.provider
    ) as GameItemsContract;

    console.log("NFTService initialized with contract:", contractAddress);
  }

  async mintInventoryItem(item: MintItemParams): Promise<string> {
    try {
      const metadata = {
        name: item.name,
        description: item.description,
        image: item.image,
        attributes: [
          { trait_type: "Type", value: item.type },
          { trait_type: "Level", value: item.level },
          { trait_type: "Rarity", value: item.rarity }
        ]
      };

      const metadataUri = await this.uploadMetadata(metadata);
      const signer = await this.provider.getSigner();
      const connectedContract = this.contract.connect(signer) as GameItemsContract;
      
      const tx = await connectedContract.mintItem(await signer.getAddress(), metadataUri);
      await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error("Error in mintInventoryItem:", error);
      throw error;
    }
  }

  private async uploadMetadata(metadata: any): Promise<string> {
    // You need to implement metadata storage, typically using IPFS
    // Example using NFT.Storage or Pinata:
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });
      
      const { uri } = await response.json();
      return uri;
    } catch (error) {
      console.error("Error uploading metadata:", error);
      throw error;
    }
  }
}

export const nftService = new NFTService();
