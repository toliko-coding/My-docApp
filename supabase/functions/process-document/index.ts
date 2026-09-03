// Supabase Edge Function: process-document
//
// Reads an already-uploaded document (owned by the calling user) from
// private Storage, sends it to Claude for OCR + structured extraction, and
// returns JSON matching src/schemas/document-extraction.schema.ts. This is
// the ONLY place the Anthropic API key is used — it is a server-side secret
// (`supabase secrets set ANTHROPIC_API_KEY=...`), never present in the app.
//
// Deploy: supabase functions deploy process-document
// Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-5';

// Kept in sync with the `key` column seeded in supabase/migrations/0001_init.sql.
const KNOWN_CATEGORY_KEYS = [
  'electricity', 'water', 'gas', 'property_tax', 'building_committee', 'internet', 'tv', 'mobile',
  'insurance', 'rent', 'mortgage', 'credit_card', 'bank', 'car', 'fuel', 'parking', 'education',
  'medical', 'government', 'subscriptions', 'shopping', 'home_services', 'business', 'other',
];

// Claude's vision input only accepts these raster formats; HEIC must be rejected explicitly
// rather than silently mis-sent as a different declared media type.
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// Flat schema: LLM tool-calling fills flat property lists far more reliably than deeply
// nested optional/nullable objects. Reshaped into the app's nested {value, confidence}
// contract below before returning.
const EXTRACTION_TOOL = {
  name: 'record_bill_extraction',
  description: 'Records structured data extracted from a bill, receipt, or invoice document.',
  input_schema: {
    type: 'object',
    properties: {
      documentType: { type: 'string', enum: ['bill', 'receipt', 'tax_invoice', 'payment_demand', 'other'] },
      documentTypeConfidence: { type: 'number', minimum: 0, maximum: 1 },
      provider: { type: 'string', description: 'The company/authority that issued this document.' },
      providerConfidence: { type: 'number', minimum: 0, maximum: 1 },
      category: { type: 'string', enum: KNOWN_CATEGORY_KEYS, description: 'Best-matching category key.' },
      categoryConfidence: { type: 'number', minimum: 0, maximum: 1 },
      amount: { type: 'number', description: 'Total amount due, in the document currency.' },
      amountConfidence: { type: 'number', minimum: 0, maximum: 1 },
      currency: { type: 'string', description: '3-letter ISO currency code, e.g. ILS, USD.' },
      amountBeforeVat: { type: 'number' },
      amountBeforeVatConfidence: { type: 'number', minimum: 0, maximum: 1 },
      amountAfterVat: { type: 'number' },
      amountAfterVatConfidence: { type: 'number', minimum: 0, maximum: 1 },
      issueDate: { type: 'string', description: 'ISO date YYYY-MM-DD.' },
      issueDateConfidence: { type: 'number', minimum: 0, maximum: 1 },
      dueDate: { type: 'string', description: 'ISO date YYYY-MM-DD.' },
      dueDateConfidence: { type: 'number', minimum: 0, maximum: 1 },
      billingPeriodStart: { type: 'string', description: 'ISO date YYYY-MM-DD.' },
      billingPeriodEnd: { type: 'string', description: 'ISO date YYYY-MM-DD.' },
      billingPeriodConfidence: { type: 'number', minimum: 0, maximum: 1 },
      invoiceNumber: { type: 'string' },
      invoiceNumberConfidence: { type: 'number', minimum: 0, maximum: 1 },
      customerNumber: { type: 'string' },
      customerNumberConfidence: { type: 'number', minimum: 0, maximum: 1 },
      referenceNumber: { type: 'string' },
      referenceNumberConfidence: { type: 'number', minimum: 0, maximum: 1 },
      paymentMethod: { type: 'string' },
      paymentMethodConfidence: { type: 'number', minimum: 0, maximum: 1 },
      isPaid: { type: 'boolean' },
      isPaidConfidence: { type: 'number', minimum: 0, maximum: 1 },
      paidDate: { type: 'string', description: 'ISO date YYYY-MM-DD.' },
      paidDateConfidence: { type: 'number', minimum: 0, maximum: 1 },
      rawText: { type: 'string', description: 'Full transcription of every piece of visible text on the document.' },
    },
    required: ['rawText'],
  },
};

function field(input: Record<string, unknown>, valueKey: string, confidenceKey: string) {
  const value = input[valueKey];
  if (value === undefined || value === null || value === '') return null;
  const confidence = typeof input[confidenceKey] === 'number' ? (input[confidenceKey] as number) : 0;
  return { value, confidence };
}

