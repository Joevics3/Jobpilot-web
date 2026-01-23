import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/lib/firebase-admin';

const careerTips = [
  {
    title: '💼 Interview Practice',
    body: 'Practice common interview questions to boost your confidence',
    url: '/interview-practice',
  },
  {
    title: '📄 CV Creation',
    body: 'Update your CV to stand out from other candidates',
    url: '/cv-builder',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { data: tokens } = await supabase
      .from('notification_tokens')
      .select('token');

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ error: 'No tokens found' }, { status: 404 });
    }

    let successCount = 0;

    // Randomly pick one tip
    const tip = careerTips[Math.floor(Math.random() * careerTips.length)];

    for (const { token } of tokens) {
      const result = await sendNotification(
        token,
        tip.title,
        tip.body,
        { url: tip.url, tag: 'weekly-tip' }
      );
      if (result.success) successCount++;
    }

    return NextResponse.json({
      success: true,
      tipSent: tip.title,
      notificationsSent: successCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weekly tips error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}