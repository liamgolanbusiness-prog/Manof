import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Search as SearchIcon,
  Building2,
  User,
  UsersRound,
  Wallet,
  BookOpen,
  ListTodo,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { formatIsraeliPhone } from "@/lib/phone";
import { INVOICE_TYPE_LABELS, type InvoiceType } from "@/lib/supabase/database.types";

const EXPENSE_CAT_LABELS: Record<string, string> = {
  materials: "חומרים",
  labor: "עבודה",
  subcontractor: "קבלן משנה",
  tools: "כלים",
  transport: "הובלה",
  permits: "רישוי",
  rent: "שכ״ד ציוד",
  other: "אחר",
};

export const metadata = { title: "חיפוש · אתר" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireUser();
  const q = (searchParams.q || "").trim();
  return (
    <div className="container py-5 max-w-2xl space-y-4">
      <form action="/app/search" method="get">
        <div className="relative">
          <SearchIcon className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            autoFocus
            defaultValue={q}
            placeholder="חפש פרויקט, איש קשר, הערה, חשבונית..."
            className="w-full rounded-xl border bg-background ps-10 pe-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </form>
      {q.length < 2 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          הקלד לפחות 2 תווים.
        </p>
      ) : (
        <Results q={q} />
      )}
    </div>
  );
}

async function Results({ q }: { q: string }) {
  const supabase = createClient();
  const pattern = `%${q.replace(/[%_]/g, "")}%`;

  const [projects, contacts, clients, expenses, reports, invoices, tasks] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, client_name, address, status")
      .or(`name.ilike.${pattern},client_name.ilike.${pattern},address.ilike.${pattern}`)
      .limit(10),
    supabase
      .from("contacts")
      .select("id, name, phone, role, trade")
      .or(`name.ilike.${pattern},phone.ilike.${pattern},trade.ilike.${pattern}`)
      .limit(10),
    supabase
      .from("clients")
      .select("id, name, phone, email")
      .or(`name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`)
      .limit(10),
    supabase
      .from("expenses")
      .select("id, project_id, amount, category, notes, expense_date")
      .or(`notes.ilike.${pattern},category.ilike.${pattern}`)
      .limit(10),
    supabase
      .from("daily_reports")
      .select("id, project_id, notes, report_date")
      .ilike("notes", pattern)
      .limit(10),
    supabase
      .from("invoices")
      .select("id, project_id, doc_number, type, client_name, total, issue_date")
      .or(`doc_number.ilike.${pattern},client_name.ilike.${pattern},notes.ilike.${pattern}`)
      .limit(10),
    supabase
      .from("tasks")
      .select("id, project_id, title, status, due_date")
      .ilike("title", pattern)
      .limit(10),
  ]);

  const anyHit =
    (projects.data?.length ?? 0) +
      (contacts.data?.length ?? 0) +
      (clients.data?.length ?? 0) +
      (expenses.data?.length ?? 0) +
      (reports.data?.length ?? 0) +
      (invoices.data?.length ?? 0) +
      (tasks.data?.length ?? 0) >
    0;

  if (!anyHit) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        לא נמצאו תוצאות.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {projects.data && projects.data.length > 0 ? (
        <Section icon={Building2} title="פרויקטים">
          {projects.data.map((p) => (
            <Link
              key={p.id}
              href={`/app/projects/${p.id}/today`}
              className="block rounded-xl border bg-card px-3 py-2 hover:bg-muted/50"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                {[p.client_name, p.address].filter(Boolean).join(" · ")}
              </div>
            </Link>
          ))}
        </Section>
      ) : null}

      {clients.data && clients.data.length > 0 ? (
        <Section icon={UsersRound} title="לקוחות">
          {clients.data.map((c) => (
            <Link
              key={c.id}
              href="/app/clients"
              className="block rounded-xl border bg-card px-3 py-2 hover:bg-muted/50"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                {[c.phone ? formatIsraeliPhone(c.phone) : null, c.email]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </Link>
          ))}
        </Section>
      ) : null}

      {contacts.data && contacts.data.length > 0 ? (
        <Section icon={User} title="אנשי קשר">
          {contacts.data.map((c) => (
            <Link
              key={c.id}
              href="/app/contacts"
              className="block rounded-xl border bg-card px-3 py-2 hover:bg-muted/50"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                {[c.role, c.trade, c.phone ? formatIsraeliPhone(c.phone) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </Link>
          ))}
        </Section>
      ) : null}

      {invoices.data && invoices.data.length > 0 ? (
        <Section icon={FileText} title="חשבוניות והצעות">
          {invoices.data.map((inv) => (
            <Link
              key={inv.id}
              href={`/app/projects/${inv.project_id}/invoices`}
              className="block rounded-xl border bg-card px-3 py-2 hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {INVOICE_TYPE_LABELS[inv.type as InvoiceType]}{" "}
                  <span className="font-mono text-xs" dir="ltr">
                    {inv.doc_number}
                  </span>
                </span>
                <span className="text-sm font-bold" dir="ltr">
                  {formatCurrency(Number(inv.total))}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {inv.client_name} · {formatDateShort(inv.issue_date)}
              </div>
            </Link>
          ))}
        </Section>
      ) : null}

      {expenses.data && expenses.data.length > 0 ? (
        <Section icon={Wallet} title="הוצאות">
          {expenses.data.map((e) => (
            <Link
              key={e.id}
              href={`/app/projects/${e.project_id}/money`}
              className="block rounded-xl border bg-card px-3 py-2 hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{EXPENSE_CAT_LABELS[e.category] ?? e.category}</span>
                <span className="text-sm font-bold" dir="ltr">
                  {formatCurrency(Number(e.amount))}
                </span>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {formatDateShort(e.expense_date)} · {e.notes ?? ""}
              </div>
            </Link>
          ))}
        </Section>
      ) : null}

      {reports.data && reports.data.length > 0 ? (
        <Section icon={BookOpen} title="יומני עבודה">
          {reports.data.map((r) => (
            <Link
              key={r.id}
              href={`/app/projects/${r.project_id}/diary/${r.id}`}
              className="block rounded-xl border bg-card px-3 py-2 hover:bg-muted/50"
            >
              <div className="text-xs text-muted-foreground">
                {formatDateShort(r.report_date)}
              </div>
              <div className="text-sm line-clamp-2">{r.notes}</div>
            </Link>
          ))}
        </Section>
      ) : null}

      {tasks.data && tasks.data.length > 0 ? (
        <Section icon={ListTodo} title="משימות">
          {tasks.data.map((t) => (
            <Link
              key={t.id}
              href={`/app/projects/${t.project_id}/tasks`}
              className="block rounded-xl border bg-card px-3 py-2 hover:bg-muted/50"
            >
              <div className="font-medium">{t.title}</div>
              {t.due_date ? (
                <div className="text-xs text-muted-foreground">
                  {formatDateShort(t.due_date)}
                </div>
              ) : null}
            </Link>
          ))}
        </Section>
      ) : null}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {title}
      </h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}
