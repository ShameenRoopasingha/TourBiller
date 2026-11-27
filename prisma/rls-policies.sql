-- Defense-in-depth Supabase PostgreSQL Row-Level Security (RLS) policies for Vigil (TB-3 / I6).
-- Note: Prisma connects using the service/postgres role (which typically has BYPASSRLS in Supabase unless scoped).
-- Applying RLS prevents accidental anon/authenticated PostgREST access via NEXT_PUBLIC_SUPABASE_ANON_KEY.

ALTER TABLE public.business_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_schedule_day_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_swap_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_workstations ENABLE ROW LEVEL SECURITY;

-- Optional app-session scoped policy template when connecting with a non-superuser role setting `app.company_id`:
-- CREATE POLICY tenant_isolation_bills ON public.bills
--   USING ("companyId" = current_setting('app.company_id', true))
--   WITH CHECK ("companyId" = current_setting('app.company_id', true));
