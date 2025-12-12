/**
 * Receipt PDF Export Service
 *
 * Exports payment receipts as PDF documents
 */

import { jsPDF } from "jspdf";
import type { PaymentReceiptData } from "./ReceiptMetadataService";

class ReceiptPDFExportClass {
  /**
   * Generate PDF from receipt data
   */
  async generatePDF(receiptData: PaymentReceiptData, imageDataUrl?: string): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // Header
    this.addHeader(pdf, pageWidth, margin);

    // Receipt Image
    if (imageDataUrl) {
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (imgWidth * 1000) / 800; // Maintain aspect ratio
      pdf.addImage(imageDataUrl, "PNG", margin, 50, imgWidth, imgHeight);
    }

    // Receipt Details
    const detailsY = imageDataUrl ? 200 : 50;
    this.addReceiptDetails(pdf, receiptData, margin, detailsY, pageWidth);

    // Footer
    this.addFooter(pdf, pageWidth, pageHeight, margin);

    return pdf.output("blob");
  }

  /**
   * Add header to PDF
   */
  private addHeader(pdf: jsPDF, pageWidth: number, margin: number): void {
    // Brand color bar
    pdf.setFillColor(18, 183, 106);
    pdf.rect(0, 0, pageWidth, 15, "F");

    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("PAYMENT RECEIPT", pageWidth / 2, 10, { align: "center" });

    // Logo text
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.text("✨ Nuru", margin, 30);
  }

  /**
   * Add receipt details to PDF
   */
  private addReceiptDetails(
    pdf: jsPDF,
    data: PaymentReceiptData,
    margin: number,
    startY: number,
    pageWidth: number
  ): void {
    let y = startY;

    // Amount (prominent)
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(18, 183, 106);
    pdf.text(`${data.amount} ${data.currency}`, pageWidth / 2, y, { align: "center" });
    y += 15;

    // Date
    const date = new Date(data.timestamp).toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(date, pageWidth / 2, y, { align: "center" });
    y += 15;

    // Divider line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Details
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);

    const details = [
      { label: "From:", value: data.sender },
      { label: "To:", value: data.recipient },
      { label: "Network:", value: data.network || "Base" },
      { label: "Block:", value: data.blockNumber?.toString() || "Pending" },
      { label: "Transaction Hash:", value: data.transactionHash },
    ];

    details.forEach(detail => {
      pdf.setFont("helvetica", "bold");
      pdf.text(detail.label, margin, y);

      pdf.setFont("helvetica", "normal");
      const maxWidth = pageWidth - margin * 2 - 40;

      if (detail.label === "Transaction Hash:") {
        // Wrap long transaction hash
        const lines = pdf.splitTextToSize(detail.value, maxWidth);
        pdf.text(lines, margin + 40, y);
        y += lines.length * 5;
      } else {
        pdf.text(detail.value, margin + 40, y);
      }

      y += 8;
    });
  }

  /**
   * Add footer to PDF
   */
  private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number): void {
    const footerY = pageHeight - 30;

    // Divider line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    // Footer text
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont("helvetica", "normal");

    pdf.text(
      "This is an immutable proof of payment stored on the blockchain",
      pageWidth / 2,
      footerY + 5,
      { align: "center" }
    );

    pdf.text("Nuru - Light up your payments", pageWidth / 2, footerY + 10, { align: "center" });

    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY + 15, {
      align: "center",
    });
  }

  /**
   * Download PDF
   */
  downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Generate and download PDF
   */
  async exportPDF(receiptData: PaymentReceiptData, imageDataUrl?: string): Promise<void> {
    const blob = await this.generatePDF(receiptData, imageDataUrl);
    const filename = `nuru-receipt-${receiptData.transactionHash.slice(0, 10)}.pdf`;
    this.downloadPDF(blob, filename);
  }
}

export const receiptPDFExport = new ReceiptPDFExportClass();
