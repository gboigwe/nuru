import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import {
  PaymentInitiated,
  PaymentCompleted,
  PaymentCancelled,
  ReputationUpdated,
} from "../generated/VoiceRemittance/VoiceRemittance";
import {
  Payment,
  User,
  DailyStat,
  ProtocolStat,
  CurrencyStat,
} from "../generated/schema";

/**
 * Constants
 */
const PROTOCOL_STAT_ID = "1";
const SECONDS_PER_DAY = BigInt.fromI32(86400);

/**
 * Helper: Load or create User entity
 */
function loadOrCreateUser(address: Address, timestamp: BigInt): User {
  let user = User.load(address.toHexString());

  if (user == null) {
    user = new User(address.toHexString());
    user.address = address;
    user.totalSent = BigInt.fromI32(0);
    user.totalReceived = BigInt.fromI32(0);
    user.paymentsSentCount = 0;
    user.paymentsReceivedCount = 0;
    user.reputation = BigInt.fromI32(500); // Default reputation 500/1000
    user.isVerified = false;
    user.firstTransactionAt = timestamp;
    user.lastTransactionAt = timestamp;
    user.ensName = null;
    user.basename = null;
    user.save();

    // Update protocol stats
    let protocolStat = loadOrCreateProtocolStat();
    protocolStat.totalUniqueUsers = protocolStat.totalUniqueUsers + 1;
    protocolStat.save();
  }

  return user;
}

/**
 * Helper: Load or create ProtocolStat entity
 */
function loadOrCreateProtocolStat(): ProtocolStat {
  let stat = ProtocolStat.load(PROTOCOL_STAT_ID);

  if (stat == null) {
    stat = new ProtocolStat(PROTOCOL_STAT_ID);
    stat.totalVolumeAllTime = BigInt.fromI32(0);
    stat.totalPaymentsAllTime = 0;
    stat.totalFeesAllTime = BigInt.fromI32(0);
    stat.totalUniqueUsers = 0;
    stat.totalCompletedPayments = 0;
    stat.totalCancelledPayments = 0;
    stat.averagePaymentAmount = BigInt.fromI32(0);
    stat.lastUpdated = BigInt.fromI32(0);
    stat.save();
  }

  return stat;
}

/**
 * Helper: Load or create DailyStat entity
 */
function loadOrCreateDailyStat(timestamp: BigInt): DailyStat {
  const dayTimestamp = timestamp.div(SECONDS_PER_DAY).times(SECONDS_PER_DAY);
  const dayId = dayTimestamp.toString();

  let stat = DailyStat.load(dayId);

  if (stat == null) {
    stat = new DailyStat(dayId);
    stat.date = dayTimestamp;
    stat.totalVolume = BigInt.fromI32(0);
    stat.totalPayments = 0;
    stat.uniqueSenders = 0;
    stat.uniqueRecipients = 0;
    stat.averageAmount = BigInt.fromI32(0);
    stat.totalFees = BigInt.fromI32(0);
    stat.completedPayments = 0;
    stat.cancelledPayments = 0;
    stat.save();
  }

  return stat;
}

/**
 * Helper: Load or create CurrencyStat entity
 */
function loadOrCreateCurrencyStat(currency: string, timestamp: BigInt): CurrencyStat {
  let stat = CurrencyStat.load(currency);

  if (stat == null) {
    stat = new CurrencyStat(currency);
    stat.currency = currency;
    stat.totalVolume = BigInt.fromI32(0);
    stat.totalPayments = 0;
    stat.averageAmount = BigInt.fromI32(0);
    stat.lastUpdated = timestamp;
    stat.save();
  }

  return stat;
}

/**
 * Extract currency from metadata JSON
 */
function extractCurrency(metadata: string): string {
  // Default to USDC if metadata parsing fails
  // In production, you would parse the JSON string properly
  return "USDC";
}

/**
 * Handler for PaymentInitiated event
 */
export function handlePaymentInitiated(event: PaymentInitiated): void {
  const orderId = event.params.orderId;
  const sender = event.params.sender;
  const recipient = event.params.recipient;
  const amount = event.params.amount;
  const voiceHash = event.params.voiceHash;
  const metadata = event.params.metadata;
  const timestamp = event.block.timestamp;

  // Create Payment entity
  let payment = new Payment(orderId.toString());
  payment.orderId = orderId;
  payment.sender = sender;
  payment.recipient = recipient;
  payment.amount = amount;
  payment.currency = extractCurrency(metadata);
  payment.platformFee = BigInt.fromI32(0); // Will be updated on completion
  payment.netAmount = amount; // Will be updated on completion
  payment.voiceHash = voiceHash;
  payment.metadata = metadata;
  payment.status = "PENDING";
  payment.initiatedAt = timestamp;
  payment.completedAt = null;
  payment.cancelledAt = null;
  payment.transactionHash = event.transaction.hash;
  payment.blockNumber = event.block.number;
  payment.gasUsed = null;
  payment.cancellationReason = null;
  payment.ensName = null;
  payment.basename = null;

  // Load or create users
  let senderUser = loadOrCreateUser(sender, timestamp);
  let recipientUser = loadOrCreateUser(recipient, timestamp);

  payment.senderUser = senderUser.id;
  payment.recipientUser = recipientUser.id;

  payment.save();

  // Update sender stats
  senderUser.lastTransactionAt = timestamp;
  senderUser.save();

  // Update daily stats
  let dailyStat = loadOrCreateDailyStat(timestamp);
  dailyStat.totalPayments = dailyStat.totalPayments + 1;
  dailyStat.save();

  // Update protocol stats
  let protocolStat = loadOrCreateProtocolStat();
  protocolStat.totalPaymentsAllTime = protocolStat.totalPaymentsAllTime + 1;
  protocolStat.lastUpdated = timestamp;
  protocolStat.save();
}