function reshapeToolInput(input: Record<string, unknown>) {
  const billingStart = typeof input.billingPeriodStart === 'string' ? input.billingPeriodStart : null;
  const billingEnd = typeof input.billingPeriodEnd === 'string' ? input.billingPeriodEnd : null;

  return {
    documentType: field(input, 'documentType', 'documentTypeConfidence'),
    provider: field(input, 'provider', 'providerConfidence'),
    category: field(input, 'category', 'categoryConfidence'),
    amount: field(input, 'amount', 'amountConfidence'),
    currency: typeof input.currency === 'string' && input.currency.length === 3 ? input.currency : 'ILS',
    amountBeforeVat: field(input, 'amountBeforeVat', 'amountBeforeVatConfidence'),
    amountAfterVat: field(input, 'amountAfterVat', 'amountAfterVatConfidence'),
    issueDate: field(input, 'issueDate', 'issueDateConfidence'),
    dueDate: field(input, 'dueDate', 'dueDateConfidence'),
    billingPeriod:
      billingStart && billingEnd
        ? {
            start: billingStart,
            end: billingEnd,
            confidence: typeof input.billingPeriodConfidence === 'number' ? input.billingPeriodConfidence : 0,
          }
        : null,
    invoiceNumber: field(input, 'invoiceNumber', 'invoiceNumberConfidence'),
    customerNumber: field(input, 'customerNumber', 'customerNumberConfidence'),
    referenceNumber: field(input, 'referenceNumber', 'referenceNumberConfidence'),
    paymentMethod: field(input, 'paymentMethod', 'paymentMethodConfidence'),
    isPaid: field(input, 'isPaid', 'isPaidConfidence'),
    paidDate: field(input, 'paidDate', 'paidDateConfidence'),
    rawText: typeof input.rawText === 'string' ? input.rawText : '',
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing Authorization header.' }, 401);

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) return jsonResponse({ error: 'ANTHROPIC_API_KEY is not configured.' }, 500);

    const { documentId, languageHints } = await req.json();
    if (!documentId || typeof documentId !== 'string') {
      return jsonResponse({ error: 'documentId is required.' }, 400);
    }

    // Scoped to the caller's own JWT — every query below is subject to the
    // same RLS policies as the mobile app itself (see 0001_init.sql,
    // 0002_storage.sql). No service_role key is used in this function.
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, storage_path, mime_type')
      .eq('id', documentId)
      .maybeSingle();
    if (documentError) return jsonResponse({ error: documentError.message }, 500);
    if (!document) return jsonResponse({ error: 'Document not found or not accessible.' }, 404);

    const mimeType = document.mime_type as string;
    const isPdf = mimeType === 'application/pdf';
    if (!isPdf && !SUPPORTED_IMAGE_TYPES.has(mimeType)) {
      return jsonResponse(
        { error: `${mimeType} isn't supported for AI extraction yet. Please use JPEG, PNG, WEBP, or PDF.` },
        422,
      );
    }

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.storage_path as string);
    if (downloadError || !fileBlob) {
      return jsonResponse({ error: downloadError?.message ?? 'Could not download the document.' }, 500);
    }

    const base64 = arrayBufferToBase64(await fileBlob.arrayBuffer());
    const languages = Array.isArray(languageHints) && languageHints.length > 0 ? languageHints.join(', ') : 'he, en';

    const documentContentBlock = isPdf
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
      : { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } };

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-beta': 'pdfs-2024-09-25',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('ANTHROPIC_MODEL') || DEFAULT_MODEL,
        max_tokens: 2048,
        tools: [EXTRACTION_TOOL],
        tool_choice: { type: 'tool', name: EXTRACTION_TOOL.name },
        messages: [
          {
            role: 'user',
            content: [
              documentContentBlock,
              {
                type: 'text',
                text:
                  `This is a household bill, receipt, or invoice, likely written in one of: ${languages}. ` +
                  'Read it carefully and call record_bill_extraction with every field you can confidently ' +
                  'determine. For every extracted value, give an honest 0..1 confidence — use a LOW confidence ' +
                  '(under 0.5) whenever the text is blurry, ambiguous, or you are guessing/inferring rather than ' +
                  'reading it directly. Only use a category key from the enum provided; if nothing fits well, ' +
                  'use "other". Amounts must be plain numbers (no currency symbols or thousands separators). ' +
                  'All dates must be ISO YYYY-MM-DD. Leave a field out entirely if it does not appear on the ' +
                  'document at all — do not guess a value just to fill it in. Always fill rawText with a full ' +
                  'transcription of the document’s visible text.',
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.text();
      return jsonResponse({ error: `Anthropic API error (${anthropicResponse.status}): ${errorBody}` }, 502);
    }

    const anthropicResult = await anthropicResponse.json();
    const toolUseBlock = (anthropicResult.content ?? []).find(
      (block: { type: string }) => block.type === 'tool_use',
    );
    if (!toolUseBlock) {
      return jsonResponse({ error: 'The AI did not return structured data.' }, 502);
    }

    return jsonResponse(reshapeToolInput(toolUseBlock.input as Record<string, unknown>));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    return jsonResponse({ error: message }, 500);
  }
});
