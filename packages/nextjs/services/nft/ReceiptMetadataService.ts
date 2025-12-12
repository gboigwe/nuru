/**
 * Receipt Metadata Service
 *
 * Generates NFT metadata for payment receipts
 */

export interface PaymentReceiptData {
  sender: string;
  recipient: string;
  amount: string;
  currency: string;
  timestamp: number;
  transactionHash: string;
  blockNumber?: number;
  network?: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: NFTAttribute[];
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

class ReceiptMetadataServiceClass {
  /**
   * Generate NFT metadata for a payment receipt
   */
  generateMetadata(receiptData: PaymentReceiptData, imageUri: string): NFTMetadata {
    const { sender, recipient, amount, currency, timestamp, transactionHash, blockNumber, network } = receiptData;

    const date = new Date(timestamp);
    const receiptId = transactionHash.slice(0, 10);

    return {
      name: `Nuru Payment Receipt #${receiptId}`,
      description: `Payment receipt for ${amount} ${currency} from ${this.formatAddress(sender)} to ${this.formatAddress(recipient)} on ${date.toLocaleDateString()}`,
      image: imageUri,
      external_url: this.getExplorerUrl(transactionHash, network),
      attributes: [
        {
          trait_type: "Amount",
          value: parseFloat(amount),
          display_type: "number",
        },
        {
          trait_type: "Currency",
          value: currency,
        },
        {
          trait_type: "Sender",
          value: sender,
        },
        {
          trait_type: "Recipient",
          value: recipient,
        },
        {
          trait_type: "Date",
          value: date.toISOString().split("T")[0],
        },
        {
          trait_type: "Timestamp",
          value: timestamp,
          display_type: "date",
        },
        {
          trait_type: "Transaction Hash",
          value: transactionHash,
        },
        ...(blockNumber
          ? [
              {
                trait_type: "Block Number",
                value: blockNumber,
                display_type: "number" as const,
              },
            ]
          : []),
        ...(network
          ? [
              {
                trait_type: "Network",
                value: network,
              },
            ]
          : []),
      ],
    };
  }

  /**
   * Format address for display
   */
  private formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Get block explorer URL for transaction
   */
  private getExplorerUrl(txHash: string, network?: string): string {
    const explorers: Record<string, string> = {
      mainnet: "https://etherscan.io/tx/",
      base: "https://basescan.org/tx/",
      "base-sepolia": "https://sepolia.basescan.org/tx/",
      optimism: "https://optimistic.etherscan.io/tx/",
      arbitrum: "https://arbiscan.io/tx/",
      polygon: "https://polygonscan.com/tx/",
    };

    const explorerBase = explorers[network || "base"] || explorers.base;
    return `${explorerBase}${txHash}`;
  }

  /**
   * Convert metadata to JSON string
   */
  toJSON(metadata: NFTMetadata): string {
    return JSON.stringify(metadata, null, 2);
  }

  /**
   * Upload metadata to IPFS
   * TODO: Integrate with actual IPFS service
   */
  async uploadToIPFS(metadata: NFTMetadata): Promise<string> {
    // Placeholder - integrate with Web3.Storage or Pinata
    console.log("TODO: Upload metadata to IPFS", metadata);

    // Return mock IPFS URI for now
    return `ipfs://Qm${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate searchable tags for receipt
   */
  generateTags(receiptData: PaymentReceiptData): string[] {
    const { currency, sender, recipient, timestamp } = receiptData;

    const date = new Date(timestamp);
    const month = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const year = date.getFullYear().toString();

    return [
      `payment`,
      `receipt`,
      currency.toLowerCase(),
      `sender:${sender.toLowerCase()}`,
      `recipient:${recipient.toLowerCase()}`,
      `month:${month}`,
      `year:${year}`,
    ];
  }

  /**
   * Create receipt title
   */
  createTitle(receiptData: PaymentReceiptData): string {
    const { amount, currency, timestamp } = receiptData;
    const date = new Date(timestamp).toLocaleDateString();

    return `${amount} ${currency} Payment - ${date}`;
  }

  /**
   * Create receipt description
   */
  createDescription(receiptData: PaymentReceiptData): string {
    const { sender, recipient, amount, currency, timestamp } = receiptData;

    const date = new Date(timestamp).toLocaleString();

    return `Payment receipt for ${amount} ${currency} sent from ${this.formatAddress(sender)} to ${this.formatAddress(recipient)} on ${date}. This NFT serves as permanent, verifiable proof of payment on the blockchain.`;
  }

  /**
   * Validate metadata structure
   */
  validateMetadata(metadata: NFTMetadata): boolean {
    if (!metadata.name || !metadata.description || !metadata.image) {
      return false;
    }

    if (!Array.isArray(metadata.attributes)) {
      return false;
    }

    // Check required attributes
    const requiredTraits = ["Amount", "Currency", "Sender", "Recipient", "Date", "Transaction Hash"];

    const presentTraits = metadata.attributes.map(attr => attr.trait_type);

    return requiredTraits.every(trait => presentTraits.includes(trait));
  }
}

export const receiptMetadataService = new ReceiptMetadataServiceClass();
