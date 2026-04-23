-- User locale preference. Hebrew is default; 'ar' = Arabic, 'en' = English.
-- Both Hebrew and Arabic are RTL so the layout direction stays the same.

alter table public.profiles
  add column if not exists locale text default 'he'
    check (locale in ('he','ar','en'));
