import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.PRIVATE_KEY && process.env.NODE_ENV !== 'test') {
  console.warn("Warning: PRIVATE_KEY not found in .env file");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      gasPrice: "auto"
    }
  },
  etherscan: {
    apiKey: {
      monadTestnet: "any" // Monad doesn't require an API key for verification
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet.explorer.monad.xyz/api",
          browserURL: "https://testnet.explorer.monad.xyz"
        }
      }
    ]
  }
};

export default config;
