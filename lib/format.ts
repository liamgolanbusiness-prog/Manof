import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";
import { he } from "date-fns/locale";

export function formatCurrency(amount: number | null | undefined): string {
  const n = typeof amount === "number" ? amount : 0;
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(n: number | null | undefined): string {
  return new Intl.NumberFormat("he-IL").format(n ?? 0);
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return format(d, "d בMMMM yyyy", { locale: he });
}

export function formatDateShort(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return format(d, "d.M.yyyy", { locale: he });
}

export function formatWeekday(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return format(d, "EEEE", { locale: he });
}

export function formatRelative(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (isToday(d)) return "היום";
  if (isYesterday(d)) return "אתמול";
  return formatDistanceToNowStrict(d, { addSuffix: true, locale: he });
}

export function isoDate(value: Date = new Date()): string {
  // YYYY-MM-DD, local timezone — matches Supabase `date` column
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
