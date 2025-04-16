import React from 'react';
import { useAccount } from 'wagmi';
import { nftService } from '../services/nft';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  type: string;
  level: number;
  rarity: string;
}

interface InventoryProps {
  items: InventoryItem[];
}

export const Inventory: React.FC<InventoryProps> = ({ items }: InventoryProps) => {
  const { address } = useAccount();
  const [minting, setMinting] = React.useState<Record<string, boolean>>({});

  const handleMint = async (item: InventoryItem) => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }
    
    setMinting({ ...minting, [item.id]: true });
    try {
      const txHash = await nftService.mintInventoryItem({
        name: item.name,
        description: item.description,
        image: item.imageUrl,
        type: item.type,
        level: item.level,
        rarity: item.rarity
      });
      
      alert(`Successfully minted NFT! Transaction: ${txHash}`);
      // Optionally refresh the NFT gallery
      window.location.href = '/nfts';
    } catch (error) {
      console.error("Failed to mint:", error);
      alert("Failed to mint NFT. Please check console for details.");
    } finally {
      setMinting({ ...minting, [item.id]: false });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item: InventoryItem) => (
        <div key={item.id} className="card bg-base-100 shadow-xl">
          <figure><img src={item.imageUrl} alt={item.name} /></figure>
          <div className="card-body">
            <h2 className="card-title">{item.name}</h2>
            <p>{item.description}</p>
            <div className="card-actions justify-end">
              <button 
                className={`btn btn-primary ${minting[item.id] ? 'loading' : ''}`}
                onClick={() => handleMint(item)}
                disabled={minting[item.id]}
              >
                {minting[item.id] ? 'Minting...' : 'Mint as NFT'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
