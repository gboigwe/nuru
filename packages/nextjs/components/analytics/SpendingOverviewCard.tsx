"use client";

/**
 * Spending Overview Card Component
 *
 * Displays spending trends over time with line/area chart
 * Shows total spent, transaction count, and gas fees
 */

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { SpendingDataPoint } from "~~/types/analytics";

interface SpendingOverviewCardProps {
  data: SpendingDataPoint[];
  chartType?: "line" | "area";
}

export const SpendingOverviewCard = ({ data, chartType = "area" }: SpendingOverviewCardProps) => {
  // Calculate totals
  const totalSpent = data.reduce((sum, point) => sum + point.amount, 0);
  const totalTransactions = data.reduce((sum, point) => sum + point.count, 0);
  const totalGasFees = data.reduce((sum, point) => sum + point.gasFees, 0);

  // Format chart data
  const chartData = data.map(point => ({
    date: new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    amount: parseFloat(point.amount.toFixed(2)),
    gasFees: parseFloat(point.gasFees.toFixed(4)),
  }));

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-lg">Spending Overview</h2>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-2 mb-4">
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-xs">Total Spent</div>
            <div className="stat-value text-xl">${totalSpent.toFixed(2)}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-xs">Transactions</div>
            <div className="stat-value text-xl">{totalTransactions}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-xs">Gas Fees</div>
            <div className="stat-value text-xl">${totalGasFees.toFixed(4)}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-64 mt-4">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-base-content/60">
              No spending data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--b1))",
                      border: "1px solid hsl(var(--bc) / 0.2)",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                    name="Amount ($)"
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--b1))",
                      border: "1px solid hsl(var(--bc) / 0.2)",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Amount ($)"
                  />
                  <Line
                    type="monotone"
                    dataKey="gasFees"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Gas Fees ($)"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
