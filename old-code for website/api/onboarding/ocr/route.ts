import { NextResponse } from 'next/server';

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
        // Fall back to OCR for DOCX if mammoth fails
      }
    }

    // Use OCR.Space for images, PDFs, and as fallback for other files
    console.log('Using OCR.Space API for file:', fileName);
    
    const formDataOCR = new FormData();
    formDataOCR.append('file', file);
    formDataOCR.append('apikey', 'helloworld'); // Using the working free tier key
    formDataOCR.append('language', 'eng');
    formDataOCR.append('isOverlayRequired', 'false');
    formDataOCR.append('detectOrientation', 'false');
    formDataOCR.append('scale', 'true');
    formDataOCR.append('OCREngine', '2');

    console.log('Sending to OCR.Space API...');
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formDataOCR,
    });

    const result = await response.json();
    console.log('OCR API response:', result);
    
    if (result.IsErroredOnProcessing) {
      console.error('OCR processing error:', result.ErrorMessage);
      return NextResponse.json({ 
        error: 'OCR processing failed', 
        details: result.ErrorMessage || 'Text extraction failed' 
      }, { status: 500 });
    }

    if (result.ParsedResults && result.ParsedResults.length > 0) {
      const extractedText = result.ParsedResults[0].ParsedText || '';
      console.log('OCR extracted text length:', extractedText.length);
      return NextResponse.json({ text: extractedText });
    }

    return NextResponse.json({ error: 'No text found in document' }, { status: 500 });
  } catch (error: any) {
    console.error('OCR route error:', error);
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}



