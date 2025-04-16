"use client";

import React from "react";
import type { NextPage } from "next";
import { useBlockNumber } from "wagmi";

const Home: NextPage = () => {
  const [mintCount, setMintCount] = React.useState(0);
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const handleMint = async () => {
    try {
      await fetch("/api/mint", {
        method: "POST",
      });
      setMintCount((prev: number) => prev + 1);
    } catch (error) {
      console.error("Error minting:", error);
    }
  };

  return (
    <div>
      {/* Your JSX here */}
    </div>
  );
};

export default Home;
