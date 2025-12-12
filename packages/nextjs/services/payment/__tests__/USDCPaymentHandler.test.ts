import { describe, it, expect, vi, beforeEach } from 'vitest';
import { USDCPaymentHandler } from '../USDCPaymentHandler';
import type { PublicClient, WalletClient, Address } from 'viem';

describe('USDCPaymentHandler', () => {
  let handler: USDCPaymentHandler;
  let mockPublicClient: any;
  let mockWalletClient: any;

  const mockAddress = '0x1234567890123456789012345678901234567890' as Address;
  const mockRecipient = '0x0987654321098765432109876543210987654321' as Address;
  const mockContractAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Address;

  beforeEach(() => {
    mockPublicClient = {
      readContract: vi.fn(),
      waitForTransactionReceipt: vi.fn(),
      estimateContractGas: vi.fn(),
    };

    mockWalletClient = {
      writeContract: vi.fn(),
      account: { address: mockAddress },
    };

    handler = new USDCPaymentHandler(mockPublicClient, mockWalletClient);
  });

  describe('checkBalance', () => {
    it('should check USDC balance and allowance', async () => {
      const balance = BigInt('100000000'); // 100 USDC (6 decimals)
      const allowance = BigInt('50000000'); // 50 USDC

      mockPublicClient.readContract
        .mockResolvedValueOnce(balance)
        .mockResolvedValueOnce(allowance);

      const result = await handler.checkBalance(mockAddress, mockContractAddress, '50');

      expect(result.balance).toBe(balance);
      expect(result.allowance).toBe(allowance);
      expect(result.hasEnoughBalance).toBe(true);
      expect(result.hasEnoughAllowance).toBe(true);
    });

    it('should detect insufficient balance', async () => {
      const balance = BigInt('10000000'); // 10 USDC
      const allowance = BigInt('50000000'); // 50 USDC

      mockPublicClient.readContract
        .mockResolvedValueOnce(balance)
        .mockResolvedValueOnce(allowance);

      const result = await handler.checkBalance(mockAddress, mockContractAddress, '50');

      expect(result.hasEnoughBalance).toBe(false);
      expect(result.hasEnoughAllowance).toBe(true);
    });

    it('should detect insufficient allowance', async () => {
      const balance = BigInt('100000000'); // 100 USDC
      const allowance = BigInt('10000000'); // 10 USDC

      mockPublicClient.readContract
        .mockResolvedValueOnce(balance)
        .mockResolvedValueOnce(allowance);

      const result = await handler.checkBalance(mockAddress, mockContractAddress, '50');

      expect(result.hasEnoughBalance).toBe(true);
      expect(result.hasEnoughAllowance).toBe(false);
    });
  });

  describe('approveUSDC', () => {
    it('should approve USDC spending', async () => {
      const txHash = '0xabcdef1234567890' as Address;
      
      mockWalletClient.writeContract.mockResolvedValue(txHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
        status: 'success',
        transactionHash: txHash,
      });

      const result = await handler.approveUSDC({
        owner: mockAddress,
        spender: mockContractAddress,
        amount: '100',
      });

      expect(result).toBe(txHash);
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'approve',
        })
      );
    });

    it('should handle user rejection', async () => {
      mockWalletClient.writeContract.mockRejectedValue(
        new Error('user rejected transaction')
      );

      await expect(
        handler.approveUSDC({
          owner: mockAddress,
          spender: mockContractAddress,
          amount: '100',
        })
      ).rejects.toThrow('User rejected USDC approval transaction');
    });

    it('should handle insufficient gas', async () => {
      mockWalletClient.writeContract.mockRejectedValue(
        new Error('insufficient funds for gas')
      );

      await expect(
        handler.approveUSDC({
          owner: mockAddress,
          spender: mockContractAddress,
          amount: '100',
        })
      ).rejects.toThrow('Insufficient ETH for gas fees');
    });
  });

  describe('executeUSDCPayment', () => {
    const paymentParams = {
      from: mockAddress,
      to: mockRecipient,
      amount: '50',
      currency: 'USDC' as any,
      contractAddress: mockContractAddress,
      voiceHash: 'ipfs://QmTest123',
      metadata: JSON.stringify({ language: 'en', confidence: 0.95 }),
    };

    it('should execute USDC payment successfully', async () => {
      const balance = BigInt('100000000'); // 100 USDC
      const allowance = BigInt('50000000'); // 50 USDC
      const txHash = '0xpayment123' as Address;

      mockPublicClient.readContract
        .mockResolvedValueOnce(balance)
        .mockResolvedValueOnce(allowance);

      mockWalletClient.writeContract.mockResolvedValue(txHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
        status: 'success',
        transactionHash: txHash,
        blockNumber: BigInt(12345),
        gasUsed: BigInt(150000),
      });

      const result = await handler.executeUSDCPayment(paymentParams);

      expect(result).toBe(txHash);
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'initiateUSDCPayment',
        })
      );
    });

    it('should fail if insufficient balance', async () => {
      const balance = BigInt('10000000'); // 10 USDC (less than 50)
      const allowance = BigInt('50000000'); // 50 USDC

      mockPublicClient.readContract
        .mockResolvedValueOnce(balance)
        .mockResolvedValueOnce(allowance);

      await expect(
        handler.executeUSDCPayment(paymentParams)
      ).rejects.toThrow('Insufficient USDC balance');
    });

    it('should fail if insufficient allowance', async () => {
      const balance = BigInt('100000000'); // 100 USDC
      const allowance = BigInt('10000000'); // 10 USDC (less than 50)

      mockPublicClient.readContract
        .mockResolvedValueOnce(balance)
        .mockResolvedValueOnce(allowance);

      await expect(
        handler.executeUSDCPayment(paymentParams)
      ).rejects.toThrow('Insufficient USDC allowance');
    });

    it('should handle transaction revert', async () => {
      const balance = BigInt('100000000');
      const allowance = BigInt('50000000');
      const txHash = '0xreverted' as Address;

      mockPublicClient.readContract
        .mockResolvedValueOnce(balance)
        .mockResolvedValueOnce(allowance);

      mockWalletClient.writeContract.mockResolvedValue(txHash);
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
        status: 'reverted',
        transactionHash: txHash,
      });

      await expect(
        handler.executeUSDCPayment(paymentParams)
      ).rejects.toThrow('USDC payment transaction reverted');
    });
  });

  describe('getBalance', () => {
    it('should get USDC balance', async () => {
      const balance = BigInt('100000000'); // 100 USDC
      mockPublicClient.readContract.mockResolvedValue(balance);

      const result = await handler.getBalance(mockAddress);

      expect(result.balance).toBe(balance);
      expect(result.formatted).toBe('100');
    });
  });

  describe('getAllowance', () => {
    it('should get USDC allowance', async () => {
      const allowance = BigInt('50000000'); // 50 USDC
      mockPublicClient.readContract.mockResolvedValue(allowance);

      const result = await handler.getAllowance(mockAddress, mockContractAddress);

      expect(result.allowance).toBe(allowance);
      expect(result.formatted).toBe('50');
    });
  });

  describe('createPaymentParams', () => {
    it('should create payment parameters with voice metadata', () => {
      const params = handler.createPaymentParams(
        mockAddress,
        mockRecipient,
        '100',
        'ipfs://QmVoice',
        {
          language: 'en',
          confidence: 0.95,
          voiceCommand: 'send 100 usdc',
          timestamp: Date.now(),
        }
      );

      expect(params.from).toBe(mockAddress);
      expect(params.to).toBe(mockRecipient);
      expect(params.amount).toBe('100');
      expect(params.voiceHash).toBe('ipfs://QmVoice');
      expect(JSON.parse(params.metadata)).toHaveProperty('language', 'en');
    });
  });
});
