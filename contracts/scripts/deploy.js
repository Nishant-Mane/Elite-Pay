const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // The operator is the backend wallet — set this to your DEPLOYER_PRIVATE_KEY's address
  const operatorAddress = deployer.address;

  const MilestoneRewards = await ethers.getContractFactory("MilestoneRewards");
  const contract = await MilestoneRewards.deploy(operatorAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("MilestoneRewards deployed to:", address);
  console.log("Add this to your backend .env as CONTRACT_ADDRESS=", address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
