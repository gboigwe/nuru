import { vi } from 'vitest';
import type { Address } from 'viem';

export function createMockPublicClient() {
  return {
    readContract: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
    estimateContractGas: vi.fn(),
    getBalance: vi.fn(),
  };
}

export function createMockWalletClient(address: Address) {
  return {
    writeContract: vi.fn(),
    account: { address },
  };
}

export function createMockAddress(suffix: string = '1234'): Address {
  return `0x${suffix.padEnd(40, '0')}` as Address;
}

export function mockTransactionReceipt(hash: Address, status: 'success' | 'reverted' = 'success') {
  return {
    status,
    transactionHash: hash,
    blockNumber: BigInt(12345),
    gasUsed: BigInt(150000),
  };
}

export function mockUSDCBalance(amount: string) {
  return BigInt(parseFloat(amount) * 1000000); // 6 decimals
}

export const TEST_ADDRESSES = {
  user1: createMockAddress('1111'),
  user2: createMockAddress('2222'),
  contract: createMockAddress('cccc'),
  usdc: createMockAddress('dddd'),
};
