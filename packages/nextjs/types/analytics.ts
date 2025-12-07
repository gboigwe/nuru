/**
 * Analytics Types
 *
 * Type definitions for analytics dashboard data structures
 */

/**
 * Transaction for analytics
 */
export interface AnalyticsTransaction {
  id: string;
  timestamp: string;
  sender: string;
  recipient: string;
  amount: string;
  currency: string;
  gasFee: string;
  transactionHash: string;
  voiceCommand?: string;
  receiptCid?: string;
}

/**
 * Spending by time period
 */
export interface SpendingDataPoint {
  date: string;
  amount: number;
  count: number;
  gasFees: number;
}

/**
 * Budget tracking
 */
export interface BudgetData {
  monthlyBudget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  daysRemaining: number;
  dailyAverage: number;
  projectedSpend: number;
}

/**
 * Savings comparison with traditional services
 */
export interface SavingsComparison {
  nuruCost: number;
  westernUnionCost: number;
  moneyGramCost: number;
  bankTransferCost: number;
  totalSavings: number;
  savingsPercentage: number;
}

/**
 * Recipient analytics
 */
export interface RecipientAnalytics {
  address: string;
  name?: string;
  totalSent: number;
  transactionCount: number;
  averageAmount: number;
  lastTransaction: string;
  percentage: number;
}

/**
 * Gas usage pattern
 */
export interface GasUsagePattern {
  hour: number;
  averageGasFee: number;
  transactionCount: number;
  dayOfWeek?: string;
}

/**
 * Financial health score
 */
export interface FinancialHealthScore {
  score: number; // 0-100
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  factors: {
    budgetAdherence: number;
    gasOptimization: number;
    transactionFrequency: number;
    savingsRate: number;
  };
  recommendations: string[];
}

/**
 * Analytics summary
 */
export interface AnalyticsSummary {
  totalTransactions: number;
  totalSpent: number;
  totalGasFees: number;
  averageTransactionSize: number;
  totalSavings: number;
  topRecipient: RecipientAnalytics | null;
  healthScore: number;
}

/**
 * Time period filter
 */
export type TimePeriod = "7d" | "30d" | "90d" | "1y" | "all";

/**
 * Export format
 */
export type ExportFormat = "csv" | "pdf" | "excel";

/**
 * Analytics dashboard data
 */
export interface AnalyticsDashboardData {
  summary: AnalyticsSummary;
  spendingData: SpendingDataPoint[];
  budget: BudgetData;
  savings: SavingsComparison;
  recipients: RecipientAnalytics[];
  gasPatterns: GasUsagePattern[];
  healthScore: FinancialHealthScore;
  transactions: AnalyticsTransaction[];
}
