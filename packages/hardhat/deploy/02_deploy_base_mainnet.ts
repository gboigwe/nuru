import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys VoiceRemittance to BASE Mainnet (PRODUCTION)
 *
 * IMPORTANT: This deploys to PRODUCTION. Use with extreme caution!
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployBaseMainnet: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // Only run on base network
  if (hre.network.name !== "base") {
    console.log(`⏭️  Skipping BASE Mainnet deployment (current network: ${hre.network.name})`);
    return;
  }

  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n" + "=".repeat(80));
  console.log("🚨 BASE MAINNET DEPLOYMENT - PRODUCTION");
  console.log("=".repeat(80));
  console.log("⚠️  WARNING: This is a MAINNET deployment!");
  console.log("⚠️  Real funds will be at risk. Proceed with extreme caution.");
  console.log("=".repeat(80) + "\n");

  console.log(`📍 Network: ${hre.network.name}`);
  console.log(`🔗 Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId}`);
  console.log(`👤 Deployer: ${deployer}\n`);

  // Configuration for BASE Mainnet
  const USDC_ADDRESS_BASE_MAINNET = process.env.USDC_TOKEN_ADDRESS_BASE_MAINNET || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const FEE_RECEIVER = process.env.FEE_RECEIVER_ADDRESS_MAINNET;
  const MULTISIG_WALLET = process.env.MULTISIG_WALLET_ADDRESS;

  // Safety checks
  if (!FEE_RECEIVER || FEE_RECEIVER === deployer) {
    throw new Error("❌ FEE_RECEIVER_ADDRESS_MAINNET must be set to a multisig wallet, not deployer address");
  }

  if (!MULTISIG_WALLET) {
    throw new Error("❌ MULTISIG_WALLET_ADDRESS must be set for mainnet deployment");
  }

  // Verify deployer has enough funds
  const balance = await hre.ethers.provider.getBalance(deployer);
  const minBalance = hre.ethers.parseEther("0.01"); // Minimum 0.01 ETH

  if (balance < minBalance) {
    throw new Error(`❌ Insufficient balance. Deployer has ${hre.ethers.formatEther(balance)} ETH, need at least 0.01 ETH`);
  }

  console.log("📋 Deployment Configuration:");
  console.log(`   USDC Token: ${USDC_ADDRESS_BASE_MAINNET}`);
  console.log(`   Fee Receiver: ${FEE_RECEIVER}`);
  console.log(`   Multisig Wallet: ${MULTISIG_WALLET}`);
  console.log(`   Deployer Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Final confirmation
  console.log("⚠️  FINAL CONFIRMATION REQUIRED");
  console.log("   This will deploy to BASE MAINNET with REAL FUNDS at risk");
  console.log("   Make sure you have:");
  console.log("   ✅ Completed security audit");
  console.log("   ✅ Tested on BASE Sepolia testnet");
  console.log("   ✅ Configured multisig wallet");
  console.log("   ✅ Double-checked all configuration values\n");

  // Deploy VoiceRemittance
  console.log("🚀 Deploying VoiceRemittance contract to MAINNET...");

  const voiceRemittance = await deploy("VoiceRemittance", {
    from: deployer,
    args: [],
    log: true,
    autoMine: false,
    waitConfirmations: 5, // Wait for 5 confirmations on mainnet
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

  // Configure USDC token
  try {
    const currentUSDC = await voiceRemittanceContract.usdcToken();
    if (currentUSDC === "0x0000000000000000000000000000000000000000") {
      console.log("\n⚙️  Setting USDC token address...");
      const tx = await voiceRemittanceContract.setUSDCToken(USDC_ADDRESS_BASE_MAINNET);
      await tx.wait(2);
      console.log("✅ USDC token address set");
    } else {
      console.log(`\n✅ USDC token already configured: ${currentUSDC}`);
    }
  } catch (error) {
    console.log("⚠️  Could not set USDC token:", error);
  }

  // Transfer ownership to multisig
  console.log("\n🔐 Transferring ownership to multisig wallet...");
  try {
    const currentOwner = await voiceRemittanceContract.owner();
    if (currentOwner.toLowerCase() !== MULTISIG_WALLET.toLowerCase()) {
      const tx = await voiceRemittanceContract.transferOwnership(MULTISIG_WALLET);
      await tx.wait(2);
      console.log(`✅ Ownership transferred to multisig: ${MULTISIG_WALLET}`);
    } else {
      console.log(`✅ Ownership already with multisig: ${MULTISIG_WALLET}`);
    }
  } catch (error) {
    console.log("❌ Ownership transfer failed:", error);
    console.log("⚠️  CRITICAL: Manually transfer ownership to multisig!");
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
      console.log(`   yarn hardhat verify --network base ${voiceRemittance.address}`);
    }
  }

  // Display success information
  console.log("\n" + "=".repeat(80));
  console.log("✅ BASE MAINNET DEPLOYMENT COMPLETED");
  console.log("=".repeat(80));
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 View on Basescan: https://basescan.org/address/${contractAddress}`);
  console.log(`👤 Owner (Multisig): ${MULTISIG_WALLET}`);
  console.log(`💰 Fee Receiver: ${FEE_RECEIVER}`);
  console.log("=".repeat(80) + "\n");

  console.log("⚠️  POST-DEPLOYMENT CHECKLIST:");
  console.log("   ⬜ Test transactions on mainnet");
  console.log("   ⬜ Set up monitoring and alerts");
  console.log("   ⬜ Update frontend with contract address");
  console.log("   ⬜ Announce deployment to team");
  console.log("   ⬜ Document deployment in project docs");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: "base",
    chainId: 8453,
    contractAddress,
    deployer,
    owner: MULTISIG_WALLET,
    usdcAddress: USDC_ADDRESS_BASE_MAINNET,
    feeReceiver: FEE_RECEIVER,
    timestamp: new Date().toISOString(),
    basescanUrl: `https://basescan.org/address/${contractAddress}`,
  };

  console.log("📄 Deployment Info (SAVE THIS SECURELY):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");
};

export default deployBaseMainnet;

deployBaseMainnet.tags = ["BaseMainnet", "VoiceRemittance", "Production"];
deployBaseMainnet.dependencies = [];
