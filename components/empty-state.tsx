import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-card p-8 text-center space-y-3">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      {children ? (
        <div className="text-sm text-muted-foreground max-w-sm mx-auto">{children}</div>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
