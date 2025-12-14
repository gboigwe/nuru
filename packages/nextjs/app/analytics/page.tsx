"use client";

/**
 * Analytics Dashboard Page
 *
 * Main analytics dashboard showing spending insights,
 * budget tracking, savings comparison, and financial health
 */

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { AnalyticsDashboardData, TimePeriod } from "~~/types/analytics";
import { analyticsService } from "~~/services/analytics";

// Dynamic imports for analytics components to reduce initial bundle size
const SpendingOverviewCard = dynamic(() => import("~~/components/analytics/SpendingOverviewCard").then(mod => ({ default: mod.SpendingOverviewCard })), { ssr: false });
const BudgetTrackerCard = dynamic(() => import("~~/components/analytics/BudgetTrackerCard").then(mod => ({ default: mod.BudgetTrackerCard })), { ssr: false });
const SavingsComparisonCard = dynamic(() => import("~~/components/analytics/SavingsComparisonCard").then(mod => ({ default: mod.SavingsComparisonCard })), { ssr: false });
const RecipientAnalyticsCard = dynamic(() => import("~~/components/analytics/RecipientAnalyticsCard").then(mod => ({ default: mod.RecipientAnalyticsCard })), { ssr: false });
const GasUsageCard = dynamic(() => import("~~/components/analytics/GasUsageCard").then(mod => ({ default: mod.GasUsageCard })), { ssr: false });
const FinancialHealthCard = dynamic(() => import("~~/components/analytics/FinancialHealthCard").then(mod => ({ default: mod.FinancialHealthCard })), { ssr: false });

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>("30d");
  const [monthlyBudget, setMonthlyBudget] = useState<number>(1000);
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [period, monthlyBudget]);

  const loadAnalyticsData = async () => {
    setLoading(true);

    try {
      // In production, fetch real transaction data from The Graph
      // For now, we'll use mock data
      const mockTransactions = generateMockTransactions();

      const data = analyticsService.getAnalyticsDashboard(mockTransactions, monthlyBudget, period);

      setDashboardData(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock transaction generator (replace with real data)
  const generateMockTransactions = () => {
    const transactions = [];
    const now = Date.now();

    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      transactions.push({
        id: `tx-${i}`,
        timestamp,
        sender: "0x1234567890123456789012345678901234567890",
        recipient: `0x${Math.random().toString(16).slice(2, 42)}`,
        amount: (Math.random() * 100 + 10).toFixed(2),
        currency: "USDC",
        gasFee: (Math.random() * 0.001).toFixed(6),
        transactionHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        voiceCommand: `Send $${(Math.random() * 100 + 10).toFixed(0)} to recipient`,
      });
    }

    return transactions;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-error">
          <span>Failed to load analytics data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-base-content/60 mt-1">
            Track your spending, optimize costs, and improve financial health
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Period Filter */}
          <select
            className="select select-bordered select-sm"
            value={period}
            onChange={e => setPeriod(e.target.value as TimePeriod)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>

          {/* Budget Input */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-base-content/70">Budget:</label>
            <input
              type="number"
              className="input input-bordered input-sm w-32"
              value={monthlyBudget}
              onChange={e => setMonthlyBudget(parseFloat(e.target.value) || 0)}
              min="0"
              step="100"
            />
          </div>

          {/* Export Button (placeholder) */}
          <button className="btn btn-sm btn-outline">
            📊 Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Total Spent</div>
          <div className="stat-value text-2xl">${dashboardData.summary.totalSpent.toFixed(2)}</div>
          <div className="stat-desc">{dashboardData.summary.totalTransactions} transactions</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Gas Fees</div>
          <div className="stat-value text-2xl">${dashboardData.summary.totalGasFees.toFixed(4)}</div>
          <div className="stat-desc">Network costs</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Total Savings</div>
          <div className="stat-value text-2xl text-success">
            ${dashboardData.summary.totalSavings.toFixed(2)}
          </div>
          <div className="stat-desc">vs traditional services</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Health Score</div>
          <div className="stat-value text-2xl">{dashboardData.summary.healthScore}/100</div>
          <div className="stat-desc">{dashboardData.healthScore.rating}</div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Overview */}
        <SpendingOverviewCard data={dashboardData.spendingData} />

        {/* Budget Tracker */}
        <BudgetTrackerCard budget={dashboardData.budget} />

        {/* Savings Comparison */}
        <SavingsComparisonCard savings={dashboardData.savings} />

        {/* Recipient Analytics */}
        <RecipientAnalyticsCard recipients={dashboardData.recipients} />

        {/* Gas Usage */}
        <GasUsageCard gasPatterns={dashboardData.gasPatterns} />

        {/* Financial Health */}
        <FinancialHealthCard healthScore={dashboardData.healthScore} />
      </div>
    </div>
  );
}
