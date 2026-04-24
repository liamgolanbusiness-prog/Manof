import Link from "next/link";
import { FileText, FileEdit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { InvoiceList } from "./invoice-list";
import { NewInvoiceButton } from "./new-invoice-button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { INVOICE_TYPE_LABELS, type InvoiceType } from "@/lib/supabase/database.types";

export default async function InvoicesTab({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { type?: string };
}) {
  const user = await requireUser();
  const supabase = createClient();

  const [{ data: project }, { data: profile }, { data: clients }, { data: invoices }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, client_id, client_name, client_phone, contract_value")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select(
          "business_name, tax_id, vat_rate, vat_included, invoice_prefix, invoice_footer, next_invoice_number, next_quote_number, next_receipt_number"
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("clients")
        .select("id, name, phone, email, tax_id, billing_address")
        .eq("user_id", user.id)
        .order("name"),
      supabase
        .from("invoices")
        .select(
          "id, type, doc_number, status, client_name, issue_date, due_date, total, amount_paid, accepted_at, cancelled_at"
        )
        .eq("project_id", params.id)
        .eq("user_id", user.id)
        .order("issue_date", { ascending: false })
        .order("number_int", { ascending: false }),
    ]);

  if (!project) notFound();

  const active = (searchParams.type || "all") as InvoiceType | "all";
  const byType = (t: InvoiceType | "all") =>
    (invoices ?? []).filter((i) => t === "all" || i.type === t);

  const notConfigured = !profile?.business_name || !profile?.tax_id;

  return (
    <div className="container py-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          חשבוניות והצעות מחיר
        </h1>
        <div className="flex items-center gap-2">
          <Link href={`/app/projects/${params.id}/changes`}>
            <Button variant="outline" size="sm" className="gap-1">
              <FileEdit className="h-4 w-4" />
              שינויי חוזה
            </Button>
          </Link>
        <NewInvoiceButton
          projectId={project.id}
          projectClientName={project.client_name ?? ""}
          projectClientPhone={project.client_phone ?? ""}
          projectContractValue={project.contract_value ?? null}
          defaultVatRate={Number(profile?.vat_rate ?? 18)}
          defaultVatIncluded={!!profile?.vat_included}
          defaultFooter={profile?.invoice_footer ?? ""}
          clients={clients ?? []}
        />
        </div>
      </div>

      {notConfigured ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
          <div className="font-semibold">חסרים פרטי עסק</div>
          <div className="text-muted-foreground">
            לפני הוצאת חשבונית הוסף שם עסק + ח.פ./ע.מ. ב
            <a className="text-primary font-medium hover:underline" href="/app/settings">
              {" "}הגדרות עסק
            </a>
            .
          </div>
        </div>
      ) : null}

      <Tabs defaultValue={active}>
        <TabsList>
          <TabsTrigger value="all">הכול ({(invoices ?? []).length})</TabsTrigger>
          <TabsTrigger value="tax_invoice">
            {INVOICE_TYPE_LABELS.tax_invoice} ({byType("tax_invoice").length})
          </TabsTrigger>
          <TabsTrigger value="quote">
            {INVOICE_TYPE_LABELS.quote} ({byType("quote").length})
          </TabsTrigger>
          <TabsTrigger value="receipt">
            {INVOICE_TYPE_LABELS.receipt} ({byType("receipt").length})
          </TabsTrigger>
        </TabsList>

        {(["all", "tax_invoice", "quote", "receipt"] as const).map((t) => (
          <TabsContent key={t} value={t} className="mt-3">
            {byType(t as InvoiceType | "all").length === 0 ? (
              <EmptyState icon={FileText} title="אין מסמכים עדיין">
                לחץ &quot;מסמך חדש&quot; כדי להוציא חשבונית מס, קבלה או הצעת מחיר.
              </EmptyState>
            ) : (
              <InvoiceList
                projectId={project.id}
                invoices={byType(t as InvoiceType | "all")}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
