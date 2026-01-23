import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/lib/firebase-admin';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get CRON_SECRET from Supabase Vault
    const vaultClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: cronSecretData } = await vaultClient.rpc('vault_get_secret', {
      secret_name: 'CRON_SECRET'
    });

    const cronSecret = cronSecretData?.secret;

    // Verify cron secret from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get latest 7 jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, slug, company')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(7);

    if (jobsError || !jobs || jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs found' }, { status: 404 });
    }

    // Get all active notification tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('token');

    if (tokensError || !tokens || tokens.length === 0) {
      return NextResponse.json({ error: 'No tokens found' }, { status: 404 });
    }

    let successCount = 0;
    let failCount = 0;

    // Send notification for each of the 7 jobs to all users
    for (const job of jobs) {
      const title = `New Job: ${job.title}`;
      const body = `${job.company} is hiring. Check it out now!`;
      const data = {
        url: `/jobs/${job.slug}`,
        jobId: job.id,
        tag: 'daily-job',
      };

      for (const { token } of tokens) {
        const result = await sendNotification(token, title, body, data);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      jobsSent: jobs.length,
      notificationsSent: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}