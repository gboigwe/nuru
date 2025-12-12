/**
 * XMTP Message Templates
 *
 * Predefined message formats for common interactions
 */

export interface PaymentMessageData {
  amount: string;
  currency: string;
  txHash?: string;
  recipientAddress: string;
  senderAddress: string;
  timestamp: number;
}

export interface DeliveryConfirmationData {
  txHash: string;
  amount: string;
  currency: string;
  blockNumber?: number;
  confirmations?: number;
}

export interface DisputeData {
  txHash: string;
  reason: string;
  amount: string;
  currency: string;
}

export class MessageTemplates {
  /**
   * Payment sent notification
   */
  static paymentSent(data: PaymentMessageData): string {
    const { amount, currency, txHash, recipientAddress } = data;

    return `💸 Payment Sent via Nuru

Amount: ${amount} ${currency}
To: ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}
${txHash ? `Transaction: ${txHash}` : "Processing..."}

Your payment is on its way! You'll receive a confirmation once it's confirmed on-chain.`;
  }

  /**
   * Payment received notification
   */
  static paymentReceived(data: PaymentMessageData): string {
    const { amount, currency, txHash, senderAddress } = data;

    return `💰 Payment Received via Nuru

Amount: ${amount} ${currency}
From: ${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}
${txHash ? `Transaction: ${txHash}` : ""}

Your payment has been received successfully!`;
  }

  /**
   * Payment confirmation
   */
  static paymentConfirmed(data: DeliveryConfirmationData): string {
    const { amount, currency, txHash, blockNumber, confirmations } = data;

    return `✅ Payment Confirmed

Amount: ${amount} ${currency}
Transaction: ${txHash}
${blockNumber ? `Block: ${blockNumber}` : ""}
${confirmations ? `Confirmations: ${confirmations}` : ""}

Your payment has been confirmed on the blockchain!`;
  }

  /**
   * Payment pending notification
   */
  static paymentPending(data: PaymentMessageData): string {
    const { amount, currency, recipientAddress } = data;

    return `⏳ Payment Pending

Amount: ${amount} ${currency}
To: ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}

Your payment is being processed. You'll be notified once it's confirmed.`;
  }

  /**
   * Payment failed notification
   */
  static paymentFailed(data: PaymentMessageData & { reason?: string }): string {
    const { amount, currency, recipientAddress, reason } = data;

    return `❌ Payment Failed

Amount: ${amount} ${currency}
To: ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}
${reason ? `Reason: ${reason}` : ""}

Your payment could not be processed. Please try again or contact support.`;
  }

  /**
   * Dispute raised notification
   */
  static disputeRaised(data: DisputeData): string {
    const { txHash, reason, amount, currency } = data;

    return `⚠️ Dispute Raised

Transaction: ${txHash}
Amount: ${amount} ${currency}
Reason: ${reason}

A dispute has been raised for this transaction. Our support team will review and contact you shortly.`;
  }

  /**
   * Dispute resolved notification
   */
  static disputeResolved(data: DisputeData & { resolution: string }): string {
    const { txHash, amount, currency, resolution } = data;

    return `✅ Dispute Resolved

Transaction: ${txHash}
Amount: ${amount} ${currency}
Resolution: ${resolution}

Your dispute has been resolved. Thank you for your patience.`;
  }

  /**
   * Welcome message for new users
   */
  static welcome(address: string): string {
    return `👋 Welcome to Nuru!

Thanks for joining our voice-powered crypto payment network! Here's what you can do:

💸 Send payments using voice commands
💰 Receive instant crypto transfers
📊 Track your transaction history
💬 Get real-time payment notifications

Need help? Just reply "support" to connect with our team.

Your wallet: ${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Support request acknowledgment
   */
  static supportRequest(): string {
    return `👨‍💼 Nuru Support

Thanks for reaching out! Our support team has been notified and will respond shortly.

In the meantime, you can:
• Visit our help center
• Check transaction status in the app
• Review your payment history

We're here to help!`;
  }

  /**
   * Gas fee optimization tip
   */
  static gasTip(data: { currentGas: string; optimalTime: string }): string {
    const { currentGas, optimalTime } = data;

    return `⛽ Gas Fee Tip

Current gas price: ${currentGas} Gwei
Optimal time to transact: ${optimalTime}

💡 Pro tip: Sending transactions during off-peak hours can save you up to 50% on gas fees!`;
  }

  /**
   * Budget alert notification
   */
  static budgetAlert(data: { spent: string; budget: string; percentage: number }): string {
    const { spent, budget, percentage } = data;

    return `📊 Budget Alert

You've used ${percentage}% of your monthly budget

Spent: $${spent}
Budget: $${budget}
Remaining: $${(parseFloat(budget) - parseFloat(spent)).toFixed(2)}

Keep track of your spending to stay within your budget!`;
  }

  /**
   * Transaction request
   */
  static transactionRequest(data: {
    amount: string;
    currency: string;
    reason?: string;
    fromAddress: string;
  }): string {
    const { amount, currency, reason, fromAddress } = data;

    return `💳 Payment Request

Amount: ${amount} ${currency}
From: ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}
${reason ? `For: ${reason}` : ""}

Reply "approve" to accept this payment request.`;
  }

  /**
   * Transaction reminder
   */
  static transactionReminder(data: {
    amount: string;
    currency: string;
    dueDate: string;
    recipientAddress: string;
  }): string {
    const { amount, currency, dueDate, recipientAddress } = data;

    return `🔔 Payment Reminder

Amount: ${amount} ${currency}
To: ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}
Due: ${dueDate}

Don't forget to complete your scheduled payment!`;
  }

  /**
   * Savings milestone notification
   */
  static savingsMilestone(data: { saved: string; target: string; percentage: number }): string {
    const { saved, target, percentage } = data;

    return `🎯 Savings Milestone Reached!

You've saved: $${saved}
Target: $${target}
Progress: ${percentage}%

Great work! Keep it up to reach your savings goal!`;
  }

  /**
   * Security alert
   */
  static securityAlert(data: { type: string; action: string; timestamp: string }): string {
    const { type, action, timestamp } = data;

    return `🔒 Security Alert

Type: ${type}
Action: ${action}
Time: ${timestamp}

If this wasn't you, please secure your account immediately and contact support.`;
  }

  /**
   * Referral invitation
   */
  static referralInvite(data: { inviterName?: string; bonus?: string }): string {
    const { inviterName, bonus } = data;

    return `🎁 Join Nuru & Earn Rewards!

${inviterName ? `${inviterName} invited you to join Nuru - ` : ""}Voice-powered crypto payments made easy!

${bonus ? `Sign up and get ${bonus} bonus!` : ""}

• Send money using voice commands
• Low fees, instant transfers
• Secure blockchain payments

Join thousands using Nuru for remittances!`;
  }
}
