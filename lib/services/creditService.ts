import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// For server-side operations
const getSupabase = (serviceKey?: string) => {
  if (serviceKey) {
    return createClient(supabaseUrl, serviceKey);
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: 'purchase' | 'usage' | 'bonus';
  amount: number;
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
  daily_credits_available?: number;
  daily_credits_last_awarded?: string;
  daily_credits_last_used?: string;
}

export class CreditService {
  // Get user's credit details (permanent and daily separately)
  static async getCreditDetails(userId: string, serviceKey?: string): Promise<{ permanent: number; daily: number; total: number }> {
    const supabase = getSupabase(serviceKey);

    const { data, error } = await supabase
      .from('user_credits')
      .select('balance, daily_credits_available')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No credit record found
        return { permanent: 0, daily: 0, total: 0 };
      }
      throw error;
    }

    const permanentCredits = data?.balance || 0;
    const dailyCredits = data?.daily_credits_available || 0;
    const totalCredits = permanentCredits + dailyCredits;

    return { permanent: permanentCredits, daily: dailyCredits, total: totalCredits };
  }

  // Get user's current credit balance (includes daily credits)
  static async getCreditBalance(userId: string, serviceKey?: string): Promise<number> {
    const details = await this.getCreditDetails(userId, serviceKey);
    return details.total;
  }

  // Get user's credit history
  static async getCreditHistory(userId: string, serviceKey?: string): Promise<CreditTransaction[]> {
    const supabase = getSupabase(serviceKey);

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Record a credit transaction
  static async recordTransaction(
    userId: string,
    type: 'purchase' | 'usage' | 'bonus',
    amount: number,
    description: string,
    referenceId: string | undefined,
    serviceKey?: string
  ): Promise<string> {
    const supabase = getSupabase(serviceKey);

    const { data, error } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: type,
        amount,
        description,
        reference_id: referenceId
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  // Deduct credits (for usage) - uses daily credits first
  static async deductCredits(
    userId: string,
    amount: number,
    description: string,
    referenceId: string | undefined,
    serviceKey?: string
  ): Promise<string> {
    const supabase = getSupabase(serviceKey);

    // Get current credit info (both daily and permanent)
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('balance, daily_credits_available')
      .eq('user_id', userId)
      .single();

    if (creditError) {
      if (creditError.code === 'PGRST116') {
        throw new Error('Insufficient credits');
      }
      throw creditError;
    }

    const permanentCredits = creditData?.balance || 0;
    const dailyCredits = creditData?.daily_credits_available || 0;
    const totalCredits = permanentCredits + dailyCredits;

    if (totalCredits < amount) {
      throw new Error('Insufficient credits');
    }

    // Priority deduction: daily credits first, then permanent
    const dailyToDeduct = Math.min(dailyCredits, amount);
    const permanentToDeduct = Math.max(0, amount - dailyCredits);

    // Record the transaction
    const transactionId = await this.recordTransaction(
      userId,
      'usage',
      -amount,
      description,
      referenceId,
      serviceKey
    );

    // Update credits
    const updateData: any = {
      balance: permanentCredits - permanentToDeduct,
      updated_at: new Date().toISOString()
    };

    if (dailyToDeduct > 0) {
      updateData.daily_credits_available = dailyCredits - dailyToDeduct;
      updateData.daily_credits_last_used = new Date().toISOString().split('T')[0];
    }

    const { error: updateError } = await supabase
      .from('user_credits')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    return transactionId;
  }

  // Add credits (for purchases)
  static async addCredits(
    userId: string,
    amount: number,
    description: string,
    referenceId: string | undefined,
    serviceKey?: string
  ): Promise<void> {
    const supabase = getSupabase(serviceKey);

    // Record the transaction
    await this.recordTransaction(
      userId,
      'purchase',
      amount,
      description,
      referenceId,
      serviceKey
    );

    // Update balance using RPC (this adds to existing balance)
    const { error } = await supabase.rpc('update_credit_balance', {
      p_user_id: userId,
      p_amount: amount
    });

    if (error) {
      throw error;
    }
  }

  // Check if user has enough credits (includes daily credits)
  static async hasEnoughCredits(userId: string, requiredAmount: number = 1, serviceKey?: string): Promise<boolean> {
    const totalCredits = await this.getCreditBalance(userId, serviceKey);
    return totalCredits >= requiredAmount;
  }
}


