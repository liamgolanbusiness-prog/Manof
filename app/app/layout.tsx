import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { HardHat, LogOut, Plus, Search, Settings as SettingsIcon, User } from "lucide-react";
import { OfflineBanner } from "@/components/offline-banner";
import { InstallPrompt } from "@/components/install-prompt";
import { getUserLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = createClient();
  const [{ data: profile }, locale] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, business_name")
      .eq("id", user.id)
      .maybeSingle(),
    getUserLocale(),
  ]);

  const displayName = profile?.full_name || profile?.business_name || user.email;

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="container h-14 flex items-center justify-between gap-2">
          <Link href="/app" className="flex items-center gap-2 font-bold">
            <HardHat className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">אתר</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/app/search" aria-label={t(locale, "nav_search")}>
              <Button size="sm" variant="ghost" className="gap-1">
                <Search className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/app/projects/new">
              <Button size="sm" variant="ghost" className="gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t(locale, "nav_new_project")}</span>
              </Button>
            </Link>
            <Link href="/app/contacts">
              <Button size="sm" variant="ghost" className="gap-1">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t(locale, "nav_contacts")}</span>
              </Button>
            </Link>
            <Link href="/app/settings" aria-label={t(locale, "nav_settings")}>
              <Button size="sm" variant="ghost" className="gap-1">
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </Link>
            <form action={logoutAction}>
              <Button
                size="sm"
                variant="ghost"
                type="submit"
                className="gap-1 text-muted-foreground"
                aria-label={t(locale, "nav_logout")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <OfflineBanner />
      <InstallPrompt />
      {/* Slim user strip */}
      <div className="container py-1 text-xs text-muted-foreground truncate">
        שלום, {displayName}
      </div>
      {children}
    </div>
  );
}
