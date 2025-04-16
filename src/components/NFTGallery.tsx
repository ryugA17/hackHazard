import React from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import GameItemsABI from '../contracts/GameItems.json';

interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

interface NFTMetadata {
  id: string;
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
}

interface NFTGalleryProps {
  preview?: boolean;
  maxDisplay?: number;
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({ preview = false, maxDisplay = Infinity }) => {
  const { address } = useAccount();
  const [nfts, setNfts] = React.useState<NFTMetadata[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        // Verify contract address
        const contractAddress = process.env.REACT_APP_GAME_ITEMS_ADDRESS;
        if (!contractAddress) {
          throw new Error("Game Items contract address not configured");
        }
        console.log("Using contract address:", contractAddress);

        // Get provider
        if (!window.ethereum) {
          throw new Error("No ethereum provider found. Please install MetaMask.");
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Create contract instance
        const contract = new ethers.Contract(
          contractAddress,
          GameItemsABI,
          provider
        );

        // Get NFT balance
        const balance = await contract.balanceOf(address);
        console.log("NFT balance:", balance.toString());

        const tokenPromises = [];

        for (let i = 0; i < balance; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(address, i);
          console.log("Fetching token:", tokenId.toString());
          const uri = await contract.tokenURI(tokenId);
          console.log("Token URI:", uri);
          
          tokenPromises.push(
            fetch(uri)
              .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
              })
              .then(metadata => ({
                id: tokenId.toString(),
                ...metadata
              }))
              .catch(err => {
                console.error(`Error fetching metadata for token ${tokenId}:`, err);
                return null;
              })
          );
        }

        const nftMetadata = (await Promise.all(tokenPromises)).filter(Boolean);
        setNfts(nftMetadata);
      } catch (error) {
        console.error('Detailed error fetching NFTs:', error);
        let errorMessage = "Failed to load NFTs. Please try again later.";
        
        if (error instanceof Error) {
          if (error.message.includes("contract address")) {
            errorMessage = "NFT contract not properly configured. Please contact support.";
          } else if (error.message.includes("ethereum provider")) {
            errorMessage = "Please install MetaMask to view your NFTs.";
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [address]);

  if (!address) return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
      <p className="text-gray-600 text-center mb-4">
        Please connect your wallet using the button above to view your NFTs
      </p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <p className="font-medium">Error loading NFTs</p>
      <p className="text-sm">{error}</p>
    </div>
  );

  if (nfts.length === 0) return (
    <div className="text-center p-8 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-semibold mb-2">No NFTs Found</h2>
      <p className="text-gray-600">
        You don't have any NFTs in your collection yet. 
        Visit the inventory to mint some!
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {nfts.map((nft: NFTMetadata) => (
        <div key={nft.id} className="card bg-base-100 shadow-xl">
          <figure>
            <img 
              src={nft.image} 
              alt={nft.name} 
              className="w-full h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'placeholder.png';
              }}
            />
          </figure>
          <div className="card-body">
            <h2 className="card-title">#{nft.id} - {nft.name}</h2>
            <p>{nft.description}</p>
            <div className="mt-4">
              <h3 className="font-bold mb-2">Attributes:</h3>
              <div className="grid grid-cols-2 gap-2">
                {nft.attributes.map((attr: NFTAttribute, index: number) => (
                  <div key={index} className="bg-base-200 p-2 rounded">
                    <div className="text-sm font-semibold">{attr.trait_type}</div>
                    <div>{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
