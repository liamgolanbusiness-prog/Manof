import Link from "next/link";
import { HardHat } from "lucide-react";

export const metadata = { title: "תנאי שימוש · אתר" };

export default function TermsPage() {
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
        <h1 className="text-2xl font-bold">תנאי שימוש</h1>
        <p className="text-muted-foreground">עדכון אחרון: {new Date().getFullYear()}</p>

        <section className="space-y-2">
          <h2 className="font-semibold">השירות</h2>
          <p>
            אתר היא אפליקציה לניהול פרויקטים, חשבוניות ומעקב אחר אתרי בנייה.
            השירות ניתן AS-IS וללא אחריות לגבי זמינות או התאמה למטרה מסוימת.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold">אחריות המשתמש</h2>
          <p>
            אתה אחראי לכל תוכן שאתה מזין למערכת, לדיוק המספרי של חשבוניות שאתה
            מנפיק, ולשמירה על סודיות הסיסמה שלך. אין להשתמש במערכת לפעילות לא
            חוקית.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold">הנפקת חשבוניות</h2>
          <p>
            החשבוניות המופקות באתר כפופות לדיני מיסים בישראל (מע״מ, מס הכנסה).
            אתה אחראי לעמידה בחובות הדיווח שלך. המערכת מספקת כלי עזר, אינה
            מהווה ייעוץ מקצועי.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold">תשלום ושדרוג</h2>
          <p>
            תוכנית חינם כוללת הגבלות מסוימות. שדרוג לתוכנית בתשלום מתחדש
            אוטומטית. ניתן לבטל בכל עת.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold">הפסקת שירות</h2>
          <p>
            אנו שומרים לעצמנו את הזכות להשעות או לסיים חשבון שמפר את תנאי
            השימוש. במקרה כזה, תינתן התראה סבירה לייצוא המידע.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-semibold">דין חל</h2>
          <p>על תנאים אלה חל הדין הישראלי. סמכות השיפוט נתונה לבתי המשפט בישראל.</p>
        </section>
      </article>
    </main>
  );
}
