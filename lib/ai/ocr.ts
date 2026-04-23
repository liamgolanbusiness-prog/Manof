import { askClaude, extractJson, isAnthropicConfigured } from "./anthropic";

export type ReceiptFields = {
  amount: number | null;
  vat_amount: number | null;
  supplier_name: string | null;
  supplier_tax_id: string | null;
  date: string | null; // YYYY-MM-DD
  invoice_number: string | null;
  category_hint: string | null;
  notes: string | null;
  confidence: "high" | "medium" | "low";
};

export type OCRResult =
  | { ok: true; fields: ReceiptFields }
  | { ok: false; reason: "disabled" | "error"; message: string };

const SYSTEM = `You are a receipt/invoice OCR assistant for an Israeli construction contractor's app.
The user will send an image of a receipt, invoice (חשבונית), or credit-card slip — often in Hebrew.
Extract structured fields and return ONLY a JSON object — no markdown, no commentary.

Fields:
- amount: final total in ILS (number) including VAT if VAT appears on the document. Null if not found.
- vat_amount: the VAT (מע"מ) line amount if printed. Null if not present.
- supplier_name: the issuing business name (Hebrew OK).
- supplier_tax_id: Israeli ח.פ. or ע.מ. number if printed (digits only).
- date: issue date in YYYY-MM-DD. Assume DD/MM/YYYY on Israeli receipts.
- invoice_number: invoice/receipt running number if shown.
- category_hint: one of: "חומרי בניין", "עבודה", "כלים", "דלק", "אוכל", "משרד", "אחר".
- notes: one short Hebrew line of any extra detail worth keeping.
- confidence: "high" | "medium" | "low" based on image quality.

Return strict JSON. If you can't read the image, return all nulls with confidence:"low".`;

export async function ocrReceipt(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<OCRResult> {
  if (!isAnthropicConfigured()) {
    return { ok: false, reason: "disabled", message: "OCR לא מוגדר" };
  }
  try {
    const text = await askClaude({
      system: SYSTEM,
      maxTokens: 512,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
            { type: "text", text: "Extract the receipt fields as JSON." },
          ],
        },
      ],
    });
    const fields = extractJson<ReceiptFields>(text);
    if (!fields) {
      return { ok: false, reason: "error", message: "לא ניתן לפענח את הקבלה" };
    }
    return { ok: true, fields };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message };
  }
}
