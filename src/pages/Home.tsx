"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useBlockNumber } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const [mintCount, setMintCount] = useState(0);

  // Read total supply from your NFT contract
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "YourNFTContract",
    functionName: "totalSupply",
  });

  // Handle batch minting through relayer
  const handleBatchMint = async () => {
    try {
      await fetch("/api/relayer/batchMint", {
        method: "POST",
      });
      setMintCount(prev => prev + 1);
    } catch (error) {
      console.error("Error minting:", error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10 w-full px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-7xl">
          {/* Left Column - NFT Minting and Stats */}
          <div className="card bg-base-100 shadow-xl h-full">
            <div className="card-body">
              <h2 className="card-title">NFT Batch Minting Relayer</h2>

              <div className="stats shadow mt-4">
                <div className="stat w-[200px]">
                  <div className="stat-title">Current Block</div>
                  <div className="stat-value text-primary">{blockNumber?.toString() || "Loading..."}</div>
                </div>

                <div className="stat">
                  <div className="stat-title">Total NFTs Minted</div>
                  <div className="stat-value">{totalSupply?.toString()}</div>
                </div>
              </div>

              <div className="divider"></div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold">How It Works:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Multiple private keys are used to mint NFTs in parallel</li>
                  <li>Each relayer can mint multiple NFTs in a single transaction</li>
                  <li>Minting requests are queued and processed efficiently</li>
                  <li>Gas costs are optimized through batch processing</li>
                  <li>Perfect for high-demand NFT drops</li>
                </ul>

                <div className="stats shadow">
                  <div className="stat">
                    <div className="stat-title">Your Mint Requests</div>
                    <div className="stat-value">{mintCount}</div>
                    <div className="stat-desc">Batch mints initiated this session</div>
                  </div>
                </div>
              </div>

              <div className="card-actions justify-center mt-6">
                <button className="btn btn-primary btn-lg" onClick={handleBatchMint}>
                  Batch Mint NFTs
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - NFT Display */}
          <div className="card bg-base-100 shadow-xl h-full">
            <div className="card-body">
              <h2 className="card-title">Your NFT Collection</h2>
              {/* Add your NFT grid or gallery component here */}
              <div className="grid grid-cols-2 gap-4">
                {/* NFT display logic */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;