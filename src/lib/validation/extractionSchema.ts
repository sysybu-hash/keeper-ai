import { z } from "zod";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .nullable();

export const extractionSchema = z.object({
  document_type: z.string().min(1),
  entity: z.string().nullable(),
  amount_due: z.number().finite().nullable(),
  currency: z.enum(["ILS", "USD", "EUR"]).nullable(),
  due_date: dateStr,
  issue_date: dateStr,
  is_urgent: z.boolean(),
  summary: z.string(),
  suggested_folder: z.string().min(1),
  references: z.object({
    invoice_number: z.string().nullable(),
    customer_id: z.string().nullable(),
  }),
  confidence: z.object({
    document_type: z.number().min(0).max(1),
    entity: z.number().min(0).max(1),
    amount_due: z.number().min(0).max(1),
    due_date: z.number().min(0).max(1),
  }),
  evidence_snippets: z.record(z.string(), z.string()).optional(),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;

export function shouldMarkNeedsReview(data: ExtractionResult): boolean {
  if (data.confidence.document_type < 0.65) return true;
  if (data.due_date && data.confidence.due_date < 0.72) return true;
  if (data.amount_due != null && data.confidence.amount_due < 0.65) return true;
  return false;
}
