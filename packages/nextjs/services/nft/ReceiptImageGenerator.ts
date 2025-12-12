/**
 * Receipt Image Generator
 *
 * Generates visual payment receipt images using HTML Canvas
 */

import type { PaymentReceiptData } from "./ReceiptMetadataService";

class ReceiptImageGeneratorClass {
  private readonly WIDTH = 800;
  private readonly HEIGHT = 1000;

  /**
   * Generate receipt image as data URL
   */
  async generateImage(receiptData: PaymentReceiptData): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error("Image generation only available in browser");
    }

    const canvas = document.createElement("canvas");
    canvas.width = this.WIDTH;
    canvas.height = this.HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Draw receipt
    this.drawBackground(ctx);
    this.drawHeader(ctx);
    await this.drawLogo(ctx);
    this.drawReceiptDetails(ctx, receiptData);
    this.drawFooter(ctx, receiptData);

    // Generate QR code placeholder
    await this.drawQRCode(ctx, receiptData.transactionHash);

    return canvas.toDataURL("image/png");
  }

  /**
   * Draw background
   */
  private drawBackground(ctx: CanvasRenderingContext2D): void {
    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // Subtle gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, this.HEIGHT);
    gradient.addColorStop(0, "rgba(18, 183, 106, 0.05)");
    gradient.addColorStop(1, "rgba(18, 183, 106, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // Border
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, this.WIDTH - 40, this.HEIGHT - 40);
  }

  /**
   * Draw header
   */
  private drawHeader(ctx: CanvasRenderingContext2D): void {
    // Brand color bar
    ctx.fillStyle = "#12B76A";
    ctx.fillRect(0, 0, this.WIDTH, 80);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAYMENT RECEIPT", this.WIDTH / 2, 50);
  }

  /**
   * Draw logo placeholder
   */
  private async drawLogo(ctx: CanvasRenderingContext2D): Promise<void> {
    // Draw Nuru logo circle
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.WIDTH / 2, 140, 40, 0, Math.PI * 2);
    ctx.fill();

    // Draw sparkle emoji
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✨", this.WIDTH / 2, 155);
  }

  /**
   * Draw receipt details
   */
  private drawReceiptDetails(ctx: CanvasRenderingContext2D, data: PaymentReceiptData): void {
    const startY = 220;
    const lineHeight = 50;
    let currentY = startY;

    // Amount (prominent)
    ctx.fillStyle = "#111827";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${data.amount} ${data.currency}`, this.WIDTH / 2, currentY);
    currentY += lineHeight + 20;

    // Date
    const date = new Date(data.timestamp).toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(date, this.WIDTH / 2, currentY);
    currentY += lineHeight + 20;

    // Divider
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, currentY);
    ctx.lineTo(this.WIDTH - 100, currentY);
    ctx.stroke();
    currentY += 40;

    // Details section
    ctx.textAlign = "left";
    ctx.font = "18px sans-serif";

    const details = [
      { label: "From", value: this.formatAddress(data.sender) },
      { label: "To", value: this.formatAddress(data.recipient) },
      { label: "Network", value: data.network || "Base" },
      { label: "Block", value: data.blockNumber?.toString() || "Pending" },
    ];

    details.forEach(detail => {
      ctx.fillStyle = "#6b7280";
      ctx.fillText(detail.label, 100, currentY);

      ctx.fillStyle = "#111827";
      ctx.font = "bold 18px monospace";
      ctx.fillText(detail.value, 300, currentY);

      ctx.font = "18px sans-serif";
      currentY += lineHeight;
    });

    currentY += 20;

    // Transaction hash (wrapped)
    ctx.fillStyle = "#6b7280";
    ctx.fillText("Transaction Hash", 100, currentY);
    currentY += 30;

    ctx.fillStyle = "#111827";
    ctx.font = "14px monospace";
    const txHash = data.transactionHash;
    const chunkSize = 42;
    for (let i = 0; i < txHash.length; i += chunkSize) {
      ctx.fillText(txHash.slice(i, i + chunkSize), 100, currentY);
      currentY += 25;
    }
  }

  /**
   * Draw QR code placeholder
   */
  private async drawQRCode(ctx: CanvasRenderingContext2D, transactionHash: string): Promise<void> {
    const qrSize = 150;
    const qrX = this.WIDTH / 2 - qrSize / 2;
    const qrY = 700;

    // QR code background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX, qrY, qrSize, qrSize);

    // QR code border
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);

    // Placeholder pattern (simple grid)
    ctx.fillStyle = "#000000";
    const cellSize = qrSize / 10;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(qrX + i * cellSize, qrY + j * cellSize, cellSize, cellSize);
        }
      }
    }

    // Label
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scan to verify on blockchain", this.WIDTH / 2, qrY + qrSize + 30);
  }

  /**
   * Draw footer
   */
  private drawFooter(ctx: CanvasRenderingContext2D, data: PaymentReceiptData): void {
    const footerY = this.HEIGHT - 100;

    // Divider
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, footerY);
    ctx.lineTo(this.WIDTH - 100, footerY);
    ctx.stroke();

    // Footer text
    ctx.fillStyle = "#9ca3af";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("This is an immutable proof of payment stored on the blockchain", this.WIDTH / 2, footerY + 30);
    ctx.fillText("Nuru - Light up your payments", this.WIDTH / 2, footerY + 50);
  }

  /**
   * Format address
   */
  private formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Convert data URL to blob
   */
  async dataURLToBlob(dataURL: string): Promise<Blob> {
    const res = await fetch(dataURL);
    return await res.blob();
  }

  /**
   * Download image
   */
  downloadImage(dataURL: string, filename: string): void {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataURL;
    link.click();
  }
}

export const receiptImageGenerator = new ReceiptImageGeneratorClass();
