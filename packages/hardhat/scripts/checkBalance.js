const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Checking balance for account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  const network = await deployer.provider.getNetwork();
  console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
  
  if (network.chainId === 84532n) {
    console.log("✅ Connected to Base Sepolia!");
    
    if (balance > ethers.parseEther("0.001")) {
      console.log("✅ Sufficient balance for deployment!");
    } else {
      console.log("❌ Low balance. Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    }
  } else {
    console.log("❌ Not connected to Base Sepolia. Check your network configuration.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });