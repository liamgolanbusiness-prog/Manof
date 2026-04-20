// Israeli phone normalization + validation.
//
// Accepted inputs (whitespace / dashes / parens ignored):
//   054-123-4567     -> 0541234567
//   +972-54-123-4567 -> 0541234567
//   972541234567     -> 0541234567
//   03-1234567       -> 031234567
//   0541234567       -> 0541234567
//
// Normalized form is the "0"-prefixed national number with no separators.

const MOBILE = /^05\d{8}$/;        // 05X-XXXXXXX (10 digits)
const LANDLINE = /^0[23489]\d{7}$/; // 02/03/04/08/09 + 7 digits (9 digits)
const SPECIAL = /^07\d{8}$/;        // 07X prepaid / VoIP (10 digits)

export function normalizeIsraeliPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = String(input).trim();
  if (!s) return null;

  // Strip everything except digits and leading +
  s = s.replace(/[^\d+]/g, "");
  // Convert +972 / 972 prefix to 0
  s = s.replace(/^\+972/, "0").replace(/^972/, "0");
  // Bare 9-digit mobile without leading 0 (e.g. "541234567") → prepend 0
  if (/^5\d{8}$/.test(s)) s = "0" + s;

  if (MOBILE.test(s) || LANDLINE.test(s) || SPECIAL.test(s)) return s;
  return null;
}

export function isValidIsraeliPhone(input: string | null | undefined): boolean {
  if (input == null) return true; // empty is allowed; "required" is enforced separately
  const s = String(input).trim();
  if (!s) return true;
  return normalizeIsraeliPhone(s) !== null;
}

/**
 * For display: turn `0541234567` into `054-123-4567`, `031234567` into `03-1234567`.
 * Falls back to the original input if the number doesn't parse.
 */
export function formatIsraeliPhone(input: string | null | undefined): string {
  if (!input) return "";
  const s = normalizeIsraeliPhone(input);
  if (!s) return String(input);
  if (s.length === 10) return `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6)}`;
  if (s.length === 9) return `${s.slice(0, 2)}-${s.slice(2)}`;
  return s;
}
