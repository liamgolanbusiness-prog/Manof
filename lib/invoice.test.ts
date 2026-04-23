import { describe, it, expect } from "vitest";
import { computeTotals, formatInvoiceNumber, lineTotal } from "./invoice";

describe("lineTotal", () => {
  it("multiplies qty × price with 2dp rounding", () => {
    expect(lineTotal(3, 100)).toBe(300);
    expect(lineTotal(2.5, 10.333)).toBe(25.83);
  });
  it("coerces invalid numerics to 0", () => {
    expect(lineTotal(NaN, 100)).toBe(0);
    expect(lineTotal(1, Infinity as unknown as number)).toBe(0);
  });
});

describe("computeTotals — VAT-exclusive", () => {
  it("adds 18% VAT on top when vatIncluded=false", () => {
    const t = computeTotals(
      [{ description: "x", quantity: 1, unit_price: 100 }],
      18,
      false
    );
    expect(t.subtotal).toBe(100);
    expect(t.vat_amount).toBe(18);
    expect(t.total).toBe(118);
  });

  it("applies discount after VAT", () => {
    const t = computeTotals(
      [{ description: "x", quantity: 10, unit_price: 50 }],
      18,
      false,
      100
    );
    expect(t.subtotal).toBe(500);
    expect(t.vat_amount).toBe(90);
    expect(t.total).toBe(490); // 500 + 90 - 100
  });
});

describe("computeTotals — VAT-inclusive", () => {
  it("backs VAT out of gross-inclusive prices", () => {
    const t = computeTotals(
      [{ description: "x", quantity: 1, unit_price: 118 }],
      18,
      true
    );
    expect(t.subtotal).toBe(100);
    expect(t.vat_amount).toBe(18);
    expect(t.total).toBe(118);
  });

  it("handles 17% rate (Israeli rate pre-2025)", () => {
    const t = computeTotals(
      [{ description: "x", quantity: 1, unit_price: 117 }],
      17,
      true
    );
    expect(t.subtotal).toBe(100);
    expect(t.vat_amount).toBe(17);
  });
});

describe("formatInvoiceNumber", () => {
  it("uses profile prefix when set", () => {
    expect(formatInvoiceNumber("tax_invoice", 42, "ATAR", 2026)).toBe(
      "ATAR-2026-0042"
    );
  });
  it("falls back to type-based prefix", () => {
    expect(formatInvoiceNumber("tax_invoice", 1, null, 2026)).toBe("INV-2026-0001");
    expect(formatInvoiceNumber("quote", 7, "", 2026)).toBe("Q-2026-0007");
    expect(formatInvoiceNumber("receipt", 100, null, 2026)).toBe("R-2026-0100");
  });
  it("zero-pads to 4 digits and stretches past for large numbers", () => {
    expect(formatInvoiceNumber("tax_invoice", 1, "X", 2026)).toBe("X-2026-0001");
    expect(formatInvoiceNumber("tax_invoice", 12345, "X", 2026)).toBe(
      "X-2026-12345"
    );
  });
});
