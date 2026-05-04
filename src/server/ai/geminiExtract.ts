import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are an expert document analysis system for Keeper AI.
Extract structured information from the supplied document with high precision.
Focus on Israeli Hebrew/English bills, invoices, legal documents, medical documents, and municipal letters.
Perform OCR on all visible text and provide a concise Hebrew summary.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    document_type: { type: "string", description: "Document type, for example Electricity Bill, Arnona, Invoice" },
    entity: { type: "string", nullable: true, description: "Service provider or company name" },
    amount_due: { type: "number", nullable: true, description: "Total amount to be paid" },
    currency: { type: "string", nullable: true, enum: ["ILS", "USD", "EUR"], description: "Currency" },
    due_date: { type: "string", nullable: true, description: "Payment deadline in YYYY-MM-DD format" },
    issue_date: { type: "string", nullable: true, description: "Document issue date in YYYY-MM-DD format" },
    is_urgent: { type: "boolean", description: "True when immediate attention is needed or the due date has passed" },
    summary: { type: "string", description: "Hebrew summary of the document" },
    full_ocr_text: { type: "string", description: "Full OCR transcription" },
    suggested_folder: { type: "string", description: "Recommended Drive folder path" },
    category: { type: "string", description: "Electricity, Water, Communication, Medical, Govt, Insurance, or Other" },
    is_subscription: { type: "boolean", description: "True for recurring subscriptions or recurring payments" },
    market_benchmark: { type: "string", description: "Short note if the price seems high or low for the market" },
    references: {
      type: "object",
      properties: {
        invoice_number: { type: "string", nullable: true },
        customer_id: { type: "string", nullable: true },
      },
    },
  },
  required: [
    "document_type",
    "entity",
    "amount_due",
    "currency",
    "due_date",
    "issue_date",
    "is_urgent",
    "summary",
    "full_ocr_text",
    "suggested_folder",
    "category",
    "is_subscription",
  ],
};

function pickModel(byteLength: number): string {
  const threshold = Number(process.env.GEMINI_PRO_BYTE_THRESHOLD ?? 5_000_000);
  const pro = process.env.GEMINI_MODEL_PRO ?? "gemini-2.0-pro-exp-02-05";
  const flash = process.env.GEMINI_MODEL_FLASH ?? "gemini-2.0-flash";
  return byteLength >= threshold ? pro : flash;
}

export async function extractStructuredFromDocument(params: {
  mimeType: string;
  bytes: Buffer;
}): Promise<{ data: unknown; rawText: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const modelName = pickModel(params.bytes.length);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: RESPONSE_SCHEMA as any,
    },
  });

  const base64 = params.bytes.toString("base64");
  const prompt = `${SYSTEM_PROMPT}\nReturn exactly one JSON object that matches the schema. If an image or video contains multiple documents, extract the primary document and mention the others in full_ocr_text.`;

  const res = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: params.mimeType, data: base64 } },
        ],
      },
    ],
  });

  const rawText = res.response.text();
  const parsed = JSON.parse(rawText);
  const data = Array.isArray(parsed) ? parsed[0] : parsed;

  return { data, rawText, model: modelName };
}
