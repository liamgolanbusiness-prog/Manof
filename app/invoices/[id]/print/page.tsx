import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDateShort } from "@/lib/format";
import {
  INVOICE_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
  type InvoiceType,
  type InvoiceStatus,
} from "@/lib/supabase/database.types";
import { PrintButton } from "./print-button";

export const metadata = {
  title: "הדפסת מסמך · אתר",
};

export default async function InvoicePrintPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();

  const [{ data: invoice }, { data: items }, { data: profile }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", params.id)
      .order("sort_order"),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  if (!invoice) notFound();

  const type = invoice.type as InvoiceType;
  const status = invoice.status as InvoiceStatus;

  return (
    <div lang="he" dir="rtl" className="bg-white text-black min-h-screen">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          @page { margin: 16mm; size: A4; }
        }
        .print-page { max-width: 210mm; margin: 0 auto; padding: 24px; }
      `}</style>

      <div className="no-print sticky top-0 bg-primary/5 border-b p-3 flex items-center justify-between print:hidden">
        <div className="text-sm font-medium">{INVOICE_TYPE_LABELS[type]} — {invoice.doc_number}</div>
        <div className="flex gap-2">
          <a href={`/app/projects/${invoice.project_id}/invoices`} className="text-sm text-muted-foreground hover:underline">
            חזרה
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="print-page">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 pb-4 border-b">
          <div className="flex-1 space-y-0.5">
            {profile?.logo_url ? (
              <div className="relative h-14 w-14 mb-2">
                <Image src={profile.logo_url} alt="" fill sizes="56px" className="object-contain" />
              </div>
            ) : null}
            <div className="text-xl font-bold">{profile?.business_name || profile?.full_name || "עסק"}</div>
            {profile?.tax_id ? (
              <div className="text-sm">
                {taxIdLabel(profile.tax_id_type)} {profile.tax_id}
              </div>
            ) : null}
            {profile?.address || profile?.city ? (
              <div className="text-sm">{[profile.address, profile.city].filter(Boolean).join(", ")}</div>
            ) : null}
            {profile?.phone ? <div className="text-sm" dir="ltr">{profile.phone}</div> : null}
            {profile?.email ? <div className="text-sm" dir="ltr">{profile.email}</div> : null}
          </div>

          <div className="text-end">
            <div className="text-2xl font-bold">{INVOICE_TYPE_LABELS[type]}</div>
            <div className="font-mono text-lg" dir="ltr">{invoice.doc_number}</div>
            <div className="text-sm text-muted-foreground">
              תאריך: {formatDateShort(invoice.issue_date)}
            </div>
            {invoice.due_date ? (
              <div className="text-sm text-muted-foreground">
                לתשלום עד: {formatDateShort(invoice.due_date)}
              </div>
            ) : null}
            {invoice.valid_until ? (
              <div className="text-sm text-muted-foreground">
                בתוקף עד: {formatDateShort(invoice.valid_until)}
              </div>
            ) : null}
            {status === "cancelled" ? (
              <div className="mt-1 inline-block rounded px-2 py-0.5 text-xs bg-red-100 text-red-700 border border-red-300">
                בוטל
              </div>
            ) : status === "paid" ? (
              <div className="mt-1 inline-block rounded px-2 py-0.5 text-xs bg-green-100 text-green-700 border border-green-300">
                {INVOICE_STATUS_LABELS.paid}
              </div>
            ) : null}
          </div>
        </header>

        {/* To */}
        <section className="py-4 border-b">
          <div className="text-xs text-muted-foreground mb-1">לכבוד</div>
          <div className="font-bold text-lg">{invoice.client_name}</div>
          {invoice.client_tax_id ? (
            <div className="text-sm">ח.פ./ע.מ. {invoice.client_tax_id}</div>
          ) : null}
          {invoice.client_address ? <div className="text-sm">{invoice.client_address}</div> : null}
          {invoice.client_phone ? (
            <div className="text-sm" dir="ltr">{invoice.client_phone}</div>
          ) : null}
          {invoice.client_email ? (
            <div className="text-sm" dir="ltr">{invoice.client_email}</div>
          ) : null}
        </section>

        {/* Items */}
        <section className="py-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-start py-2 px-1">תיאור</th>
                <th className="text-end py-2 px-1 w-20">כמות</th>
                <th className="text-end py-2 px-1 w-16">יח׳</th>
                <th className="text-end py-2 px-1 w-28">מחיר יח׳</th>
                <th className="text-end py-2 px-1 w-28">סה״כ</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((it) => (
                <tr key={it.id} className="border-b">
                  <td className="py-2 px-1 align-top">{it.description}</td>
                  <td className="text-end py-2 px-1 align-top">{Number(it.quantity)}</td>
                  <td className="text-end py-2 px-1 align-top">{it.unit ?? ""}</td>
                  <td className="text-end py-2 px-1 align-top" dir="ltr">
                    {formatCurrency(Number(it.unit_price))}
                  </td>
                  <td className="text-end py-2 px-1 align-top font-medium" dir="ltr">
                    {formatCurrency(Number(it.line_total))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals */}
        <section className="flex justify-end py-4 border-t">
          <div className="w-full sm:w-80 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>סה״כ לפני מע״מ</span>
              <span dir="ltr">{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span>מע״מ ({Number(invoice.vat_rate)}%)</span>
              <span dir="ltr">{formatCurrency(Number(invoice.vat_amount))}</span>
            </div>
            {Number(invoice.discount_amount) > 0 ? (
              <div className="flex justify-between">
                <span>הנחה</span>
                <span dir="ltr">-{formatCurrency(Number(invoice.discount_amount))}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-black">
              <span>סה״כ לתשלום</span>
              <span dir="ltr">{formatCurrency(Number(invoice.total))}</span>
            </div>
            {Number(invoice.amount_paid) > 0 ? (
              <div className="flex justify-between text-green-700">
                <span>שולם</span>
                <span dir="ltr">{formatCurrency(Number(invoice.amount_paid))}</span>
              </div>
            ) : null}
          </div>
        </section>

        {invoice.notes ? (
          <section className="py-4 border-t text-sm whitespace-pre-line">
            <div className="text-xs text-muted-foreground mb-1">הערות</div>
            {invoice.notes}
          </section>
        ) : null}

        {/* Payment instructions */}
        {(profile?.bank_account || profile?.bit_phone) && type !== "quote" && status !== "paid" ? (
          <section className="py-4 border-t text-sm space-y-1">
            <div className="text-xs text-muted-foreground">פרטי תשלום</div>
            {profile.bank_account ? (
              <div>
                העברה: בנק {profile.bank_name ?? ""} סניף {profile.bank_branch ?? ""} חשבון{" "}
                <span dir="ltr">{profile.bank_account}</span>
              </div>
            ) : null}
            {profile.bit_phone ? (
              <div>
                Bit: <span dir="ltr">{profile.bit_phone}</span>
              </div>
            ) : null}
          </section>
        ) : null}

        {invoice.footer ? (
          <footer className="py-4 border-t text-xs text-muted-foreground whitespace-pre-line">
            {invoice.footer}
          </footer>
        ) : null}

        <div className="no-print text-center pt-6 text-xs text-muted-foreground">
          לחץ &quot;הדפס&quot; ובחר &quot;שמור כ-PDF&quot; כדי לייצר קובץ PDF
        </div>
      </div>
    </div>
  );
}

function taxIdLabel(kind: string | null | undefined): string {
  switch (kind) {
    case "osek_morshe":
      return "עוסק מורשה";
    case "osek_patur":
      return "עוסק פטור";
    case "company":
      return "ח.פ.";
    case "individual":
      return "ת.ז.";
    default:
      return "";
  }
}
