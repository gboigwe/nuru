import { type PublicClient, type WalletClient, parseUnits, formatUnits, type Address } from "viem";
import { ERC20_ABI } from "~~/constants/abis/ERC20_ABI";
import { CURRENCIES, SupportedCurrency } from "~~/constants/currencies";
import deployedContracts from "~~/contracts/deployedContracts";
import { base } from "viem/chains";

export interface USDCPaymentParams {
  from: Address;
  to: Address;
  amount: string;
  currency: SupportedCurrency;
  contractAddress: Address;
  voiceHash: string;
  metadata: string;
}

export interface USDCApprovalParams {
  owner: Address;
  spender: Address;
  amount: string;
}

export interface USDCBalanceInfo {
  balance: bigint;
  formattedBalance: string;
  allowance: bigint;
  formattedAllowance: string;
  hasEnoughBalance: boolean;
  hasEnoughAllowance: boolean;
}

export class USDCPaymentHandler {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private usdcAddress: Address;
  private usdcDecimals: number;

  constructor(publicClient: PublicClient, walletClient: WalletClient) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;

    // USDC on BASE Mainnet
    this.usdcAddress = CURRENCIES[SupportedCurrency.USDC].contractAddress as Address;
    this.usdcDecimals = CURRENCIES[SupportedCurrency.USDC].decimals;
  }

  /**
   * Helper to create payment parameters with voice metadata
   */
  createPaymentParams(
    from: Address,
    to: Address,
    amount: string,
    voiceHash: string,
    voiceMetadata: {
      language?: string;
      confidence?: number;
      voiceCommand?: string;
      timestamp?: number;
      filecoinCid?: string;
    }
  ): USDCPaymentParams {
    return {
      from,
      to,
      amount,
      currency: SupportedCurrency.USDC,
      contractAddress: deployedContracts[base.id].VoiceRemittance.address as Address,
      voiceHash,
      metadata: JSON.stringify(voiceMetadata),
    };
  }

  /**
   * Check USDC balance and allowance for a given address
   */
  async checkBalance(owner: Address, spender: Address, requiredAmount: string): Promise<USDCBalanceInfo> {
    try {
      const amountWei = parseUnits(requiredAmount, this.usdcDecimals);

      // Get USDC balance
      const balance = (await this.publicClient.readContract({
        address: this.usdcAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [owner],
      })) as bigint;

      // Get USDC allowance for spender (contract)
      const allowance = (await this.publicClient.readContract({
        address: this.usdcAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [owner, spender],
      })) as bigint;

      return {
        balance,
        formattedBalance: formatUnits(balance, this.usdcDecimals),
        allowance,
        formattedAllowance: formatUnits(allowance, this.usdcDecimals),
        hasEnoughBalance: balance >= amountWei,
        hasEnoughAllowance: allowance >= amountWei,
      };
    } catch (error) {
      console.error("Error checking USDC balance:", error);
      throw new Error("Failed to check USDC balance and allowance");
    }
  }

  /**
   * Approve USDC spending for exact amount (per-transaction approval)
   */
  async approveUSDC(params: USDCApprovalParams): Promise<Address> {
    try {
      const amountWei = parseUnits(params.amount, this.usdcDecimals);

      console.log("Approving USDC spending:", {
        owner: params.owner,
        spender: params.spender,
        amount: params.amount,
        amountWei: amountWei.toString(),
      });

      // Execute approve transaction
      const hash = await this.walletClient.writeContract({
        address: this.usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [params.spender, amountWei],
        account: params.owner,
      });

      console.log("USDC approval transaction submitted:", hash);

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === "reverted") {
        throw new Error("USDC approval transaction reverted");
      }

      console.log("USDC approval confirmed:", receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error: any) {
      console.error("Error approving USDC:", error);

      // Handle common errors
      if (error.message?.includes("user rejected")) {
        throw new Error("User rejected USDC approval transaction");
      }
      if (error.message?.includes("insufficient funds")) {
        throw new Error("Insufficient ETH for gas fees");
      }

      throw new Error(`Failed to approve USDC: ${error.message || "Unknown error"}`);
    }
  }

  /**
   * Execute USDC payment via contract's USDC payment function
   */
  async executeUSDCPayment(params: USDCPaymentParams): Promise<Address> {
    try {
      const amountWei = parseUnits(params.amount, this.usdcDecimals);

      console.log("Executing USDC payment:", {
        from: params.from,
        to: params.to,
        amount: params.amount,
        amountWei: amountWei.toString(),
        contract: params.contractAddress,
        voiceHash: params.voiceHash,
        metadataPreview: params.metadata.substring(0, 100),
      });

      // Check balance and allowance before payment
      const balanceInfo = await this.checkBalance(params.from, params.contractAddress, params.amount);

      if (!balanceInfo.hasEnoughBalance) {
        throw new Error(
          `Insufficient USDC balance. You have ${balanceInfo.formattedBalance} USDC but need ${params.amount} USDC`,
        );
      }

      if (!balanceInfo.hasEnoughAllowance) {
        throw new Error(
          `Insufficient USDC allowance. Please approve USDC spending first. Current allowance: ${balanceInfo.formattedAllowance} USDC`,
        );
      }

      // Get VoiceRemittance contract ABI
      const voiceRemittanceAbi = deployedContracts[base.id].VoiceRemittance.abi;

      // Execute payment via contract with correct 4-parameter signature
      const hash = await this.walletClient.writeContract({
        address: params.contractAddress,
        abi: voiceRemittanceAbi,
        functionName: "initiateUSDCPayment",
        args: [params.to, amountWei, params.voiceHash, params.metadata],
        account: params.from,
      });

      console.log("USDC payment transaction submitted:", hash);

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === "reverted") {
        throw new Error("USDC payment transaction reverted");
      }

      console.log("USDC payment confirmed:", receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error: any) {
      console.error("Error executing USDC payment:", error);

      // Handle common errors
      if (error.message?.includes("user rejected")) {
        throw new Error("User rejected USDC payment transaction");
      }
      if (error.message?.includes("insufficient funds")) {
        throw new Error("Insufficient ETH for gas fees");
      }
      if (error.message?.includes("Insufficient USDC")) {
        throw error; // Re-throw our custom error
      }

      throw new Error(`Failed to execute USDC payment: ${error.message || "Unknown error"}`);
    }
  }

  /**
   * Get current USDC balance for an address
   */
  async getBalance(address: Address): Promise<{ balance: bigint; formatted: string }> {
    try {
      const balance = (await this.publicClient.readContract({
        address: this.usdcAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      return {
        balance,
        formatted: formatUnits(balance, this.usdcDecimals),
      };
    } catch (error) {
      console.error("Error getting USDC balance:", error);
      throw new Error("Failed to get USDC balance");
    }
  }

  /**
   * Get current allowance for a spender
   */
  async getAllowance(owner: Address, spender: Address): Promise<{ allowance: bigint; formatted: string }> {
    try {
      const allowance = (await this.publicClient.readContract({
        address: this.usdcAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [owner, spender],
      })) as bigint;

      return {
        allowance,
        formatted: formatUnits(allowance, this.usdcDecimals),
      };
    } catch (error) {
      console.error("Error getting USDC allowance:", error);
      throw new Error("Failed to get USDC allowance");
    }
  }

  /**
   * Estimate gas for USDC approval
   */
  async estimateApprovalGas(params: USDCApprovalParams): Promise<bigint> {
    try {
      const amountWei = parseUnits(params.amount, this.usdcDecimals);

      const gas = await this.publicClient.estimateContractGas({
        address: this.usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [params.spender, amountWei],
        account: params.owner,
      });

      return gas;
    } catch (error) {
      console.error("Error estimating approval gas:", error);
      // Return a default gas estimate if estimation fails
      return BigInt(50000);
    }
  }

  /**
   * Estimate gas for USDC payment
   */
  async estimatePaymentGas(params: USDCPaymentParams): Promise<bigint> {
    try {
      const amountWei = parseUnits(params.amount, this.usdcDecimals);
      const voiceRemittanceAbi = deployedContracts[base.id].VoiceRemittance.abi;

      const gas = await this.publicClient.estimateContractGas({
        address: params.contractAddress,
        abi: voiceRemittanceAbi,
        functionName: "initiateUSDCPayment",
        args: [params.to, amountWei, params.voiceHash, params.metadata],
        account: params.from,
      });

      return gas;
    } catch (error) {
      console.error("Error estimating payment gas:", error);
      // Return a default gas estimate if estimation fails
      return BigInt(150000);
    }
  }
}
