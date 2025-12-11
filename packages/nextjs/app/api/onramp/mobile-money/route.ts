import { NextRequest, NextResponse } from 'next/server';

interface MobileMoneyRequest {
  provider: 'mtn' | 'vodafone' | 'airtel' | 'mpesa';
  phoneNumber: string;
  amount: string;
  currency: 'GHS' | 'NGN' | 'KES' | 'USD';
  walletAddress?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: MobileMoneyRequest = await req.json();
    const { provider, phoneNumber, amount, currency, walletAddress } = body;

    // Validate request
    if (!provider || !phoneNumber || !amount || !currency) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique transaction reference
    const txRef = `NURU-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Integrate with mobile money provider API
    // Using Flutterwave as the payment gateway
    const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!flutterwaveKey) {
      console.warn('FLUTTERWAVE_SECRET_KEY not configured. Using mock response.');

      // Mock response for development/testing
      return NextResponse.json({
        success: true,
        transactionId: txRef,
        message: 'Please approve payment on your phone',
        mock: true,
      });
    }

    // Determine the network type based on provider
    const networkMap: Record<string, string> = {
      mtn: 'MTN',
      vodafone: 'VODAFONE',
      airtel: 'AIRTEL',
      mpesa: 'MPESA',
    };

    // Call Flutterwave Mobile Money API
    const response = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money_ghana', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: parseFloat(amount),
        currency,
        network: networkMap[provider],
        phone_number: phoneNumber,
        email: 'user@nuru.app',
        fullname: 'Nuru User',
        meta: {
          wallet_address: walletAddress,
          purchase_type: 'usdc_onramp',
        },
      }),
    });

    const data = await response.json();

    if (data.status === 'success') {
      return NextResponse.json({
        success: true,
        transactionId: data.data.id || txRef,
        message: 'Please approve payment on your phone',
        flw_ref: data.data.flw_ref,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to initiate payment',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Mobile money API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error. Please try again.',
      },
      { status: 500 }
    );
  }
}
