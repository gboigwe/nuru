"use client";

/**
 * Budget Tracker Card Component
 *
 * Shows monthly budget progress with remaining balance
 * Includes projection and daily average spending
 */

import type { BudgetData } from "~~/types/analytics";

interface BudgetTrackerCardProps {
  budget: BudgetData;
}

export const BudgetTrackerCard = ({ budget }: BudgetTrackerCardProps) => {
  const { monthlyBudget, spent, remaining, percentUsed, daysRemaining, dailyAverage, projectedSpend } = budget;

  // Determine status color
  const getStatusColor = () => {
    if (percentUsed >= 100) return "error";
    if (percentUsed >= 80) return "warning";
    return "success";
  };

  const statusColor = getStatusColor();

  // Determine if user is on track
  const isOnTrack = projectedSpend <= monthlyBudget;

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-lg">Budget Tracker</h2>

        {/* Budget Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm text-base-content/70">Monthly Budget</span>
            <span className="text-lg font-bold">${monthlyBudget.toFixed(2)}</span>
          </div>

          <div className="w-full bg-base-300 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full bg-${statusColor} transition-all duration-300 flex items-center justify-end pr-2`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            >
              {percentUsed > 15 && (
                <span className="text-xs font-semibold text-white">
                  {percentUsed.toFixed(0)}%
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="text-base-content/60">
              ${spent.toFixed(2)} spent
            </span>
            <span className={`font-semibold ${remaining < 0 ? "text-error" : "text-success"}`}>
              ${Math.abs(remaining).toFixed(2)} {remaining < 0 ? "over" : "remaining"}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-xs">Daily Average</div>
            <div className="stat-value text-lg">${dailyAverage.toFixed(2)}</div>
            <div className="stat-desc text-xs">Per day spending</div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-xs">Days Remaining</div>
            <div className="stat-value text-lg">{daysRemaining}</div>
            <div className="stat-desc text-xs">In this month</div>
          </div>
        </div>

        {/* Projection Alert */}
        <div className={`alert ${isOnTrack ? "alert-success" : "alert-warning"} mt-4`}>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{isOnTrack ? "✓" : "⚠"}</span>
              <span className="font-semibold">
                {isOnTrack ? "On Track" : "Over Budget Projection"}
              </span>
            </div>
            <p className="text-sm">
              At current rate, projected to spend{" "}
              <span className="font-bold">${projectedSpend.toFixed(2)}</span> this month
              {!isOnTrack && (
                <span className="text-error">
                  {" "}(${(projectedSpend - monthlyBudget).toFixed(2)} over budget)
                </span>
              )}
            </p>
            {!isOnTrack && (
              <p className="text-xs mt-1">
                Reduce daily spending to ${(remaining / daysRemaining).toFixed(2)} to stay within budget
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
