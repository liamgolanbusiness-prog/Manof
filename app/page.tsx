import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HardHat, FileText, Wallet, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <HardHat className="h-6 w-6 text-primary" />
            עתר
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">התחברות</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">הרשמה</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container flex-1 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            ניהול אתרי בנייה בקליק
          </h1>
          <p className="text-lg text-muted-foreground">
            יומן עבודה, הוצאות, אנשים ולקוחות — הכל במקום אחד, מהטלפון,
            בפחות מדקה ביום.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto tap">
                התחילו עכשיו
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto tap">
                יש לי חשבון
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-3xl mx-auto">
          <Feature
            icon={<FileText className="h-5 w-5" />}
            title="יומן עבודה"
            text="מה קרה היום באתר — נוכחות, תמונות, בעיות."
          />
          <Feature
            icon={<Wallet className="h-5 w-5" />}
            title="כסף"
            text="הוצאות ותשלומים, קבלות בתמונה, מצב פיננסי ברור."
          />
          <Feature
            icon={<Users className="h-5 w-5" />}
            title="לקוח מעודכן"
            text="קישור אישי ללקוח עם תמונות והתקדמות."
          />
        </div>
      </section>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          עתר © {new Date().getFullYear()}
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border p-4 bg-card">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
