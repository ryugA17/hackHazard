import { useState } from 'react';
import { useAccount } from 'wagmi';
import { nftService } from '../services/nft';

export const Inventory: React.FC<{ items: any[] }> = ({ items }) => {
  const { address } = useAccount();
  const [minting, setMinting] = useState<Record<string, boolean>>({});

  const handleMint = async (item: any) => {
    if (!address) return;
    
    setMinting({ ...minting, [item.id]: true });
    try {
      await nftService.mintInventoryItem(address, {
        name: item.name,
        description: item.description,
        image: item.imageUrl,
        type: item.type,
        level: item.level,
        rarity: item.rarity
      });
      
      // Update UI or show success message
    } catch (error) {
      console.error("Failed to mint:", error);
      // Show error message
    } finally {
      setMinting({ ...minting, [item.id]: false });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
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