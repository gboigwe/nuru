export interface UserError {
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
  severity: 'info' | 'warning' | 'error';
}

export class ErrorMessageService {
  /**
   * Convert technical error to user-friendly message
   */
  getUserFriendlyError(error: any): UserError {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';

    // Insufficient funds
    if (errorMessage.includes('insufficient funds') || errorCode.includes('insufficient_funds')) {
      return {
        title: 'Insufficient Balance',
        message: 'You don\'t have enough USDC to complete this payment.',
        action: '/onramp',
        actionLabel: 'Buy USDC',
        severity: 'warning',
      };
    }

    // User rejected
    if (errorMessage.includes('user rejected') || errorCode.includes('action_rejected')) {
      return {
        title: 'Transaction Cancelled',
        message: 'You cancelled the transaction in your wallet.',
        severity: 'info',
      };
    }

    // Network error
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        title: 'Network Error',
        message: 'Unable to connect to the blockchain. Please check your internet connection and try again.',
        action: 'retry',
        actionLabel: 'Retry',
        severity: 'error',
      };
    }

    // Gas estimation failed
    if (errorMessage.includes('gas') || errorMessage.includes('estimation')) {
      return {
        title: 'Transaction Will Fail',
        message: 'This transaction is likely to fail. Please check the recipient address and amount.',
        severity: 'error',
      };
    }

    // Nonce too low (transaction already confirmed)
    if (errorMessage.includes('nonce too low')) {
      return {
        title: 'Transaction Already Processed',
        message: 'This transaction has already been confirmed.',
        severity: 'info',
      };
    }

    // Transaction underpriced
    if (errorMessage.includes('underpriced') || errorMessage.includes('replacement')) {
      return {
        title: 'Gas Price Too Low',
        message: 'The gas price is too low. Increasing gas price...',
        action: 'retry',
        actionLabel: 'Retry with Higher Gas',
        severity: 'warning',
      };
    }

    // Contract error
    if (errorMessage.includes('revert') || errorMessage.includes('execution reverted')) {
      // Parse revert reason
      const reason = this.parseRevertReason(error);
      return {
        title: 'Transaction Failed',
        message: reason || 'The smart contract rejected this transaction.',
        severity: 'error',
      };
    }

    // Unknown error
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
      action: 'retry',
      actionLabel: 'Try Again',
      severity: 'error',
    };
  }

  /**
   * Parse contract revert reason
   */
  private parseRevertReason(error: any): string | null {
    const message = error.message || '';
    
    // Extract reason from error message
    const match = message.match(/reason="([^"]+)"/);
    if (match) {
      return match[1];
    }

    // Common revert reasons
    if (message.includes('Pausable: paused')) {
      return 'The contract is currently paused for maintenance.';
    }
    if (message.includes('Ownable: caller is not the owner')) {
      return 'You do not have permission to perform this action.';
    }

    return null;
  }
}

export const errorMessageService = new ErrorMessageService();
