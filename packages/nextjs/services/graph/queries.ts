/**
 * GraphQL Queries for The Graph Subgraph
 *
 * Queries for transaction history, user statistics, and analytics
 * from the Nuru Voice Payment subgraph on The Graph
 */

/**
 * Get recent payments with pagination
 */
export const GET_RECENT_PAYMENTS = `
  query GetRecentPayments($first: Int!, $skip: Int!) {
    payments(
      first: $first
      skip: $skip
      orderBy: initiatedAt
      orderDirection: desc
    ) {
      id
      orderId
      sender
      recipient
      ensName
      basename
      amount
      currency
      platformFee
      netAmount
      voiceHash
      metadata
      status
      initiatedAt
      completedAt
      cancelledAt
      transactionHash
      blockNumber
      gasUsed
    }
  }
`;

/**
 * Get payments by sender address
 */
export const GET_PAYMENTS_BY_SENDER = `
  query GetPaymentsBySender($sender: Bytes!, $first: Int!, $skip: Int!) {
    payments(
      where: { sender: $sender }
      first: $first
      skip: $skip
      orderBy: initiatedAt
      orderDirection: desc
    ) {
      id
      orderId
      recipient
      ensName
      basename
      amount
      currency
      status
      initiatedAt
      completedAt
      transactionHash
    }
  }
`;

/**
 * Get payments by recipient address
 */
export const GET_PAYMENTS_BY_RECIPIENT = `
  query GetPaymentsByRecipient($recipient: Bytes!, $first: Int!, $skip: Int!) {
    payments(
      where: { recipient: $recipient }
      first: $first
      skip: $skip
      orderBy: initiatedAt
      orderDirection: desc
    ) {
      id
      orderId
      sender
      ensName
      basename
      amount
      currency
      status
      initiatedAt
      completedAt
      transactionHash
    }
  }
`;

/**
 * Get payment by order ID
 */
export const GET_PAYMENT_BY_ID = `
  query GetPaymentById($id: ID!) {
    payment(id: $id) {
      id
      orderId
      sender
      recipient
      ensName
      basename
      amount
      currency
      platformFee
      netAmount
      voiceHash
      metadata
      status
      initiatedAt
      completedAt
      cancelledAt
      transactionHash
      blockNumber
      gasUsed
      cancellationReason
    }
  }
`;

/**
 * Get user statistics
 */
export const GET_USER_STATS = `
  query GetUserStats($address: ID!) {
    user(id: $address) {
      id
      address
      totalSent
      totalReceived
      paymentsSentCount
      paymentsReceivedCount
      reputation
      isVerified
      firstTransactionAt
      lastTransactionAt
      ensName
      basename
    }
  }
`;

/**
 * Get user payment history (both sent and received)
 */
export const GET_USER_PAYMENT_HISTORY = `
  query GetUserPaymentHistory($address: ID!, $first: Int!) {
    user(id: $address) {
      paymentsSent(first: $first, orderBy: initiatedAt, orderDirection: desc) {
        id
        recipient
        amount
        currency
        status
        initiatedAt
        completedAt
      }
      paymentsReceived(first: $first, orderBy: initiatedAt, orderDirection: desc) {
        id
        sender
        amount
        currency
        status
        initiatedAt
        completedAt
      }
    }
  }
`;

/**
 * Get protocol statistics
 */
export const GET_PROTOCOL_STATS = `
  query GetProtocolStats {
    protocolStat(id: "1") {
      totalVolumeAllTime
      totalPaymentsAllTime
      totalFeesAllTime
      totalUniqueUsers
      totalCompletedPayments
      totalCancelledPayments
      averagePaymentAmount
      lastUpdated
    }
  }
`;

/**
 * Get daily statistics for a date range
 */
export const GET_DAILY_STATS = `
  query GetDailyStats($startDate: BigInt!, $endDate: BigInt!) {
    dailyStats(
      where: { date_gte: $startDate, date_lte: $endDate }
      orderBy: date
      orderDirection: desc
    ) {
      id
      date
      totalVolume
      totalPayments
      uniqueSenders
      uniqueRecipients
      averageAmount
      totalFees
      completedPayments
      cancelledPayments
    }
  }
`;

/**
 * Get currency statistics
 */
export const GET_CURRENCY_STATS = `
  query GetCurrencyStats {
    currencyStats(orderBy: totalVolume, orderDirection: desc) {
      id
      currency
      totalVolume
      totalPayments
      averageAmount
      lastUpdated
    }
  }
`;

/**
 * Get pending payments for a user
 */
export const GET_PENDING_PAYMENTS = `
  query GetPendingPayments($address: Bytes!) {
    payments(
      where: {
        sender: $address
        status: PENDING
      }
      orderBy: initiatedAt
      orderDirection: desc
    ) {
      id
      orderId
      recipient
      amount
      currency
      initiatedAt
      transactionHash
    }
  }
`;

/**
 * Search payments by transaction hash
 */
export const GET_PAYMENT_BY_TX_HASH = `
  query GetPaymentByTxHash($txHash: Bytes!) {
    payments(where: { transactionHash: $txHash }) {
      id
      orderId
      sender
      recipient
      amount
      currency
      status
      initiatedAt
      completedAt
      transactionHash
    }
  }
`;
