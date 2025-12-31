import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Increase timeout for this route to allow Supabase function to complete (up to 120 seconds)
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const contentType = (file as any).type || '';
    const fileName = (file as any).name || '';

    console.log('Processing file:', fileName, 'Type:', contentType);

    // Handle DOCX files locally with mammoth
    if (contentType.includes('officedocument.wordprocessingml.document') || fileName.endsWith('.docx')) {
      try {
        console.log('Processing DOCX with mammoth...');
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
        console.log('DOCX extracted text length:', value?.length || 0);
        return NextResponse.json({ text: value || '' });
      } catch (docxError) {
        console.error('DOCX extraction failed:', docxError);
        return NextResponse.json({ 
          error: 'DOCX extraction failed', 
          details: docxError instanceof Error ? docxError.message : 'Unknown error' 
        }, { status: 500 });
      }
    }

    // For images and PDFs: use Supabase Edge Function
    const isPDF = contentType === 'application/pdf';
    const isImage = contentType.startsWith('image/');

    if (isPDF || isImage) {
      try {
        console.log('Sending PDF/Image to Supabase Edge Function for extraction:', fileName);
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        const base64Data = fileBuffer.toString('base64');

        // Call Supabase Edge Function (function has 90s timeout, we allow up to 120s for safety)
        const functionStartTime = Date.now();
        
        // Create timeout promise - increased to 120 seconds to allow Supabase function to complete
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Function call timed out after 120 seconds')), 120000);
        });

        // Race between function call and timeout
        const functionCall = supabase.functions.invoke('extract-cv-text', {
          body: {
            file: base64Data,
            mimeType: contentType,
            fileName: fileName
          }
        });

        const { data, error } = await Promise.race([functionCall, timeoutPromise]);
        const functionTime = Date.now() - functionStartTime;
        console.log(`⏱️ Supabase function call took ${functionTime}ms`);

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`Edge function error: ${error.message || 'Unknown error'}`);
        }

        if (!data || !data.text) {
          throw new Error(data?.error || data?.details || 'No text extracted from file');
        }

        console.log('Successfully extracted text from Supabase function, length:', data.text.length);
        return NextResponse.json({ text: data.text });
      } catch (extractionError) {
        console.error('PDF/Image extraction failed:', extractionError);
        const errorMessage = extractionError instanceof Error ? extractionError.message : 'Unknown error';
        return NextResponse.json({ 
          error: 'Text extraction failed', 
          details: errorMessage
        }, { status: 500 });
      }
    }

    // For other file types, return error (only PDF, images, and DOCX are supported)
    return NextResponse.json({ 
      error: 'Unsupported file type', 
      details: 'Only PDF, image files, and Word documents (DOCX) are supported.' 
    }, { status: 400 });
  } catch (error: any) {
    console.error('OCR route error:', error);
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}



