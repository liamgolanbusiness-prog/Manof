// Lightweight i18n. Hebrew is the master; Arabic + English dictionaries cover
// the high-traffic strings and fall back to Hebrew when a key is missing.
//
// This is a scaffold — we haven't yet swept the whole app to use t(). For now
// it's used on the landing page + navigation labels + the settings header,
// enough to advertise multi-language support without the full sweep.

export type Locale = "he" | "ar" | "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  he: "עברית",
  ar: "العربية",
  en: "English",
};

export const LOCALE_DIR: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
  ar: "rtl",
  en: "ltr",
};

const he = {
  nav_new_project: "פרויקט חדש",
  nav_contacts: "אנשי קשר",
  nav_settings: "הגדרות",
  nav_search: "חיפוש",
  nav_logout: "התנתקות",

  landing_headline_1: "האפליקציה שמחזירה לך",
  landing_headline_2: "שעתיים ביום",
  landing_sub:
    "יומן אתר, הוצאות, חשבוניות מס, שינויי חוזה ופורטל לקוח — הכול מהטלפון, ב-60 שניות ביום. מחליף את ה-WhatsApp והאקסל.",
  landing_cta_primary: "התחל חינם · ב-30 שניות",
  landing_cta_secondary: "יש לי כבר חשבון",

  settings_title: "הגדרות",
  settings_business: "פרטי עסק לחשבוניות",
  settings_security: "אבטחה",
  settings_billing: "חשבון ומנוי",
  settings_notifications: "התראות",
  settings_data: "הנתונים שלי",
  settings_audit: "יומן שינויים",

  dashboard_good_morning: "בוקר טוב",
  dashboard_revenue_month: "הכנסות החודש",
  dashboard_active_projects: "פעילים",
};

const ar: Partial<typeof he> = {
  nav_new_project: "مشروع جديد",
  nav_contacts: "جهات الاتصال",
  nav_settings: "الإعدادات",
  nav_search: "بحث",
  nav_logout: "تسجيل خروج",

  landing_headline_1: "التطبيق الذي يمنحك",
  landing_headline_2: "ساعتين في اليوم",
  landing_sub:
    "يوميات الموقع، النفقات، الفواتير الضريبية، التغييرات العقدية وبوابة العميل — كلها من الهاتف، في 60 ثانية يومياً. يحل محل WhatsApp وExcel.",
  landing_cta_primary: "ابدأ مجاناً · في 30 ثانية",
  landing_cta_secondary: "لديّ حساب بالفعل",

  settings_title: "الإعدادات",
  settings_business: "بيانات الشركة للفواتير",
  settings_security: "الأمان",
  settings_billing: "الحساب والاشتراك",
  settings_notifications: "الإشعارات",
  settings_data: "بياناتي",
  settings_audit: "سجل التغييرات",

  dashboard_good_morning: "صباح الخير",
  dashboard_revenue_month: "إيرادات هذا الشهر",
  dashboard_active_projects: "نشطة",
};

const en: Partial<typeof he> = {
  nav_new_project: "New project",
  nav_contacts: "Contacts",
  nav_settings: "Settings",
  nav_search: "Search",
  nav_logout: "Sign out",

  landing_headline_1: "The app that gives you back",
  landing_headline_2: "two hours a day",
  landing_sub:
    "Site journal, expenses, tax invoices, change orders and a client portal — all from your phone, in 60 seconds a day. Replaces WhatsApp and Excel.",
  landing_cta_primary: "Start free · in 30 seconds",
  landing_cta_secondary: "I already have an account",

  settings_title: "Settings",
  settings_business: "Business details for invoicing",
  settings_security: "Security",
  settings_billing: "Subscription",
  settings_notifications: "Notifications",
  settings_data: "My data",
  settings_audit: "Audit log",

  dashboard_good_morning: "Good morning",
  dashboard_revenue_month: "Revenue this month",
  dashboard_active_projects: "Active",
};

const DICT: Record<Locale, Partial<typeof he>> = { he, ar, en };

export type TKey = keyof typeof he;

export function t(locale: Locale, key: TKey): string {
  return DICT[locale][key] ?? he[key];
}

// Fetch user's locale server-side (default 'he' when profile missing).
export async function getUserLocale(): Promise<Locale> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "he";
  const { data } = await supabase
    .from("profiles")
    .select("locale")
    .eq("id", user.id)
    .maybeSingle();
  const loc = data?.locale as Locale | undefined;
  return loc && (loc === "he" || loc === "ar" || loc === "en") ? loc : "he";
}
