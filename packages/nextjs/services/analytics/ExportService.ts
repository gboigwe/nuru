/**
 * Export Service
 *
 * Handles exporting analytics data to various formats
 * Supports CSV, PDF, and Excel exports
 */

import type { AnalyticsDashboardData, ExportFormat } from "~~/types/analytics";

/**
 * Export Service Class
 */
class ExportServiceClass {
  /**
   * Export analytics data to specified format
   *
   * @param data - Dashboard data to export
   * @param format - Export format
   * @param filename - Optional filename
   */
  async exportData(
    data: AnalyticsDashboardData,
    format: ExportFormat,
    filename?: string,
  ): Promise<void> {
    const defaultFilename = `nuru-analytics-${new Date().toISOString().split("T")[0]}`;

    switch (format) {
      case "csv":
        this.exportToCSV(data, filename || `${defaultFilename}.csv`);
        break;
      case "pdf":
        this.exportToPDF(data, filename || `${defaultFilename}.pdf`);
        break;
      case "excel":
        this.exportToExcel(data, filename || `${defaultFilename}.xlsx`);
        break;
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(data: AnalyticsDashboardData, filename: string): void {
    const csv = this.generateCSV(data);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    this.downloadFile(blob, filename);
  }

  /**
   * Generate CSV content
   */
  private generateCSV(data: AnalyticsDashboardData): string {
    const lines: string[] = [];

    // Summary section
    lines.push("ANALYTICS SUMMARY");
    lines.push("");
    lines.push("Metric,Value");
    lines.push(`Total Transactions,${data.summary.totalTransactions}`);
    lines.push(`Total Spent,$${data.summary.totalSpent.toFixed(2)}`);
    lines.push(`Total Gas Fees,$${data.summary.totalGasFees.toFixed(4)}`);
    lines.push(`Average Transaction Size,$${data.summary.averageTransactionSize.toFixed(2)}`);
    lines.push(`Total Savings,$${data.summary.totalSavings.toFixed(2)}`);
    lines.push(`Financial Health Score,${data.summary.healthScore}/100`);
    lines.push("");

    // Budget section
    lines.push("BUDGET TRACKING");
    lines.push("");
    lines.push("Metric,Value");
    lines.push(`Monthly Budget,$${data.budget.monthlyBudget.toFixed(2)}`);
    lines.push(`Spent,$${data.budget.spent.toFixed(2)}`);
    lines.push(`Remaining,$${data.budget.remaining.toFixed(2)}`);
    lines.push(`Percent Used,${data.budget.percentUsed.toFixed(1)}%`);
    lines.push(`Daily Average,$${data.budget.dailyAverage.toFixed(2)}`);
    lines.push(`Projected Spend,$${data.budget.projectedSpend.toFixed(2)}`);
    lines.push("");

    // Savings comparison
    lines.push("COST COMPARISON");
    lines.push("");
    lines.push("Service,Cost");
    lines.push(`Nuru,$${data.savings.nuruCost.toFixed(4)}`);
    lines.push(`Western Union,$${data.savings.westernUnionCost.toFixed(2)}`);
    lines.push(`MoneyGram,$${data.savings.moneyGramCost.toFixed(2)}`);
    lines.push(`Bank Transfer,$${data.savings.bankTransferCost.toFixed(2)}`);
    lines.push(`Total Savings,$${data.savings.totalSavings.toFixed(2)}`);
    lines.push(`Savings Percentage,${data.savings.savingsPercentage.toFixed(1)}%`);
    lines.push("");

    // Transactions
    lines.push("TRANSACTION HISTORY");
    lines.push("");
    lines.push("Date,Recipient,Amount,Currency,Gas Fee,Transaction Hash");

    data.transactions.forEach(tx => {
      const date = new Date(tx.timestamp).toLocaleDateString();
      lines.push(
        `${date},${tx.recipient},${tx.amount},${tx.currency},${tx.gasFee},${tx.transactionHash}`,
      );
    });

    lines.push("");

    // Top recipients
    lines.push("TOP RECIPIENTS");
    lines.push("");
    lines.push("Address,Total Sent,Transaction Count,Average Amount,Percentage");

    data.recipients.slice(0, 10).forEach(recipient => {
      lines.push(
        `${recipient.address},${recipient.totalSent.toFixed(2)},${recipient.transactionCount},${recipient.averageAmount.toFixed(2)},${recipient.percentage.toFixed(1)}%`,
      );
    });

    return lines.join("\n");
  }

  /**
   * Export to PDF format
   */
  private exportToPDF(data: AnalyticsDashboardData, filename: string): void {
    // For PDF export, we'll create an HTML page and print it
    // In production, use a library like jsPDF or pdfmake

    const html = this.generatePDFHTML(data);

    // Create a new window and print
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 100);
      };
    }
  }

  /**
   * Generate PDF HTML content
   */
  private generatePDFHTML(data: AnalyticsDashboardData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nuru Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #3b82f6; }
          h2 { color: #1f2937; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .summary { background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Nuru Analytics Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>

        <div class="summary">
          <h2>Summary</h2>
          <p><strong>Total Transactions:</strong> ${data.summary.totalTransactions}</p>
          <p><strong>Total Spent:</strong> $${data.summary.totalSpent.toFixed(2)}</p>
          <p><strong>Total Savings:</strong> $${data.summary.totalSavings.toFixed(2)}</p>
          <p><strong>Financial Health Score:</strong> ${data.summary.healthScore}/100 (${data.healthScore.rating})</p>
        </div>

        <h2>Budget Tracking</h2>
        <table>
          <tr>
            <th>Monthly Budget</th>
            <th>Spent</th>
            <th>Remaining</th>
            <th>Percent Used</th>
          </tr>
          <tr>
            <td>$${data.budget.monthlyBudget.toFixed(2)}</td>
            <td>$${data.budget.spent.toFixed(2)}</td>
            <td>$${data.budget.remaining.toFixed(2)}</td>
            <td>${data.budget.percentUsed.toFixed(1)}%</td>
          </tr>
        </table>

        <h2>Cost Comparison</h2>
        <table>
          <tr>
            <th>Service</th>
            <th>Cost</th>
          </tr>
          <tr>
            <td>Nuru</td>
            <td>$${data.savings.nuruCost.toFixed(4)}</td>
          </tr>
          <tr>
            <td>Western Union</td>
            <td>$${data.savings.westernUnionCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>MoneyGram</td>
            <td>$${data.savings.moneyGramCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Bank Transfer</td>
            <td>$${data.savings.bankTransferCost.toFixed(2)}</td>
          </tr>
        </table>

        <h2>Top Recipients</h2>
        <table>
          <tr>
            <th>Address</th>
            <th>Total Sent</th>
            <th>Transactions</th>
          </tr>
          ${data.recipients
            .slice(0, 5)
            .map(
              r => `
            <tr>
              <td>${r.address}</td>
              <td>$${r.totalSent.toFixed(2)}</td>
              <td>${r.transactionCount}</td>
            </tr>
          `,
            )
            .join("")}
        </table>

        <h2>Recommendations</h2>
        <ul>
          ${data.healthScore.recommendations.map(rec => `<li>${rec}</li>`).join("")}
        </ul>
      </body>
      </html>
    `;
  }

  /**
   * Export to Excel format
   */
  private exportToExcel(data: AnalyticsDashboardData, filename: string): void {
    // For Excel export, we'll create a simple CSV with .xlsx extension
    // In production, use a library like xlsx or exceljs

    const csv = this.generateCSV(data);
    const blob = new Blob([csv], { type: "application/vnd.ms-excel" });
    this.downloadFile(blob, filename);

    console.warn(
      "Excel export is using CSV format. For true .xlsx support, install the 'xlsx' package.",
    );
  }

  /**
   * Download file to user's computer
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`✅ Downloaded: ${filename}`);
  }
}

// Singleton instance
export const exportService = new ExportServiceClass();
