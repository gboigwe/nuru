export const MessageTemplates = {
  paymentSent: (amount: string, currency: string, recipientName?: string): string => {
    const namePart = recipientName ? ` to ${recipientName}` : '';
    return `🎉 I just sent you ${amount} ${currency} via Nuru!${namePart} 🎉`;
  },

  paymentReceived: (amount: string, currency: string, senderName?: string): string => {
    const namePart = senderName ? ` from ${senderName}` : '';
    return `✅ Thank you for the ${amount} ${currency}!${namePart} ✅`;
  },

  supportRequest: (issue: string): string => {
    return `🆘 Hi! I need help with my Nuru transaction. Issue: ${issue}`;
  },

  transactionDispute: (txHash: string, issue: string): string => {
    return `⚠️ I need to dispute transaction ${txHash}. Issue: ${issue}`;
  },

  deliveryConfirmation: (amount: string, currency: string): string => {
    return `📦 Your payment of ${amount} ${currency} has been successfully delivered!`;
  },

  paymentReminder: (amount: string, currency: string): string => {
    return `🔔 Friendly reminder: You have a pending payment of ${amount} ${currency}`;
  },

  supportResponse: (ticketId: string): string => {
    return `💬 Thank you for contacting Nuru support! Your ticket #${ticketId} has been received and we'll get back to you shortly.`;
  },

  systemNotification: (message: string): string => {
    return `📢 Nuru System: ${message}`;
  }
};

export const SupportTemplates = {
  welcome: (userAddress: string): string => {
    return `👋 Hello! Welcome to Nuru Support. How can we help you with your transaction from ${userAddress}?`;
  },

  issueResolution: (issue: string): string => {
    return `✅ Your issue "${issue}" has been resolved. Is there anything else we can help with?`;
  },

  escalation: (): string => {
    return `🔝 Your request has been escalated to our senior support team. We'll get back to you within 24 hours.`;
  }
};