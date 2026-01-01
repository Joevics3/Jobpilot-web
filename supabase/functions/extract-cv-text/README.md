# Extract CV Text - Supabase Edge Function

This Supabase Edge Function handles text extraction from PDF and image files using Gemini API with OCR.Space as a fallback.

## Setup

### 1. Deploy the Function

Make sure you have the Supabase CLI installed:

```bash
npm install -g supabase
```

Then deploy the function:

```bash
supabase functions deploy extract-cv-text
```

### 2. Set Environment Variables

In your Supabase dashboard, go to **Project Settings** → **Edge Functions** → **Secrets** and add:

- `GEMINI_API_KEY` - Your Google Gemini API key
- `OCR_SPACE_API_KEY` - Your OCR.Space API key (optional, defaults to free tier key)

Or use the CLI:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase secrets set OCR_SPACE_API_KEY=your_ocr_space_api_key
```

### 3. Function Usage

The function accepts a POST request with the following body:

```json
{
  "file": "base64_encoded_file_data",
  "mimeType": "application/pdf" | "image/png" | "image/jpeg" | etc.,
  "fileName": "optional_file_name"
}
```

Response:

```json
{
  "text": "extracted text content"
}
```

Or on error:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## How It Works

1. **Gemini Extraction**: Tries multiple Gemini models in order:
   - `gemini-2.5-flash-lite` (primary)
   - `gemini-2.0-flash` (fallback)
   - `gemini-1.5-flash` (fallback)
   - `gemini-1.5-pro` (final fallback)

2. **OCR.Space Fallback**: If all Gemini models fail, falls back to OCR.Space API
   - Note: OCR.Space has a 1MB file size limit
   - Files over 1MB must succeed with Gemini extraction

## Timeout

The function has a 90-second timeout for Gemini API calls (longer than the Next.js API route timeout).

## CORS

The function includes CORS headers to allow requests from your Next.js application.

























