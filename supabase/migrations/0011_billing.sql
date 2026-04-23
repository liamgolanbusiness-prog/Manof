-- Subscription + billing scaffold. No payment processor wired yet — plan is
-- a plain text column the user can flip from free → pro. When Paddle or
-- Stripe lands, their webhook writes plan + subscription_status + subscription_ends_at.

alter table public.profiles
  add column if not exists plan                 text default 'free'
    check (plan in ('free','pro','enterprise')),
  add column if not exists subscription_status  text default 'active'
    check (subscription_status in ('active','trialing','past_due','cancelled','expired')),
  add column if not exists subscription_ends_at timestamptz,
  add column if not exists trial_ends_at        timestamptz;
