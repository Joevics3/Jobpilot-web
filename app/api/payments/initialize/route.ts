import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PaymentService } from '@/lib/services/paymentService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { userId, packageId, email } = await request.json();

    if (!userId || !packageId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, packageId, email' },
        { status: 400 }
      );
    }

    const packageInfo = PaymentService.getPackageById(packageId);
    if (!packageInfo) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      );
    }

    // Verify user exists
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate unique reference
    const reference = `credit_${userId}_${Date.now()}`;

    // Initialize payment with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: packageInfo.price,
        reference,
        metadata: {
          user_id: userId,
          package_id: packageId,
          credits: packageInfo.credits
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.jobmeter.app'}/credits/purchase-success?reference=${reference}`
      })
    });

    const data = await response.json();

    if (!data?.status) {
      return NextResponse.json(
        { error: data?.message || 'Payment initialization failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    });
  } catch (error: any) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}


