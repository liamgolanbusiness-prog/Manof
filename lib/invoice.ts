import type { InvoiceType } from "@/lib/supabase/database.types";

// Formats a running invoice number for display, e.g. "INV-2026-0042".
// Pattern: [prefix-]YYYY-NNNN where YYYY = issue_date year, NNNN = zero-padded.
export function formatInvoiceNumber(
  type: InvoiceType,
  numberInt: number,
  prefix: string | null | undefined,
  year: number
): string {
  const typePrefix: Record<InvoiceType, string> = {
    quote: "Q",
    tax_invoice: "INV",
    receipt: "R",
    tax_receipt: "TR",
  };
  const p = (prefix && prefix.trim()) || typePrefix[type];
  return `${p}-${year}-${String(numberInt).padStart(4, "0")}`;
}

export type ItemInput = {
  description: string;
  quantity: number;
  unit_price: number;
  unit?: string;
};

export type Totals = {
  subtotal: number;
  vat_amount: number;
  total: number;
};

// vatIncluded=true means unit_price already contains VAT — back it out.
// Matches how Israeli contractors often quote "הכול כולל".
export function computeTotals(
  items: ItemInput[],
  vatRate: number,
  vatIncluded: boolean,
  discountAmount = 0
): Totals {
  const grossSum = items.reduce((s, it) => {
    const line = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
    return s + (Number.isFinite(line) ? line : 0);
  }, 0);

  let subtotal: number;
  let vat_amount: number;
  if (vatIncluded) {
    const factor = 1 + vatRate / 100;
    subtotal = grossSum / factor;
    vat_amount = grossSum - subtotal;
  } else {
    subtotal = grossSum;
    vat_amount = (grossSum * vatRate) / 100;
  }

  const total = subtotal + vat_amount - (discountAmount || 0);
  return {
    subtotal: round2(subtotal),
    vat_amount: round2(vat_amount),
    total: round2(total),
  };
}

export function lineTotal(qty: number, price: number): number {
  return round2((Number(qty) || 0) * (Number(price) || 0));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
