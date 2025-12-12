import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys VoiceRemittance to BASE Sepolia testnet
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployBaseSepolia: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // Only run on baseSepolia network
  if (hre.network.name !== "baseSepolia") {
    console.log(`⏭️  Skipping BASE Sepolia deployment (current network: ${hre.network.name})`);
    return;
  }

  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n" + "=".repeat(60));
  console.log("🔷 BASE SEPOLIA TESTNET DEPLOYMENT");
  console.log("=".repeat(60));
  console.log(`📍 Network: ${hre.network.name}`);
  console.log(`🔗 Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId}`);
  console.log(`👤 Deployer: ${deployer}`);
  console.log("=".repeat(60) + "\n");

  // Configuration for BASE Sepolia
  const USDC_ADDRESS_BASE_SEPOLIA = process.env.USDC_TOKEN_ADDRESS_BASE_SEPOLIA || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const FEE_RECEIVER = process.env.FEE_RECEIVER_ADDRESS_TESTNET || deployer;

  console.log("📋 Deployment Configuration:");
  console.log(`   USDC Token: ${USDC_ADDRESS_BASE_SEPOLIA}`);
  console.log(`   Fee Receiver: ${FEE_RECEIVER}\n`);

  // Deploy VoiceRemittance
  console.log("🚀 Deploying VoiceRemittance contract...");

  const voiceRemittance = await deploy("VoiceRemittance", {
    from: deployer,
    args: [],
    log: true,
    autoMine: false,
    waitConfirmations: 3, // Wait for 3 confirmations
  });

  console.log(`✅ VoiceRemittance deployed to: ${voiceRemittance.address}`);

  // Get contract instance
  const voiceRemittanceContract = await hre.ethers.getContract<Contract>("VoiceRemittance", deployer);
  const contractAddress = await voiceRemittanceContract.getAddress();

  // Display initial state
  console.log("\n📊 Contract Information:");
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Owner: ${await voiceRemittanceContract.owner()}`);
  console.log(`   Total Orders: ${await voiceRemittanceContract.getTotalOrders()}`);
  console.log(`   Platform Fee: ${Number(await voiceRemittanceContract.platformFeePercent()) / 100}%`);

  // Set USDC token address if not already set
  try {
    const currentUSDC = await voiceRemittanceContract.usdcToken();
    if (currentUSDC === "0x0000000000000000000000000000000000000000") {
      console.log("\n⚙️  Setting USDC token address...");
      const tx = await voiceRemittanceContract.setUSDCToken(USDC_ADDRESS_BASE_SEPOLIA);
      await tx.wait();
      console.log("✅ USDC token address set");
    } else {
      console.log(`\n✅ USDC token already configured: ${currentUSDC}`);
    }
  } catch (error) {
    console.log("⚠️  Could not set USDC token:", error);
  }

  // Verify on Basescan
  console.log("\n🔍 Verifying contract on Basescan...");
  try {
    await hre.run("verify:verify", {
      address: voiceRemittance.address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on Basescan");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified");
    } else {
      console.log("❌ Verification failed:", error.message);
      console.log("   You can verify manually with:");
      console.log(`   yarn hardhat verify --network baseSepolia ${voiceRemittance.address}`);
    }
  }

  // Display success information
  console.log("\n" + "=".repeat(60));
  console.log("✅ BASE SEPOLIA DEPLOYMENT COMPLETED");
  console.log("=".repeat(60));
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 View on Basescan: https://sepolia.basescan.org/address/${contractAddress}`);
  console.log(`📝 Deployer: ${deployer}`);
  console.log("=".repeat(60) + "\n");

  // Save deployment info
  const deploymentInfo = {
    network: "baseSepolia",
    chainId: 84532,
    contractAddress,
    deployer,
    usdcAddress: USDC_ADDRESS_BASE_SEPOLIA,
    feeReceiver: FEE_RECEIVER,
    timestamp: new Date().toISOString(),
    basescanUrl: `https://sepolia.basescan.org/address/${contractAddress}`,
  };

  console.log("📄 Deployment Info (save this):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");
};

export default deployBaseSepolia;

deployBaseSepolia.tags = ["BaseSepolia", "VoiceRemittance"];
deployBaseSepolia.dependencies = [];
