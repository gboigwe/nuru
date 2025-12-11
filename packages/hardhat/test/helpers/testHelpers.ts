import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { VoiceRemittance, MockERC20 } from "../../typechain-types";

export interface TestFixture {
  contract: VoiceRemittance;
  usdcMock: MockERC20;
  owner: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
  user3: SignerWithAddress;
}

export async function deployTestFixture(): Promise<TestFixture> {
  const [owner, user1, user2, user3] = await ethers.getSigners();

  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const usdcMock = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
  await usdcMock.waitForDeployment();

  const VoiceRemittanceFactory = await ethers.getContractFactory("VoiceRemittance");
  const contract = await VoiceRemittanceFactory.deploy(await usdcMock.getAddress());
  await contract.waitForDeployment();

  return { contract, usdcMock, owner, user1, user2, user3 };
}

export async function setupUSDC(
  usdcMock: MockERC20,
  user: SignerWithAddress,
  contractAddress: string,
  amount: bigint
) {
  await usdcMock.mint(user.address, amount);
  await usdcMock.connect(user).approve(contractAddress, amount);
}

export function parseUSDC(amount: string): bigint {
  return ethers.parseUnits(amount, 6);
}

export function calculateFee(amount: bigint, feePercent: number = 50): bigint {
  return (amount * BigInt(feePercent)) / 10000n;
}
