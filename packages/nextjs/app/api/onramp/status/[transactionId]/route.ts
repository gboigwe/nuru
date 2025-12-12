import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    transactionId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { transactionId } = await params;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!flutterwaveKey) {
      console.warn('FLUTTERWAVE_SECRET_KEY not configured. Using mock response.');

      // Mock response for development/testing
      // Simulate successful payment after random delay
      const mockStatuses = ['pending', 'completed', 'failed'];
      const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];

      return NextResponse.json({
        success: true,
        status: randomStatus,
        transactionId,
        message: `Mock transaction ${randomStatus}`,
        mock: true,
      });
    }

    // Query Flutterwave transaction status
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${flutterwaveKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.status === 'success') {
      const txStatus = data.data.status; // 'successful', 'failed', or 'pending'

      // Map Flutterwave status to our internal status
      let status = 'pending';
      if (txStatus === 'successful') {
        status = 'completed';

        // TODO: Trigger USDC transfer to user's wallet
        // This would integrate with your backend service that:
        // 1. Converts fiat to USDC
        // 2. Transfers USDC to user's wallet address
        // For now, this is just a placeholder
      } else if (txStatus === 'failed') {
        status = 'failed';
      }

      return NextResponse.json({
        success: true,
        status,
        transactionId,
        amount: data.data.amount,
        currency: data.data.currency,
        message: data.data.processor_response || 'Transaction status retrieved',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          status: 'failed',
          message: data.message || 'Failed to retrieve transaction status',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Transaction status API error:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'failed',
        message: 'Internal server error. Please try again.',
      },
      { status: 500 }
    );
  }
}
