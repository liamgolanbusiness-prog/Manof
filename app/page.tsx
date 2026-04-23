import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  HardHat,
  FileText,
  Wallet,
  Users,
  Camera,
  Shield,
  Share2,
  Mic,
  CheckCircle2,
  Receipt,
  Building2,
  Zap,
  Quote,
} from "lucide-react";

export const metadata = {
  title: "אתר — ניהול אתרי בנייה וקבלני שיפוצים",
  description:
    "יומן אתר, הוצאות, חשבוניות מס, הצעות מחיר, ופורטל לקוח — הכול במקום אחד, מהטלפון. בנוי במיוחד לקבלנים בישראל.",
  openGraph: {
    title: "אתר — ניהול אתרי בנייה וקבלני שיפוצים",
    description:
      "יומן אתר, הוצאות, חשבוניות מס, הצעות מחיר, ופורטל לקוח — הכול במקום אחד.",
    type: "website",
    locale: "he_IL",
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 bg-background/90 backdrop-blur z-10">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <HardHat className="h-6 w-6 text-primary" />
            אתר
          </div>
          <nav className="flex items-center gap-2">
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-primary hidden sm:inline">
              תמחור
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                התחברות
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">הרשמה</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-14 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs">
            <Zap className="h-3 w-3 text-primary" />
            חדש בישראל · בנוי במיוחד לקבלנים
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            האפליקציה שמחזירה לך
            <br />
            <span className="text-primary">שעתיים ביום</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            יומן אתר, הוצאות, חשבוניות מס, שינויי חוזה ופורטל לקוח — הכול מהטלפון,
            ב-60 שניות ביום. מחליף את ה-WhatsApp והאקסל.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto tap h-12 text-base">
                התחל חינם · ב-30 שניות
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto tap h-12 text-base"
              >
                יש לי כבר חשבון
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            ללא כרטיס אשראי · עברית RTL · עובד בכל סמארטפון
          </p>
        </div>
      </section>

      {/* Pain / promise */}
      <section className="bg-muted/30 py-12">
        <div className="container max-w-3xl">
          <h2 className="text-center text-2xl md:text-3xl font-bold mb-8">
            לקבלן בישראל אין כלי שמבין אותו
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <PainCard
              problem="רשימת הוצאות באקסל"
              fix="לחיצה אחת — תמונת קבלה + סכום + ספק"
            />
            <PainCard
              problem="חשבונית מס בתוכנת הנה״ח"
              fix="הוצאת חשבונית מהאתר ישירות, מספור אוטומטי"
            />
            <PainCard
              problem="עדכונים ללקוח ב-WhatsApp"
              fix="פורטל אישי עם תמונות, התקדמות ותשלומים"
            />
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="container py-14">
        <h2 className="text-center text-2xl md:text-3xl font-bold mb-10">
          כל מה שקבלן צריך, בפחות מדקה ביום
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <Feature
            icon={<FileText className="h-5 w-5" />}
            title="יומן אתר יומי"
            text="נוכחות עובדים עם שעות, תמונות ישר מהמצלמה, בעיות, הערות קוליות."
          />
          <Feature
            icon={<Wallet className="h-5 w-5" />}
            title="כסף ברור"
            text="הוצאות ותשלומים עם תמונת קבלה, חוב פתוח לפי עובד, תזרים חי."
          />
          <Feature
            icon={<Receipt className="h-5 w-5" />}
            title="חשבונית מס + קבלה"
            text="הנפקה ישירה מהאתר, מספור עוקב, PDF להורדה, כל סוגי המסמכים."
          />
          <Feature
            icon={<Quote className="h-5 w-5" />}
            title="הצעות מחיר"
            text="הצעת מחיר עם פריטים, מע״מ, ואישור דיגיטלי של הלקוח דרך הפורטל."
          />
          <Feature
            icon={<Share2 className="h-5 w-5" />}
            title="פורטל ללקוח"
            text="קישור אישי מאובטח עם תמונות, אחוז התקדמות, תשלומים ושינויי חוזה."
          />
          <Feature
            icon={<Shield className="h-5 w-5" />}
            title="שינויי חוזה"
            text="סוף לוויכוחים — הלקוח מאשר כל שינוי דיגיטלית עם שמו ותאריך."
          />
          <Feature
            icon={<Mic className="h-5 w-5" />}
            title="הערות קוליות"
            text="ידיים מלוכלכות? תקליט הערה קולית במקום לכתוב."
          />
          <Feature
            icon={<Camera className="h-5 w-5" />}
            title="תמונות חכמות"
            text="כיווץ אוטומטי — חוסך ב-90% מחבילת הגלישה."
          />
          <Feature
            icon={<Building2 className="h-5 w-5" />}
            title="מרובה פרויקטים"
            text="4 פרויקטים בו-זמנית? לוח בקרה אחד שמסתכל על הכול."
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/30 py-14">
        <div className="container max-w-4xl">
          <h2 className="text-center text-2xl md:text-3xl font-bold mb-2">
            תמחור פשוט
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            חודש ראשון חינם לבדיקה. בטל מתי שבא לך.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <PriceCard
              name="חינם"
              price="0"
              period=""
              features={[
                "פרויקט אחד פעיל",
                "יומן אתר + תמונות",
                "פורטל ללקוח",
                "עד 3 חשבוניות בחודש",
              ]}
              cta="התחל חינם"
              ctaLink="/signup"
              highlight={false}
            />
            <PriceCard
              name="מקצועי"
              price="99"
              period="/חודש"
              features={[
                "פרויקטים ללא הגבלה",
                "חשבוניות מס + קבלות ללא הגבלה",
                "שינויי חוזה עם אישור דיגיטלי",
                "חומרים ומלאי",
                "פורטל ממותג (לוגו שלך)",
                "חוב עובדים + סגירת חודש",
                "ייצוא לאקסל/CSV",
              ]}
              cta="התחל ניסיון 30 יום"
              ctaLink="/signup"
              highlight
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            מחירים בש״ח, לא כולל מע״מ. ללא התחייבות.
          </p>
        </div>
      </section>

      {/* Social proof stub */}
      <section className="container py-12">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <Quote className="h-8 w-8 text-primary mx-auto" />
          <blockquote className="text-lg md:text-xl font-medium">
            &quot;פעם הייתי יושב בערב שעתיים לסכם את היום. עכשיו זה דקה, מהטלפון,
            מול הלקוח באתר. הכול מתועד, אין יותר ויכוחים על כסף.&quot;
          </blockquote>
          <p className="text-sm text-muted-foreground">— קבלן שיפוצים, תל אביב</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 border-y py-14">
        <div className="container max-w-xl text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">מוכן לנסות?</h2>
          <p className="text-muted-foreground">
            30 שניות להקמת חשבון, ואפשר לנסות דוגמה מיד — בלי להקליד כלום.
          </p>
          <Link href="/signup">
            <Button size="lg" className="tap h-12 text-base px-8">
              התחל עכשיו, חינם
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div>אתר © {new Date().getFullYear()} · כל הזכויות שמורות</div>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:text-primary">
              פרטיות
            </Link>
            <Link href="/terms" className="hover:text-primary">
              תנאי שימוש
            </Link>
            <Link href="/login" className="hover:text-primary">
              כניסה
            </Link>
          </nav>
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

function PainCard({ problem, fix }: { problem: string; fix: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="text-sm text-muted-foreground line-through">{problem}</div>
      <div className="text-sm font-semibold flex items-start gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
        <span>{fix}</span>
      </div>
    </div>
  );
}

function PriceCard({
  name,
  price,
  period,
  features,
  cta,
  ctaLink,
  highlight,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  ctaLink: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 bg-card space-y-4 ${highlight ? "border-primary shadow-lg" : ""}`}
    >
      <div>
        <div className="text-sm font-medium text-muted-foreground">{name}</div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-4xl font-bold">₪{price}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href={ctaLink} className="block">
        <Button
          className="w-full tap"
          variant={highlight ? "default" : "outline"}
          size="lg"
        >
          {cta}
        </Button>
      </Link>
    </div>
  );
}
