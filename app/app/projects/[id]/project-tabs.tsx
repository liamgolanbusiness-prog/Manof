"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CalendarDays, BookOpen, Wallet, Users, ListTodo, Share2, FileText, Package } from "lucide-react";

const TABS = [
  { key: "today", label: "היום", icon: CalendarDays },
  { key: "diary", label: "יומן", icon: BookOpen },
  { key: "money", label: "כסף", icon: Wallet },
  { key: "invoices", label: "חשבוניות", icon: FileText },
  { key: "materials", label: "חומרים", icon: Package },
  { key: "people", label: "אנשים", icon: Users },
  { key: "tasks", label: "משימות", icon: ListTodo },
  { key: "client", label: "לקוח", icon: Share2 },
] as const;

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  return (
    <nav
      className="flex overflow-x-auto no-scrollbar -mx-4 px-4 gap-1"
      aria-label="ניווט פרויקט"
    >
      {TABS.map((t) => {
        const href = `/app/projects/${projectId}/${t.key}`;
        const active = pathname === href || pathname.startsWith(href + "/");
        const Icon = t.icon;
        return (
          <Link
            key={t.key}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap tap",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
