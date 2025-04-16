import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Get the contract factory
  const GameItems = await ethers.getContractFactory("GameItems", deployer);

  // Deploy the contract
  console.log("Deploying GameItems...");
  const gameItems = await GameItems.deploy();

  console.log("Waiting for deployment...");
  await gameItems.waitForDeployment();

  const address = await gameItems.getAddress();
  console.log(`GameItems deployed to: ${address}`);

  // Store this address in your .env file as NEXT_PUBLIC_GAME_ITEMS_ADDRESS
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
