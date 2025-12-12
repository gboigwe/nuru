/**
 * Update Frontend with Deployment Addresses
 *
 * This script helps update the frontend deployedContracts.ts file
 * with new contract addresses after deployment
 */

import * as fs from "fs";
import * as path from "path";

interface NetworkDeployment {
  address: string;
  abi: any[];
}

interface DeploymentInfo {
  chainId: number;
  network: string;
  contractAddress: string;
  contractName: string;
}

/**
 * Update deployedContracts.ts with new deployment
 */
async function updateFrontend() {
  console.log("\n📝 Frontend Deployment Update Tool\n");

  // Example deployment info - replace with actual values
  const deploymentInfo: DeploymentInfo = {
    chainId: 84532, // BASE Sepolia
    network: "baseSepolia",
    contractAddress: "0xYourContractAddressHere",
    contractName: "VoiceRemittance",
  };

  console.log("📋 Deployment Information:");
  console.log(`   Network: ${deploymentInfo.network}`);
  console.log(`   Chain ID: ${deploymentInfo.chainId}`);
  console.log(`   Contract: ${deploymentInfo.contractName}`);
  console.log(`   Address: ${deploymentInfo.contractAddress}\n`);

  // Path to frontend contracts file
  const contractsPath = path.join(__dirname, "../../nextjs/contracts/deployedContracts.ts");

  console.log("ℹ️  Manual Update Required:");
  console.log(`   1. Open: ${contractsPath}`);
  console.log(`   2. Add entry for chain ID ${deploymentInfo.chainId}:`);
  console.log(`
  ${deploymentInfo.chainId}: {
    ${deploymentInfo.contractName}: {
      address: "${deploymentInfo.contractAddress}",
      abi: [...], // Copy ABI from generated file
    },
  },
`);

  console.log(`   3. ABI can be found in: packages/hardhat/artifacts/contracts/${deploymentInfo.contractName}.sol/${deploymentInfo.contractName}.json`);
  console.log("");

  console.log("📄 Deployment Record (save this):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");
}

updateFrontend()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
