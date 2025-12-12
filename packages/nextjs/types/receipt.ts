/**
 * Payment Receipt NFT Types
 */

export interface PaymentReceipt {
  tokenId: bigint;
  sender: string;
  recipient: string;
  amount: bigint;
  currency: string;
  timestamp: bigint;
  transactionHash: string;
  tokenURI: string;
  owner: string;
}

export interface ReceiptMintData {
  sender: string;
  recipient: string;
  amount: string;
  currency: string;
  transactionHash: string;
  blockNumber?: number;
  network?: string;
}

export interface ReceiptMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: ReceiptAttribute[];
}

export interface ReceiptAttribute {
  trait_type: string;
  value: string | number;
  display_type?: "number" | "date" | "boost_number" | "boost_percentage";
}

export interface ReceiptFilter {
  currency?: string;
  minAmount?: string;
  maxAmount?: string;
  startDate?: number;
  endDate?: number;
  sender?: string;
  recipient?: string;
}

export interface ReceiptSearchResult {
  receipts: PaymentReceipt[];
  total: number;
  hasMore: boolean;
}
