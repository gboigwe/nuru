"use client";

/**
 * Financial Health Score Card Component
 *
 * Displays 0-100 financial health score with breakdown
 * Shows contributing factors and recommendations
 */

import { RadialBarChart, RadialBar, ResponsiveContainer, Legend, PolarAngleAxis } from "recharts";
import type { FinancialHealthScore } from "~~/types/analytics";

interface FinancialHealthCardProps {
  healthScore: FinancialHealthScore;
}

export const FinancialHealthCard = ({ healthScore }: FinancialHealthCardProps) => {
  const { score, rating, factors, recommendations } = healthScore;

  // Determine color based on rating
  const getRatingColor = () => {
    switch (rating) {
      case "Excellent":
        return { bg: "bg-success", text: "text-success", fill: "#10b981" };
      case "Good":
        return { bg: "bg-info", text: "text-info", fill: "#3b82f6" };
      case "Fair":
        return { bg: "bg-warning", text: "text-warning", fill: "#f59e0b" };
      case "Poor":
        return { bg: "bg-error", text: "text-error", fill: "#ef4444" };
    }
  };

  const colors = getRatingColor();

  // Format chart data
  const chartData = [
    {
      name: "Score",
      value: score,
      fill: colors.fill,
    },
  ];

  // Format factors for display
  const factorsList = [
    { name: "Budget Adherence", value: factors.budgetAdherence, max: 25 },
    { name: "Gas Optimization", value: factors.gasOptimization, max: 25 },
    { name: "Transaction Frequency", value: factors.transactionFrequency, max: 25 },
    { name: "Savings Rate", value: factors.savingsRate, max: 25 },
  ];

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-lg">Financial Health Score</h2>

        {/* Score Display */}
        <div className="flex items-center justify-center mt-4">
          <div className="relative">
            {/* Radial Chart */}
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="100%"
                  data={chartData}
                  startAngle={180}
                  endAngle={0}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                    fill={colors.fill}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            {/* Score Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className={`text-5xl font-bold ${colors.text}`}>{score}</p>
              <p className="text-sm text-base-content/60">out of 100</p>
            </div>
          </div>
        </div>

        {/* Rating Badge */}
        <div className="flex justify-center mt-4">
          <div className={`badge badge-lg ${colors.bg} text-white font-semibold px-6 py-4`}>
            {rating}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mt-6">
          <h3 className="font-semibold text-sm mb-3">Score Breakdown</h3>
          <div className="space-y-3">
            {factorsList.map(factor => (
              <div key={factor.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-base-content/70">{factor.name}</span>
                  <span className="text-sm font-semibold">
                    {factor.value.toFixed(0)}/{factor.max}
                  </span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-2">
                  <div
                    className={`h-full ${colors.bg} rounded-full transition-all duration-300`}
                    style={{ width: `${(factor.value / factor.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6">
          <h3 className="font-semibold text-sm mb-3">Recommendations</h3>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-base-200 rounded-lg text-sm"
              >
                <span className="text-lg flex-shrink-0">
                  {rating === "Excellent" ? "✨" : "💡"}
                </span>
                <p className="text-base-content/80">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="alert alert-info mt-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs">
              Your financial health score is calculated based on budget adherence, gas optimization,
              transaction patterns, and savings compared to traditional services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
