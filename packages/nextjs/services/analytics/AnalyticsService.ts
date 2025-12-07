/**
 * Analytics Service
 *
 * Calculates and processes analytics data for the dashboard
 * Includes spending patterns, budget tracking, savings comparison,
 * recipient analytics, gas optimization, and financial health scoring
 */

import type {
  AnalyticsTransaction,
  SpendingDataPoint,
  BudgetData,
  SavingsComparison,
  RecipientAnalytics,
  GasUsagePattern,
  FinancialHealthScore,
  AnalyticsSummary,
  AnalyticsDashboardData,
  TimePeriod,
} from "~~/types/analytics";

/**
 * Analytics Service Class
 */
class AnalyticsServiceClass {
  /**
   * Get complete analytics dashboard data
   *
   * @param transactions - User's transaction history
   * @param monthlyBudget - User's monthly budget
   * @param period - Time period filter
   * @returns Complete dashboard data
   */
  getAnalyticsDashboard(
    transactions: AnalyticsTransaction[],
    monthlyBudget: number,
    period: TimePeriod = "30d",
  ): AnalyticsDashboardData {
    const filteredTxs = this.filterByPeriod(transactions, period);

    return {
      summary: this.calculateSummary(filteredTxs),
      spendingData: this.calculateSpendingData(filteredTxs),
      budget: this.calculateBudgetData(filteredTxs, monthlyBudget),
      savings: this.calculateSavingsComparison(filteredTxs),
      recipients: this.calculateRecipientAnalytics(filteredTxs),
      gasPatterns: this.calculateGasPatterns(filteredTxs),
      healthScore: this.calculateFinancialHealth(filteredTxs, monthlyBudget),
      transactions: filteredTxs,
    };
  }

  /**
   * Filter transactions by time period
   */
  private filterByPeriod(transactions: AnalyticsTransaction[], period: TimePeriod): AnalyticsTransaction[] {
    if (period === "all") {
      return transactions;
    }

    const now = Date.now();
    const periodMap: Record<Exclude<TimePeriod, "all">, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };

    const cutoff = now - periodMap[period];

