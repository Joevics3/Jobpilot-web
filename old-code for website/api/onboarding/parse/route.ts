import { NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const parsed = await geminiService.parseCVWithFallback(text);
    return NextResponse.json({ parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}



