"use client";

/**
 * Recipient Analytics Card Component
 *
 * Displays top recipients with pie chart and list
 * Shows payment frequency and amounts per recipient
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { RecipientAnalytics } from "~~/types/analytics";

interface RecipientAnalyticsCardProps {
  recipients: RecipientAnalytics[];
  maxDisplay?: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const RecipientAnalyticsCard = ({ recipients, maxDisplay = 5 }: RecipientAnalyticsCardProps) => {
  // Get top recipients
  const topRecipients = recipients.slice(0, maxDisplay);
  const otherRecipients = recipients.slice(maxDisplay);

  // Calculate "Others" total
  const othersTotal = otherRecipients.reduce((sum, r) => sum + r.totalSent, 0);

  // Format chart data
  const chartData = [
    ...topRecipients.map((r, i) => ({
      name: `${r.address.slice(0, 6)}...${r.address.slice(-4)}`,
      value: parseFloat(r.totalSent.toFixed(2)),
      percentage: r.percentage,
      color: COLORS[i % COLORS.length],
    })),
  ];

  if (othersTotal > 0) {
    const othersPercentage = otherRecipients.reduce((sum, r) => sum + r.percentage, 0);
    chartData.push({
      name: "Others",
      value: parseFloat(othersTotal.toFixed(2)),
      percentage: othersPercentage,
      color: "#6b7280",
    });
  }

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-lg">Recipient Analytics</h2>

        {recipients.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-base-content/60">
            No recipient data available
          </div>
        ) : (
          <>
            {/* Pie Chart */}
            <div className="w-full h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percentage }) => `${percentage.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--b1))",
                      border: "1px solid hsl(var(--bc) / 0.2)",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Total Sent"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Recipients List */}
            <div className="mt-4">
              <h3 className="font-semibold text-sm mb-3">Top Recipients</h3>
              <div className="space-y-2">
                {topRecipients.map((recipient, index) => (
                  <div
                    key={recipient.address}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-mono text-sm font-semibold">
                          {recipient.address.slice(0, 8)}...{recipient.address.slice(-6)}
                        </p>
                        <p className="text-xs text-base-content/60">
                          {recipient.transactionCount} transaction{recipient.transactionCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${recipient.totalSent.toFixed(2)}</p>
                      <p className="text-xs text-base-content/60">
                        Avg: ${recipient.averageAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Others Summary */}
              {otherRecipients.length > 0 && (
                <div className="mt-3 p-3 bg-base-200/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-base-content/70">
                      + {otherRecipients.length} other recipient{otherRecipients.length !== 1 ? "s" : ""}
                    </span>
                    <span className="font-semibold">${othersTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
