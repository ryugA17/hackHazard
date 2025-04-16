import { ethers } from 'ethers';
import GameItemsABI from '../contracts/GameItems.json';
import { uploadToIPFS } from './ipfs';

export class NFTService {
  private contract: ethers.Contract;
  private provider: ethers.providers.Provider;
  
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider("https://testnet-rpc.monad.xyz");
    this.contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_GAME_ITEMS_ADDRESS!,
      GameItemsABI,
      this.provider
    );
  }

  async mintInventoryItem(
    player: string,
    item: {
      name: string;
      description: string;
      image: string;
      type: string;
      level: number;
      rarity: string;
    }
  ) {
    try {
      // Create metadata
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

      // Upload metadata to IPFS
      const tokenURI = await uploadToIPFS(metadata);

      // Mint NFT
      const signer = this.contract.connect(new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider));
      const tx = await signer.mintItem(
        player,
        tokenURI,
        item.type,
        item.level,
        item.rarity
      );

      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error minting NFT:", error);
      throw error;
    }
  }
}

export const nftService = new NFTService();