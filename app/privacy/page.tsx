import Link from "next/link";
import { HardHat } from "lucide-react";

export const metadata = { title: "מדיניות פרטיות · אתר" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <HardHat className="h-5 w-5 text-primary" />
            אתר
          </Link>
        </div>
      </header>
      <article className="container max-w-2xl py-8 space-y-4 text-sm">
        <h1 className="text-2xl font-bold">מדיניות פרטיות</h1>
        <p className="text-muted-foreground">עדכון אחרון: {new Date().getFullYear()}</p>

        <section className="space-y-2">
          <h2 className="font-semibold">איזה מידע אנו אוספים</h2>
          <p>
            אתר (&quot;האפליקציה&quot;) אוספת את המידע שאתה מזין באופן פעיל: פרטי
            עסק, אנשי קשר, פרויקטים, יומנים, תמונות, חשבוניות, והערות קוליות.
            בנוסף אנו שומרים לוגים טכניים בסיסיים (כתובת IP, סוג דפדפן) לצרכי
            אבטחה ודיבוג.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold">איך המידע מאוחסן</h2>
          <p>
            כל המידע מאוחסן ב־Supabase (פלטפורמת ענן מאובטחת). גישה לכל שורה
            מוגבלת על ידי Row-Level Security — אין למשתמש אחד גישה לנתוני משתמש
            אחר.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold">פורטל ללקוח</h2>
          <p>
            כאשר אתה משתף קישור פורטל עם לקוח, הלקוח רואה רק את המידע הקשור לאותו
            הפרויקט. ניתן להגדיר קוד כניסה, תפוגה ולבטל את הגישה בכל רגע.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold">זכויותיך</h2>
          <p>
            אתה יכול למחוק את החשבון ואת כל הנתונים בכל עת דרך &quot;הגדרות
            עסק&quot;, או על ידי פנייה אלינו. ניתן לקבל עותק של כל הנתונים בפורמט
            ניתן לקריאה במכונה.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold">צד שלישי</h2>
          <p>
            איננו מוכרים או משתפים את המידע שלך עם צד שלישי לשיווק. אנו משתמשים
            בספקי שירות תשתיתיים (Supabase, Vercel, שירותי מייל) שמחויבים
            לשמירה על סודיות המידע.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold">יצירת קשר</h2>
          <p>שאלות? צור קשר דרך עמוד ההגדרות בתוך האפליקציה.</p>
        </section>
      </article>
    </main>
  );
}
