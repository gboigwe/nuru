/**
 * Receipt Verification Service
 *
 * Verifies payment receipt NFTs against on-chain data
 */

import { createPublicClient, http, type PublicClient } from "viem";
import { base } from "viem/chains";

interface VerificationResult {
  isValid: boolean;
  errors: string[];
  onChainData?: {
    sender: string;
    recipient: string;
    amount: bigint;
    currency: string;
    timestamp: bigint;
    transactionHash: string;
  };
}

class ReceiptVerificationServiceClass {
  private client: PublicClient;

  constructor() {
    this.client = createPublicClient({
      chain: base,
      transport: http(),
    });
  }

  /**
   * Verify receipt NFT against on-chain data
   */
  async verifyReceipt(
    tokenId: bigint,
    expectedData: {
      sender: string;
      recipient: string;
      amount: string;
      transactionHash: string;
    }
  ): Promise<VerificationResult> {
    const errors: string[] = [];

    try {
      // Get on-chain receipt data
      const onChainData = await this.getOnChainReceipt(tokenId);

      if (!onChainData) {
        errors.push("Receipt NFT not found on-chain");
        return { isValid: false, errors };
      }

      // Verify sender
      if (onChainData.sender.toLowerCase() !== expectedData.sender.toLowerCase()) {
        errors.push(
          `Sender mismatch: expected ${expectedData.sender}, got ${onChainData.sender}`
        );
      }

      // Verify recipient
      if (onChainData.recipient.toLowerCase() !== expectedData.recipient.toLowerCase()) {
        errors.push(
          `Recipient mismatch: expected ${expectedData.recipient}, got ${onChainData.recipient}`
        );
      }

      // Verify amount
      const expectedAmount = BigInt(expectedData.amount);
      if (onChainData.amount !== expectedAmount) {
        errors.push(
          `Amount mismatch: expected ${expectedAmount.toString()}, got ${onChainData.amount.toString()}`
        );
      }

      // Verify transaction hash
      if (onChainData.transactionHash.toLowerCase() !== expectedData.transactionHash.toLowerCase()) {
        errors.push(
          `Transaction hash mismatch: expected ${expectedData.transactionHash}, got ${onChainData.transactionHash}`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        onChainData,
      };
    } catch (error) {
      errors.push(`Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Get receipt data from blockchain
   */
  private async getOnChainReceipt(tokenId: bigint) {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_PAYMENT_RECEIPT_CONTRACT as `0x${string}`;

      const data = await this.client.readContract({
        address: contractAddress,
        abi: [
          {
            inputs: [{ name: "tokenId", type: "uint256" }],
            name: "getReceipt",
            outputs: [
              {
                components: [
                  { name: "sender", type: "address" },
                  { name: "recipient", type: "address" },
                  { name: "amount", type: "uint256" },
                  { name: "currency", type: "string" },
                  { name: "timestamp", type: "uint256" },
                  { name: "transactionHash", type: "bytes32" },
                ],
                name: "",
                type: "tuple",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "getReceipt",
        args: [tokenId],
      });

      if (!data) {
        return null;
      }

      const [sender, recipient, amount, currency, timestamp, transactionHash] = data as [
        string,
        string,
        bigint,
        string,
        bigint,
        string,
      ];

      return {
        sender,
        recipient,
        amount,
        currency,
        timestamp,
        transactionHash,
      };
    } catch (error) {
      console.error("Failed to get on-chain receipt:", error);
      return null;
    }
  }

  /**
   * Verify receipt exists
   */
  async receiptExists(tokenId: bigint): Promise<boolean> {
    try {
      const data = await this.getOnChainReceipt(tokenId);
      return data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get receipt by transaction hash
   */
  async getReceiptByTransaction(txHash: string): Promise<bigint | null> {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_PAYMENT_RECEIPT_CONTRACT as `0x${string}`;

      const tokenId = await this.client.readContract({
        address: contractAddress,
        abi: [
          {
            inputs: [{ name: "txHash", type: "bytes32" }],
            name: "getTokenIdByTransaction",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "getTokenIdByTransaction",
        args: [txHash as `0x${string}`],
      });

      return tokenId as bigint;
    } catch (error) {
      console.error("Failed to get token ID by transaction:", error);
      return null;
    }
  }

  /**
   * Verify using contract's built-in verification
   */
  async verifyUsingContract(
    tokenId: bigint,
    sender: string,
    recipient: string,
    amount: string,
    txHash: string
  ): Promise<boolean> {
    try {
      const contractAddress = process.env.NEXT_PUBLIC_PAYMENT_RECEIPT_CONTRACT as `0x${string}`;

      const isValid = await this.client.readContract({
        address: contractAddress,
        abi: [
          {
            inputs: [
              { name: "tokenId", type: "uint256" },
              { name: "sender", type: "address" },
              { name: "recipient", type: "address" },
              { name: "amount", type: "uint256" },
              { name: "txHash", type: "bytes32" },
            ],
            name: "verifyReceipt",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "verifyReceipt",
        args: [
          tokenId,
          sender as `0x${string}`,
          recipient as `0x${string}`,
          BigInt(amount),
          txHash as `0x${string}`,
        ],
      });

      return isValid as boolean;
    } catch (error) {
      console.error("Contract verification failed:", error);
      return false;
    }
  }
}

export const receiptVerificationService = new ReceiptVerificationServiceClass();
