-- One daily_report per (project, date).
-- The app upserts on this key; without the constraint two reports could race.

alter table public.daily_reports
  add constraint daily_reports_project_date_uq
  unique (project_id, report_date);
