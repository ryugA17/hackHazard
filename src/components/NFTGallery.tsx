import React from 'react';
import { useAccount } from 'wagmi';
import { useNFTs } from '../context/NFTContext';
import './NFTGallery.css';

interface NFTGalleryProps {
  preview?: boolean;
  maxDisplay?: number;
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({ preview = false, maxDisplay = Infinity }) => {
  const { address } = useAccount();
  const { nfts, userNFTs } = useNFTs();

  if (!address) return (
    <div className="wallet-not-connected">
      <h2>Wallet Not Connected</h2>
      <p>
        Please connect your wallet to view your NFTs
      </p>
    </div>
  );

  const displayNFTs = preview ? nfts.slice(0, maxDisplay) : nfts;

  return (
    <div className="nft-gallery">
      <div className="nft-stats">
        <div className="nft-stat-item">
          <span className="nft-stat-label">Total NFTs:</span>
          <span className="nft-stat-value">{nfts.length}</span>
        </div>
        <div className="nft-stat-item">
          <span className="nft-stat-label">Acquired:</span>
          <span className="nft-stat-value">{userNFTs.length}</span>
        </div>
      </div>

      <div className="nft-gallery-grid">
        {displayNFTs.map((nft: any) => (
          <div key={nft.id} className={`nft-gallery-card ${nft.acquired ? 'acquired' : 'locked'}`}>
            <div className="nft-gallery-image-container">
              {!nft.acquired && <div className="nft-locked-overlay">
                <span className="lock-icon">🔒</span>
              </div>}
              <img 
                src={nft.image} 
                alt={nft.name} 
                className="nft-gallery-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/400x400/228b22/ffffff?text=${nft.name.replace(/\s+/g, '+')}`;
                }}
              />
            </div>
            <div className="nft-gallery-content">
              <h2 className="nft-gallery-title">{nft.name}</h2>
              <p className="nft-gallery-description">{nft.description}</p>
              <div className="nft-gallery-details">
                <div className="nft-gallery-rarity">
                  <span className="nft-detail-label">Rarity:</span>
                  <span className={`nft-rarity-badge ${nft.rarity.toLowerCase()}`}>{nft.rarity}</span>
                </div>
                <div className="nft-gallery-condition">
                  <span className="nft-detail-label">How to acquire:</span>
                  <span className="nft-condition-text">{nft.condition}</span>
                </div>
                {nft.acquired && nft.acquiredDate && (
                  <div className="nft-gallery-acquired-date">
                    <span className="nft-detail-label">Acquired on:</span>
                    <span className="nft-acquired-date-text">
                      {new Date(nft.acquiredDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {nfts.length === 0 && (
        <div className="empty-collection-message">
          <h2>No NFTs Available</h2>
          <p>
            There are currently no NFTs available in this collection.
          </p>
        </div>
      )}
    </div>
  );
};
