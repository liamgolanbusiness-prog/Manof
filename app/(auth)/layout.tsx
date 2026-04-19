import Link from "next/link";
import { HardHat } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="container h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <HardHat className="h-5 w-5 text-primary" />
            עתר
          </Link>
        </div>
      </header>
      <main className="flex-1 grid place-items-center py-10 px-4">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
