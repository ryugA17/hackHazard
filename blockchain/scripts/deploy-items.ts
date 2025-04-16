import { ethers } from "hardhat";

async function main() {
  const GameItems = await ethers.getContractFactory("GameItems");
  const gameItems = await GameItems.deploy();
  await gameItems.deployed();

  console.log("GameItems deployed to:", gameItems.address);

  // Verify contract on Monad Explorer
  if (process.env.VERIFY) {
    await hre.run("verify:verify", {
      address: gameItems.address,
      constructorArguments: [],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});