/**
 * Handler for PaymentCompleted event
 */
export function handlePaymentCompleted(event: PaymentCompleted): void {
  const orderId = event.params.orderId;
  const amount = event.params.amount;
  const fee = event.params.fee;
  const timestamp = event.block.timestamp;

  // Load payment
  let payment = Payment.load(orderId.toString());
  if (payment == null) {
    return;
  }

  // Update payment
  payment.status = "COMPLETED";
  payment.completedAt = timestamp;
  payment.platformFee = fee;
  payment.netAmount = amount.minus(fee);
  payment.gasUsed = event.transaction.gasUsed;
  payment.save();

  // Load users
  let senderUser = User.load(payment.senderUser);
  let recipientUser = User.load(payment.recipientUser);

  if (senderUser != null) {
    senderUser.totalSent = senderUser.totalSent.plus(amount);
    senderUser.paymentsSentCount = senderUser.paymentsSentCount + 1;
    senderUser.save();
  }

  if (recipientUser != null) {
    recipientUser.totalReceived = recipientUser.totalReceived.plus(amount);
    recipientUser.paymentsReceivedCount = recipientUser.paymentsReceivedCount + 1;
    recipientUser.save();
  }

  // Update daily stats
  let dailyStat = loadOrCreateDailyStat(timestamp);
  dailyStat.totalVolume = dailyStat.totalVolume.plus(amount);
  dailyStat.totalFees = dailyStat.totalFees.plus(fee);
  dailyStat.completedPayments = dailyStat.completedPayments + 1;

  // Calculate average
  if (dailyStat.completedPayments > 0) {
    dailyStat.averageAmount = dailyStat.totalVolume.div(
      BigInt.fromI32(dailyStat.completedPayments)
    );
  }
  dailyStat.save();

  // Update protocol stats
  let protocolStat = loadOrCreateProtocolStat();
  protocolStat.totalVolumeAllTime = protocolStat.totalVolumeAllTime.plus(amount);
  protocolStat.totalFeesAllTime = protocolStat.totalFeesAllTime.plus(fee);
  protocolStat.totalCompletedPayments = protocolStat.totalCompletedPayments + 1;

  // Calculate average
  if (protocolStat.totalCompletedPayments > 0) {
    protocolStat.averagePaymentAmount = protocolStat.totalVolumeAllTime.div(
      BigInt.fromI32(protocolStat.totalCompletedPayments)
    );
  }
  protocolStat.lastUpdated = timestamp;
  protocolStat.save();

  // Update currency stats
  let currencyStat = loadOrCreateCurrencyStat(payment.currency, timestamp);
  currencyStat.totalVolume = currencyStat.totalVolume.plus(amount);
  currencyStat.totalPayments = currencyStat.totalPayments + 1;

  if (currencyStat.totalPayments > 0) {
    currencyStat.averageAmount = currencyStat.totalVolume.div(
      BigInt.fromI32(currencyStat.totalPayments)
    );
  }
  currencyStat.lastUpdated = timestamp;
  currencyStat.save();
}

/**
 * Handler for PaymentCancelled event
 */
export function handlePaymentCancelled(event: PaymentCancelled): void {
  const orderId = event.params.orderId;
  const reason = event.params.reason;
  const timestamp = event.block.timestamp;

  // Load payment
  let payment = Payment.load(orderId.toString());
  if (payment == null) {
    return;
  }

  // Update payment
  payment.status = "CANCELLED";
  payment.cancelledAt = timestamp;
  payment.cancellationReason = reason;
  payment.save();

  // Update daily stats
  let dailyStat = loadOrCreateDailyStat(timestamp);
  dailyStat.cancelledPayments = dailyStat.cancelledPayments + 1;
  dailyStat.save();

  // Update protocol stats
  let protocolStat = loadOrCreateProtocolStat();
  protocolStat.totalCancelledPayments = protocolStat.totalCancelledPayments + 1;
  protocolStat.lastUpdated = timestamp;
  protocolStat.save();
}

/**
 * Handler for ReputationUpdated event
 */
export function handleReputationUpdated(event: ReputationUpdated): void {
  const userAddress = event.params.user;
  const newScore = event.params.newScore;
  const timestamp = event.block.timestamp;

  // Load user
  let user = User.load(userAddress.toHexString());
  if (user == null) {
    user = loadOrCreateUser(userAddress, timestamp);
  }

  // Update reputation
  user.reputation = newScore;
  user.save();
}
