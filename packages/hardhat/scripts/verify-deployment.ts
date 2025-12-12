/**
 * Verify Deployment Script
 *
 * Checks deployment status and configuration
 */

import { ethers } from "hardhat";

async function verifyDeployment() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("\n" + "=".repeat(60));
  console.log("🔍 DEPLOYMENT VERIFICATION");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("=".repeat(60) + "\n");

  // Get contract address from user input or environment
  const contractAddress = process.env.CONTRACT_ADDRESS || "";

  if (!contractAddress) {
    console.log("❌ CONTRACT_ADDRESS environment variable not set");
    console.log("   Usage: CONTRACT_ADDRESS=0x... yarn hardhat run scripts/verify-deployment.ts --network baseSepolia");
    return;
  }

  try {
    // Get contract instance
    const VoiceRemittance = await ethers.getContractFactory("VoiceRemittance");
    const contract = VoiceRemittance.attach(contractAddress);

    console.log("📊 Contract Information:");
    console.log(`   Address: ${contractAddress}`);

    // Check owner
    const owner = await contract.owner();
    console.log(`   Owner: ${owner}`);

    // Check total orders
    const totalOrders = await contract.getTotalOrders();
    console.log(`   Total Orders: ${totalOrders}`);

    // Check platform fee
    const platformFee = await contract.platformFeePercent();
    console.log(`   Platform Fee: ${Number(platformFee) / 100}%`);

    // Check if paused
    const paused = await contract.paused();
    console.log(`   Paused: ${paused}`);

    // Check USDC token
    const usdcToken = await contract.usdcToken();
    console.log(`   USDC Token: ${usdcToken}`);

    console.log("\n✅ Deployment verification completed");

    // Network-specific checks
    if (network.chainId === 84532n) {
      console.log("\n📍 BASE Sepolia Testnet");
      console.log(`   View on Basescan: https://sepolia.basescan.org/address/${contractAddress}`);
      console.log(`   Expected USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e`);
    } else if (network.chainId === 8453n) {
      console.log("\n📍 BASE Mainnet");
      console.log(`   View on Basescan: https://basescan.org/address/${contractAddress}`);
      console.log(`   Expected USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`);

      // Additional mainnet checks
      console.log("\n⚠️  Mainnet Checklist:");
      console.log(`   ${owner !== deployer.address ? "✅" : "❌"} Ownership transferred to multisig`);
      console.log(`   ${usdcToken === "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" ? "✅" : "❌"} Correct USDC address`);
      console.log(`   ${!paused ? "✅" : "⚠️ "} Contract active (not paused)`);
    }
  } catch (error: any) {
    console.error("\n❌ Verification failed:", error.message);
  }

  console.log("");
}

verifyDeployment()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
