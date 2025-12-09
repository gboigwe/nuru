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

  describe("USDC Payment Validation", () => {
    const amount = ethers.parseUnits("100", 6);

    it("should fail if insufficient USDC allowance", async () => {
      await usdcMock.mint(user1.address, amount);
      // No approval given

      await expect(
        contract.connect(user1).initiateUSDCPayment(
          user2.address,
          amount,
          "ipfs://hash",
          "{}"
        )
      ).to.be.revertedWith("USDC transfer failed - check allowance");
    });

    it("should fail if insufficient USDC balance", async () => {
      await usdcMock.connect(user1).approve(await contract.getAddress(), amount);
      // No USDC minted

      await expect(
        contract.connect(user1).initiateUSDCPayment(
          user2.address,
          amount,
          "ipfs://hash",
          "{}"
        )
      ).to.be.revertedWith("USDC transfer failed - check allowance");
    });

    it("should fail if recipient is zero address", async () => {
      await usdcMock.mint(user1.address, amount);
      await usdcMock.connect(user1).approve(await contract.getAddress(), amount);

      await expect(
        contract.connect(user1).initiateUSDCPayment(
          ethers.ZeroAddress,
          amount,
          "ipfs://hash",
          "{}"
        )
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("should fail if sending to self", async () => {
      await usdcMock.mint(user1.address, amount);
      await usdcMock.connect(user1).approve(await contract.getAddress(), amount);

      await expect(
        contract.connect(user1).initiateUSDCPayment(
          user1.address,
          amount,
          "ipfs://hash",
          "{}"
        )
      ).to.be.revertedWith("Cannot send to yourself");
    });

    it("should fail if sending to contract address", async () => {
      await usdcMock.mint(user1.address, amount);
      await usdcMock.connect(user1).approve(await contract.getAddress(), amount);

      await expect(
        contract.connect(user1).initiateUSDCPayment(
          await contract.getAddress(),
          amount,
          "ipfs://hash",
          "{}"
        )
      ).to.be.revertedWith("Cannot send to contract");
    });

    it("should fail if amount is zero", async () => {
      await usdcMock.mint(user1.address, amount);
      await usdcMock.connect(user1).approve(await contract.getAddress(), amount);

      await expect(
        contract.connect(user1).initiateUSDCPayment(
          user2.address,
          0,
          "ipfs://hash",
          "{}"
        )
      ).to.be.revertedWith("Payment amount must be greater than 0");
    });

    it("should fail if amount too small", async () => {
      const tinyAmount = 999n; // Less than 1000 (0.001 USDC)
      await usdcMock.mint(user1.address, tinyAmount);
      await usdcMock.connect(user1).approve(await contract.getAddress(), tinyAmount);

      await expect(
        contract.connect(user1).initiateUSDCPayment(
          user2.address,
          tinyAmount,
          "ipfs://hash",
          "{}"
        )
      ).to.be.revertedWith("Amount too small");
    });

    it("should fail if voice hash is empty", async () => {
      await usdcMock.mint(user1.address, amount);
      await usdcMock.connect(user1).approve(await contract.getAddress(), amount);

      await expect(
        contract.connect(user1).initiateUSDCPayment(
          user2.address,
          amount,
          "",
          "{}"
        )
      ).to.be.revertedWith("Voice hash cannot be empty");
    });
  });

  describe("ETH Payment with ENS", () => {
    const amount = ethers.parseEther("1");

    it("should initiate ETH payment with ENS name", async () => {
      const tx = await contract.connect(user1).initiatePayment(
        "mama.family.eth",
        "ipfs://QmVoiceHash",
        "ETH",
        JSON.stringify({ language: "en" }),
        { value: amount }
      );

      expect(await contract.getTotalOrders()).to.equal(1);
      const order = await contract.getOrder(1);
      expect(order.recipientENS).to.equal("mama.family.eth");
      expect(order.amount).to.equal(amount);
      expect(order.completed).to.be.false;
    });

    it("should emit PaymentInitiated event with ENS", async () => {
      await expect(
        contract.connect(user1).initiatePayment(
          "test.eth",
          "ipfs://hash",
          "ETH",
          "{}",
          { value: amount }
        )
      )
        .to.emit(contract, "PaymentInitiated")
        .withArgs(1, user1.address, "test.eth", amount, "ETH", "ipfs://hash");
    });

    it("should fail if ENS name is empty", async () => {
      await expect(
        contract.connect(user1).initiatePayment(
          "",
          "ipfs://hash",
          "ETH",
          "{}",
          { value: amount }
        )
      ).to.be.revertedWith("ENS name cannot be empty");
    });

    it("should fail if ENS name too long", async () => {
      const longENS = "a".repeat(257) + ".eth";
      await expect(
        contract.connect(user1).initiatePayment(
          longENS,
          "ipfs://hash",
          "ETH",
          "{}",
          { value: amount }
        )
      ).to.be.revertedWith("ENS name too long");
    });

    it("should fail if payment amount is zero", async () => {
      await expect(
        contract.connect(user1).initiatePayment(
          "test.eth",
          "ipfs://hash",
          "ETH",
          "{}",
          { value: 0 }
        )
      ).to.be.revertedWith("Payment amount must be greater than 0");
    });

    it("should update user profile on payment", async () => {
      await contract.connect(user1).initiatePayment(
        "test.eth",
        "ipfs://hash",
        "ETH",
        "{}",
        { value: amount }
      );

      const profile = await contract.getUserProfile(user1.address);
      expect(profile.totalSent).to.equal(amount);
      expect(profile.transactionCount).to.equal(1);
    });
  });
});
