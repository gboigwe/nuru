"use client";

/**
 * Gas Usage Analytics Card Component
 *
 * Displays gas fee patterns by hour of day
 * Recommends optimal transaction times for gas savings
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { GasUsagePattern } from "~~/types/analytics";

interface GasUsageCardProps {
  gasPatterns: GasUsagePattern[];
}

export const GasUsageCard = ({ gasPatterns }: GasUsageCardProps) => {
  // Find cheapest hours
  const patternsWithActivity = gasPatterns.filter(p => p.transactionCount > 0);
  const sortedByGas = [...patternsWithActivity].sort((a, b) => a.averageGasFee - b.averageGasFee);
  const cheapestHours = sortedByGas.slice(0, 3);
  const mostExpensiveHours = sortedByGas.slice(-3).reverse();

  // Format chart data
  const chartData = gasPatterns.map(pattern => ({
    hour: `${pattern.hour.toString().padStart(2, "0")}:00`,
    hourNum: pattern.hour,
    gasFee: parseFloat((pattern.averageGasFee * 1000).toFixed(4)), // Convert to more readable scale
    count: pattern.transactionCount,
  }));

  // Determine color for bars based on gas fee
  const getBarColor = (hourNum: number) => {
    const cheapestHour = cheapestHours[0]?.hour;
    const mostExpensiveHour = mostExpensiveHours[0]?.hour;

    if (hourNum === cheapestHour) return "#10b981"; // Green for cheapest
    if (hourNum === mostExpensiveHour) return "#ef4444"; // Red for most expensive
    return "#3b82f6"; // Blue for others
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-lg">Gas Usage Patterns</h2>

        {patternsWithActivity.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-base-content/60">
            No gas usage data available
          </div>
        ) : (
          <>
            {/* Gas Fee Chart */}
            <div className="w-full h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10 }}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{ value: "Gas Fee (Gwei)", angle: -90, position: "insideLeft", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--b1))",
                      border: "1px solid hsl(var(--bc) / 0.2)",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "gasFee") return [value.toFixed(4) + " Gwei", "Avg Gas Fee"];
                      return [value, "Transactions"];
                    }}
                  />
                  <Bar dataKey="gasFee" name="Avg Gas Fee" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.hourNum)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {/* Cheapest Times */}
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-success text-lg">✓</span>
                  <h3 className="font-semibold text-sm">Best Times (Cheapest Gas)</h3>
                </div>
                <div className="space-y-1">
                  {cheapestHours.map(pattern => (
                    <div key={pattern.hour} className="flex items-center justify-between text-sm">
                      <span className="font-mono">
                        {pattern.hour.toString().padStart(2, "0")}:00
                      </span>
                      <span className="text-success font-semibold">
                        {(pattern.averageGasFee * 1000).toFixed(4)} Gwei
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Expensive Times */}
              <div className="bg-error/10 border border-error/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-error text-lg">⚠</span>
                  <h3 className="font-semibold text-sm">Avoid Times (High Gas)</h3>
                </div>
                <div className="space-y-1">
                  {mostExpensiveHours.map(pattern => (
                    <div key={pattern.hour} className="flex items-center justify-between text-sm">
                      <span className="font-mono">
                        {pattern.hour.toString().padStart(2, "0")}:00
                      </span>
                      <span className="text-error font-semibold">
                        {(pattern.averageGasFee * 1000).toFixed(4)} Gwei
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Savings Tip */}
            <div className="alert alert-info mt-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">💡 Gas Optimization Tip</p>
                <p className="text-xs">
                  Send transactions during {cheapestHours[0]?.hour.toString().padStart(2, "0")}:00-
                  {cheapestHours[2]?.hour.toString().padStart(2, "0")}:00 to save up to{" "}
                  {mostExpensiveHours[0] && cheapestHours[0]
                    ? (
                        ((mostExpensiveHours[0].averageGasFee - cheapestHours[0].averageGasFee) /
                          mostExpensiveHours[0].averageGasFee) *
                        100
                      ).toFixed(0)
                    : "50"}
                  % on gas fees.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
