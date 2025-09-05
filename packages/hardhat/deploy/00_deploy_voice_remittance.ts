import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the VoiceRemittance contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployVoiceRemittance: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🎙️ Deploying VoiceRemittance contract...");

  const voiceRemittance = await deploy("VoiceRemittance", {
    from: deployer,
    // Contract constructor arguments
    args: [],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  console.log(`🚀 VoiceRemittance deployed to: ${voiceRemittance.address}`);

  // Get the deployed contract to interact with it after deploying.
  const voiceRemittanceContract = await hre.ethers.getContract<Contract>("VoiceRemittance", deployer);

  console.log("\n📊 VoiceRemittance Contract Information:");
  console.log(`📍 Address: ${await voiceRemittanceContract.getAddress()}`);
  console.log(`👤 Owner: ${await voiceRemittanceContract.owner()}`);
  
  // Get initial state
  const totalOrders = await voiceRemittanceContract.getTotalOrders();
  const platformFee = await voiceRemittanceContract.platformFeePercent();
  
  console.log(`📦 Total Orders: ${totalOrders}`);
  console.log(`💰 Platform Fee: ${Number(platformFee) / 100}%`);

  // Verify on Etherscan if not on localhost
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: voiceRemittance.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on block explorer");
    } catch (error) {
      console.log("❌ Verification failed:", error);
    }
  }

  console.log("\n✅ VoiceRemittance deployment completed!");
  
  // Log important information for the demo
  console.log("\n📝 Demo Information:");
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${await hre.ethers.provider.getNetwork().then(n => n.chainId)}`);
  console.log(`Deployer: ${deployer}`);
  
  if (hre.network.name === "baseSepolia") {
    console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/address/${voiceRemittance.address}`);
  }
};

export default deployVoiceRemittance;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags VoiceRemittance
deployVoiceRemittance.tags = ["VoiceRemittance"];