    return transactions.filter(tx => new Date(tx.timestamp).getTime() >= cutoff);
  }

  /**
   * Calculate analytics summary
   */
  private calculateSummary(transactions: AnalyticsTransaction[]): AnalyticsSummary {
    const totalSpent = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const totalGasFees = transactions.reduce((sum, tx) => sum + parseFloat(tx.gasFee), 0);

    const recipients = this.calculateRecipientAnalytics(transactions);
    const savings = this.calculateSavingsComparison(transactions);
    const health = this.calculateFinancialHealth(transactions, 0);

    return {
      totalTransactions: transactions.length,
      totalSpent,
      totalGasFees,
      averageTransactionSize: transactions.length > 0 ? totalSpent / transactions.length : 0,
      totalSavings: savings.totalSavings,
      topRecipient: recipients[0] || null,
      healthScore: health.score,
    };
  }

  /**
   * Calculate spending data by time period
   */
  private calculateSpendingData(transactions: AnalyticsTransaction[]): SpendingDataPoint[] {
    const dataMap = new Map<string, SpendingDataPoint>();

    transactions.forEach(tx => {
      const date = new Date(tx.timestamp).toISOString().split("T")[0];
      const amount = parseFloat(tx.amount);
      const gasFee = parseFloat(tx.gasFee);

      if (dataMap.has(date)) {
        const existing = dataMap.get(date)!;
        existing.amount += amount;
        existing.count += 1;
        existing.gasFees += gasFee;
      } else {
        dataMap.set(date, {
          date,
          amount,
          count: 1,
          gasFees: gasFee,
        });
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate budget tracking data
   */
  private calculateBudgetData(transactions: AnalyticsTransaction[], monthlyBudget: number): BudgetData {
    // Get current month transactions
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthTransactions = transactions.filter(
      tx => new Date(tx.timestamp) >= currentMonthStart,
    );

    const spent = monthTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const remaining = monthlyBudget - spent;
    const percentUsed = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0;

    // Calculate days remaining in month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - now.getDate();

    // Calculate daily average and projected spend
    const daysElapsed = now.getDate();
    const dailyAverage = daysElapsed > 0 ? spent / daysElapsed : 0;
    const projectedSpend = dailyAverage * daysInMonth;

    return {
      monthlyBudget,
      spent,
      remaining,
      percentUsed,
      daysRemaining,
      dailyAverage,
      projectedSpend,
    };
  }

  /**
   * Calculate savings comparison with traditional services
   */
  private calculateSavingsComparison(transactions: AnalyticsTransaction[]): SavingsComparison {
    const totalAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    // Nuru cost (only gas fees)
    const nuruCost = transactions.reduce((sum, tx) => sum + parseFloat(tx.gasFee), 0);

    // Traditional service costs (percentage-based fees + fixed fees)
    // Western Union: ~5-7% + $5 fixed fee per transaction
    const westernUnionCost = transactions.reduce((sum, tx) => {
      const amount = parseFloat(tx.amount);
      return sum + amount * 0.06 + 5;
    }, 0);

    // MoneyGram: ~4-6% + $4 fixed fee
    const moneyGramCost = transactions.reduce((sum, tx) => {
      const amount = parseFloat(tx.amount);
      return sum + amount * 0.05 + 4;
    }, 0);

    // Bank Transfer: ~3-4% + $15-25 fixed fee
    const bankTransferCost = transactions.reduce((sum, tx) => {
      const amount = parseFloat(tx.amount);
      return sum + amount * 0.035 + 20;
    }, 0);

    // Average of traditional services
    const averageTraditionalCost = (westernUnionCost + moneyGramCost + bankTransferCost) / 3;
    const totalSavings = averageTraditionalCost - nuruCost;
    const savingsPercentage = averageTraditionalCost > 0 ? (totalSavings / averageTraditionalCost) * 100 : 0;

    return {
      nuruCost,
      westernUnionCost,
      moneyGramCost,
      bankTransferCost,
      totalSavings,
      savingsPercentage,
    };
  }

  /**
   * Calculate recipient analytics
   */
  private calculateRecipientAnalytics(transactions: AnalyticsTransaction[]): RecipientAnalytics[] {
    const recipientMap = new Map<string, RecipientAnalytics>();
    const totalAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    transactions.forEach(tx => {
      const amount = parseFloat(tx.amount);

      if (recipientMap.has(tx.recipient)) {
        const existing = recipientMap.get(tx.recipient)!;
        existing.totalSent += amount;
        existing.transactionCount += 1;
        existing.averageAmount = existing.totalSent / existing.transactionCount;

        // Update last transaction if newer
        if (new Date(tx.timestamp) > new Date(existing.lastTransaction)) {
          existing.lastTransaction = tx.timestamp;
        }
      } else {
        recipientMap.set(tx.recipient, {
          address: tx.recipient,
          totalSent: amount,
          transactionCount: 1,
          averageAmount: amount,
          lastTransaction: tx.timestamp,
          percentage: 0, // Will calculate after
        });
      }
    });

    // Calculate percentages and sort
    const recipients = Array.from(recipientMap.values());
    recipients.forEach(recipient => {
      recipient.percentage = totalAmount > 0 ? (recipient.totalSent / totalAmount) * 100 : 0;
    });

    return recipients.sort((a, b) => b.totalSent - a.totalSent);
  }

  /**
   * Calculate gas usage patterns
   */
  private calculateGasPatterns(transactions: AnalyticsTransaction[]): GasUsagePattern[] {
    const hourlyMap = new Map<number, { totalGas: number; count: number }>();

    transactions.forEach(tx => {
      const hour = new Date(tx.timestamp).getHours();
      const gasFee = parseFloat(tx.gasFee);

      if (hourlyMap.has(hour)) {
        const existing = hourlyMap.get(hour)!;
        existing.totalGas += gasFee;
        existing.count += 1;
      } else {
        hourlyMap.set(hour, { totalGas: gasFee, count: 1 });
      }
    });

    const patterns: GasUsagePattern[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const data = hourlyMap.get(hour);

      if (data) {
        patterns.push({
          hour,
          averageGasFee: data.totalGas / data.count,
          transactionCount: data.count,
        });
      } else {
        patterns.push({
          hour,
          averageGasFee: 0,
          transactionCount: 0,
        });
      }
    }

    return patterns;
  }

  /**
   * Calculate financial health score (0-100)
   */
  private calculateFinancialHealth(
    transactions: AnalyticsTransaction[],
    monthlyBudget: number,
  ): FinancialHealthScore {
    // Factor 1: Budget adherence (0-25 points)
    const budgetData = this.calculateBudgetData(transactions, monthlyBudget);
    let budgetAdherence = 0;

    if (monthlyBudget > 0) {
      if (budgetData.percentUsed <= 80) {
        budgetAdherence = 25;
      } else if (budgetData.percentUsed <= 100) {
        budgetAdherence = 15;
      } else if (budgetData.percentUsed <= 120) {
        budgetAdherence = 5;
      }
    } else {
      budgetAdherence = 15; // Neutral if no budget set
    }

    // Factor 2: Gas optimization (0-25 points)
    const gasPatterns = this.calculateGasPatterns(transactions);
    const avgGas = gasPatterns.reduce((sum, p) => sum + p.averageGasFee, 0) / 24;

    // Find cheapest hours (typically late night/early morning)
    const cheapestHours = gasPatterns
      .filter(p => p.transactionCount > 0)
      .sort((a, b) => a.averageGasFee - b.averageGasFee)
      .slice(0, 6)
      .map(p => p.hour);

    const optimizedTxs = transactions.filter(tx =>
      cheapestHours.includes(new Date(tx.timestamp).getHours()),
    );

    const gasOptimization = transactions.length > 0 ? (optimizedTxs.length / transactions.length) * 25 : 15;

    // Factor 3: Transaction frequency (0-25 points)
    // Penalize too frequent small transactions
    const avgTxSize = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / transactions.length;
    let transactionFrequency = 15;

    if (avgTxSize > 100) {
      transactionFrequency = 25; // Good: Batching transactions
    } else if (avgTxSize > 50) {
      transactionFrequency = 20;
    } else if (avgTxSize > 20) {
      transactionFrequency = 15;
    } else {
      transactionFrequency = 10; // Too many small transactions
    }

    // Factor 4: Savings rate (0-25 points)
    const savings = this.calculateSavingsComparison(transactions);
    let savingsRate = 0;

    if (savings.savingsPercentage >= 90) {
      savingsRate = 25;
    } else if (savings.savingsPercentage >= 80) {
      savingsRate = 20;
    } else if (savings.savingsPercentage >= 70) {
      savingsRate = 15;
    } else if (savings.savingsPercentage >= 50) {
      savingsRate = 10;
    } else {
      savingsRate = 5;
    }

    // Calculate total score
    const score = Math.round(budgetAdherence + gasOptimization + transactionFrequency + savingsRate);

    // Determine rating
    let rating: FinancialHealthScore["rating"];
    if (score >= 80) rating = "Excellent";
    else if (score >= 60) rating = "Good";
    else if (score >= 40) rating = "Fair";
    else rating = "Poor";

    // Generate recommendations
    const recommendations: string[] = [];

    if (budgetData.percentUsed > 100) {
      recommendations.push("You've exceeded your monthly budget. Consider adjusting your spending or increasing your budget.");
    }

    if (gasOptimization < 15) {
      const cheapestTime = gasPatterns
        .filter(p => p.transactionCount > 0)
        .sort((a, b) => a.averageGasFee - b.averageGasFee)[0];

      if (cheapestTime) {
        recommendations.push(`Consider sending transactions around ${cheapestTime.hour}:00 for lower gas fees.`);
      }
    }

    if (avgTxSize < 20) {
      recommendations.push("Try batching smaller payments to save on gas fees.");
    }

    if (savings.savingsPercentage < 70) {
      recommendations.push(`You're saving ${savings.savingsPercentage.toFixed(0)}% vs traditional services. Nuru typically saves 90%+.`);
    }

    if (recommendations.length === 0) {
      recommendations.push("Great job! Your financial habits are optimized.");
    }

    return {
      score,
      rating,
      factors: {
        budgetAdherence,
        gasOptimization,
        transactionFrequency,
        savingsRate,
      },
      recommendations,
    };
  }
}

// Singleton instance
export const analyticsService = new AnalyticsServiceClass();
