import { expect } from "chai";
import { ethers } from "hardhat";
import { VoiceRemittance, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VoiceRemittance", () => {
  let contract: VoiceRemittance;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let usdcMock: MockERC20;

  beforeEach(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy mock USDC with 6 decimals
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    usdcMock = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    await usdcMock.waitForDeployment();

    // Deploy VoiceRemittance
    const VoiceRemittanceFactory = await ethers.getContractFactory("VoiceRemittance");
    contract = await VoiceRemittanceFactory.deploy(await usdcMock.getAddress());
    await contract.waitForDeployment();
  });

  describe("Deployment", () => {
    it("should deploy with correct USDC address", async () => {
      expect(await contract.usdcToken()).to.equal(await usdcMock.getAddress());
    });

    it("should set deployer as owner", async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("should initialize with zero orders", async () => {
      expect(await contract.getTotalOrders()).to.equal(0);
    });

    it("should set correct platform fee", async () => {
      expect(await contract.platformFeePercent()).to.equal(50); // 0.5%
    });
  });
});
