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
    <div className="wallet-not-connected">
      <h2>Wallet Not Connected</h2>
      <p>
        Please connect your wallet to view your NFTs
      </p>
    </div>
  );

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <p className="error-title">Error loading NFTs</p>
      <p className="error-message">{error}</p>
    </div>
  );

  if (nfts.length === 0) return (
    <div className="empty-collection">
      <h2>No NFTs Found</h2>
      <p>
        You don't have any NFTs in your collection yet. 
        Visit the inventory to mint some!
      </p>
    </div>
  );

  return (
    <div className="nft-grid">
      {nfts.map((nft: NFTMetadata) => (
        <div key={nft.id} className="nft-card">
          <figure className="nft-image-container">
            <img 
              src={nft.image} 
              alt={nft.name} 
              className="nft-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'placeholder.png';
              }}
            />
          </figure>
          <div className="nft-card-content">
            <h2 className="nft-card-title">#{nft.id} - {nft.name}</h2>
            <p className="nft-card-description">{nft.description}</p>
            <div className="nft-attributes">
              <h3 className="nft-attributes-title">Attributes:</h3>
              <div className="nft-attributes-grid">
                {nft.attributes.map((attr: NFTAttribute, index: number) => (
                  <div key={index} className="nft-attribute">
                    <div className="nft-attribute-name">{attr.trait_type}</div>
                    <div className="nft-attribute-value">{attr.value}</div>
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
