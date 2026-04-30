import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractionSchema, type ExtractionResult } from "@/lib/validation/extractionSchema";

const SYSTEM_PROMPT = `You are a personal document assistant for Hebrew and mixed-language paperwork (Israeli context when relevant).
Analyze the attached document (image or PDF). Respond with a single JSON object only — no markdown, no code fences, no commentary.

JSON shape (all keys required; use null where unknown):
{
  "document_type": string,
  "entity": string | null,
  "amount_due": number | null,
  "currency": "ILS" | "USD" | "EUR" | null,
  "due_date": "YYYY-MM-DD" | null,
  "issue_date": "YYYY-MM-DD" | null,
  "is_urgent": boolean,
  "summary": string (short Hebrew or mixed summary),
  "suggested_folder": string, POSIX path without leading slash, e.g. "בית/חשבונות/ארנונה",
  "references": { "invoice_number": string | null, "customer_id": string | null },
  "confidence": {
    "document_type": number 0-1,
    "entity": number 0-1,
    "amount_due": number 0-1,
    "due_date": number 0-1
  },
  "evidence_snippets": optional object mapping field name to short quote from the document
}

Rules:
- due_date / issue_date must be ISO dates or null.
- amount_due is a number in major currency units (e.g. 450.5), or null.
- suggested_folder should reflect document_type (Hebrew folder names allowed).
- confidence reflects your certainty for each extracted field.`;

const REPAIR_PROMPT = `The following text was supposed to be JSON but may be invalid. Output one corrected JSON object only, matching the schema described earlier. If a value is unknown use null. Text to fix:`;

function pickModel(byteLength: number): string {
  const threshold = Number(process.env.GEMINI_PRO_BYTE_THRESHOLD ?? 5_000_000);
  const pro = process.env.GEMINI_MODEL_PRO ?? "gemini-2.0-pro";
  const flash = process.env.GEMINI_MODEL_FLASH ?? "gemini-2.0-flash";
  return byteLength >= threshold ? pro : flash;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(withoutFence) as unknown;
}

export async function extractStructuredFromDocument(params: {
  mimeType: string;
  bytes: Buffer;
}): Promise<{ data: ExtractionResult; rawText: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const modelName = pickModel(params.bytes.length);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const base64 = params.bytes.toString("base64");
  const res = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          { inlineData: { mimeType: params.mimeType, data: base64 } },
        ],
      },
    ],
  });
  const rawText = res.response.text();
  let parsed: unknown;
  try {
    parsed = parseJsonObject(rawText);
  } catch {
    const repair = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${REPAIR_PROMPT}\n\n${rawText.slice(0, 12000)}` }] },
      ],
    });
    const repaired = repair.response.text();
    parsed = parseJsonObject(repaired);
    const validated = extractionSchema.parse(parsed);
    return { data: validated, rawText: repaired, model: modelName };
  }

  const first = extractionSchema.safeParse(parsed);
  if (first.success) {
    return { data: first.data, rawText, model: modelName };
  }

  const repair2 = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${REPAIR_PROMPT}\n\n${JSON.stringify(parsed).slice(0, 12000)}`,
          },
        ],
      },
    ],
  });
  const repaired2 = repair2.response.text();
  const parsed2 = parseJsonObject(repaired2);
  const second = extractionSchema.parse(parsed2);
  return { data: second, rawText: repaired2, model: modelName };
}
