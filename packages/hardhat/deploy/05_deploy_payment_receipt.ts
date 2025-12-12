import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the PaymentReceipt NFT contract
 *
 * @param hre HardhatRuntimeEnvironment object
 */
const deployPaymentReceipt: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("PaymentReceipt", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract
  const paymentReceipt = await hre.ethers.getContract<Contract>("PaymentReceipt", deployer);

  console.log("PaymentReceipt deployed to:", await paymentReceipt.getAddress());
};

export default deployPaymentReceipt;

deployPaymentReceipt.tags = ["PaymentReceipt"];
