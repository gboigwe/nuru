import { BrowserProvider, JsonRpcSigner, TransactionRequest } from 'ethers';
import { gasPriceOracle } from './GasPriceOracle';

export class TransactionReplacer {
  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;

  initialize(provider: BrowserProvider, signer: JsonRpcSigner) {
    this.provider = provider;
    this.signer = signer;
  }

  async speedUpTransaction(originalTxHash: string): Promise<string> {
    if (!this.provider || !this.signer) throw new Error('Not initialized');

    const originalTx = await this.provider.getTransaction(originalTxHash);
    if (!originalTx) throw new Error('Transaction not found');

    const receipt = await this.provider.getTransactionReceipt(originalTxHash);
    if (receipt) throw new Error('Transaction already confirmed');

    const newGasPrice = await gasPriceOracle.getSpeedUpGasPrice(originalTx.gasPrice || BigInt(0));

    const replacementTx: TransactionRequest = {
      to: originalTx.to,
      value: originalTx.value,
      data: originalTx.data,
      nonce: originalTx.nonce,
      gasLimit: originalTx.gasLimit,
      maxFeePerGas: newGasPrice,
      maxPriorityFeePerGas: (newGasPrice * BigInt(90)) / BigInt(100)
    };

    const tx = await this.signer.sendTransaction(replacementTx);
    return tx.hash;
  }

  async cancelTransaction(originalTxHash: string): Promise<string> {
    if (!this.provider || !this.signer) throw new Error('Not initialized');

    const originalTx = await this.provider.getTransaction(originalTxHash);
    if (!originalTx) throw new Error('Transaction not found');

    const newGasPrice = await gasPriceOracle.getSpeedUpGasPrice(originalTx.gasPrice || BigInt(0));
    const address = await this.signer.getAddress();

    const cancelTx: TransactionRequest = {
      to: address,
      value: BigInt(0),
      nonce: originalTx.nonce,
      gasLimit: BigInt(21000),
      maxFeePerGas: newGasPrice,
      maxPriorityFeePerGas: (newGasPrice * BigInt(90)) / BigInt(100)
    };

    const tx = await this.signer.sendTransaction(cancelTx);
    return tx.hash;
  }
}

export const transactionReplacer = new TransactionReplacer();
