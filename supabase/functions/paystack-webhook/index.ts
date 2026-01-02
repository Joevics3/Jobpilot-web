import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey || !paystackSecretKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the signature from headers
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the raw body for signature verification
    const body = await req.text();

    // Verify Paystack signature (basic verification - in production, use crypto.verify)
    // For now, we'll trust the webhook and verify via Paystack API
    const event = JSON.parse(body);

    console.log('Paystack webhook event:', event.event, event.data?.reference);

    // Verify the transaction with Paystack
    if (event.event === 'charge.success' || event.event === 'charge.successful') {
      const transaction = event.data;
      const reference = transaction.reference;

      // Verify transaction with Paystack API
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
        },
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.status || verifyData.data.status !== 'success') {
        console.error('Transaction verification failed:', reference);
        return new Response(
          JSON.stringify({ error: 'Transaction verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const verifiedTransaction = verifyData.data;
      const metadata = verifiedTransaction.metadata || {};
      const userId = metadata.user_id;
      const credits = metadata.credits;

      if (!userId || !credits) {
        console.error('Missing metadata in transaction:', reference);
        return new Response(
          JSON.stringify({ error: 'Missing transaction metadata' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if credits have already been added (idempotency)
      const { data: existingTransaction } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('reference_id', reference)
        .eq('transaction_type', 'purchase')
        .single();

      if (existingTransaction) {
        console.log('Credits already added for transaction:', reference);
        return new Response(
          JSON.stringify({ message: 'Credits already added' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'purchase',
          amount: credits,
          description: `Purchased ${credits} credits`,
          reference_id: reference
        });

      if (transactionError) {
        console.error('Error recording transaction:', transactionError);
        throw transactionError;
      }

      // Update credit balance using RPC
      const { error: balanceError } = await supabase.rpc('update_credit_balance', {
        p_user_id: userId,
        p_amount: credits
      });

      if (balanceError) {
        console.error('Error updating credit balance:', balanceError);
        throw balanceError;
      }

      console.log(`✅ Successfully added ${credits} credits to user ${userId}`);

      return new Response(
        JSON.stringify({ message: 'Credits added successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle other events (optional)
    return new Response(
      JSON.stringify({ message: 'Event received' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


