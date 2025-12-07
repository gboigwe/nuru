"use client";

/**
 * Savings Comparison Card Component
 *
 * Compares Nuru costs vs traditional remittance services
 * Shows savings in dollar amount and percentage
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import type { SavingsComparison } from "~~/types/analytics";

interface SavingsComparisonCardProps {
  savings: SavingsComparison;
}

export const SavingsComparisonCard = ({ savings }: SavingsComparisonCardProps) => {
  const { nuruCost, westernUnionCost, moneyGramCost, bankTransferCost, totalSavings, savingsPercentage } = savings;

  // Format chart data
  const chartData = [
    { service: "Nuru", cost: parseFloat(nuruCost.toFixed(2)), color: "#3b82f6" },
    { service: "Western Union", cost: parseFloat(westernUnionCost.toFixed(2)), color: "#ef4444" },
    { service: "MoneyGram", cost: parseFloat(moneyGramCost.toFixed(2)), color: "#f59e0b" },
    { service: "Bank Transfer", cost: parseFloat(bankTransferCost.toFixed(2)), color: "#8b5cf6" },
  ];

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-lg">Cost Comparison</h2>

        {/* Savings Highlight */}
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">Total Savings vs Traditional Services</p>
              <p className="text-3xl font-bold text-success mt-1">${totalSavings.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <div className="badge badge-success badge-lg text-lg font-bold">
                {savingsPercentage.toFixed(0)}%
              </div>
              <p className="text-xs text-base-content/60 mt-1">Savings</p>
            </div>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="w-full h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="service" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--b1))",
                  border: "1px solid hsl(var(--bc) / 0.2)",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
              />
              <Legend />
              <Bar dataKey="cost" name="Total Fees" radius={[0, 8, 8, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-xs">Nuru Cost</div>
            <div className="stat-value text-lg text-success">${nuruCost.toFixed(2)}</div>
            <div className="stat-desc text-xs">Gas fees only</div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-xs">Average Traditional</div>
            <div className="stat-value text-lg text-error">
              ${((westernUnionCost + moneyGramCost + bankTransferCost) / 3).toFixed(2)}
            </div>
            <div className="stat-desc text-xs">5-7% + fixed fees</div>
          </div>
        </div>

        {/* Info */}
        <div className="alert alert-info mt-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">Why Nuru is Cheaper</p>
            <p className="text-xs">
              Traditional services charge 3-7% fees plus $4-25 fixed fees per transaction.
              Nuru only charges blockchain gas fees (typically under $0.10 on BASE).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
