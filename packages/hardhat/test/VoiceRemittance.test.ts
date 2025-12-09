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

  describe("USDC Payment Initiation", () => {
    const amount = ethers.parseUnits("100", 6); // 100 USDC

    beforeEach(async () => {
      // Mint USDC to user1
      await usdcMock.mint(user1.address, amount);
      // Approve contract to spend USDC
      await usdcMock.connect(user1).approve(await contract.getAddress(), amount);
    });

    it("should initiate USDC payment with voice proof", async () => {
      const tx = await contract.connect(user1).initiateUSDCPayment(
        user2.address,
        amount,
        "ipfs://QmVoiceHash123",
        JSON.stringify({ language: "en", confidence: 0.95 })
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      // Verify order was created
      expect(await contract.getTotalOrders()).to.equal(1);
    });

    it("should emit PaymentInitiated event", async () => {
      await expect(
        contract.connect(user1).initiateUSDCPayment(
          user2.address,
          amount,
          "ipfs://QmVoiceHash123",
          "{}"
        )
      )
        .to.emit(contract, "PaymentInitiated")
        .withArgs(1, user1.address, "", amount, "USDC", "ipfs://QmVoiceHash123");
    });

    it("should emit PaymentCompleted event", async () => {
      await expect(
        contract.connect(user1).initiateUSDCPayment(
          user2.address,
          amount,
          "ipfs://QmVoiceHash123",
          "{}"
        )
      ).to.emit(contract, "PaymentCompleted");
    });

    it("should transfer USDC to recipient minus fee", async () => {
      const balanceBefore = await usdcMock.balanceOf(user2.address);
      
      await contract.connect(user1).initiateUSDCPayment(
        user2.address,
        amount,
        "ipfs://hash",
        "{}"
      );

      const fee = (amount * 50n) / 10000n; // 0.5% fee
      const netAmount = amount - fee;
      const balanceAfter = await usdcMock.balanceOf(user2.address);
      
      expect(balanceAfter - balanceBefore).to.equal(netAmount);
    });

    it("should transfer fee to owner", async () => {
      const ownerBalanceBefore = await usdcMock.balanceOf(owner.address);
      
      await contract.connect(user1).initiateUSDCPayment(
        user2.address,
        amount,
        "ipfs://hash",
        "{}"
      );

      const fee = (amount * 50n) / 10000n;
      const ownerBalanceAfter = await usdcMock.balanceOf(owner.address);
      
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(fee);
    });
  });
});
