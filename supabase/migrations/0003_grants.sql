-- ============================================================================
-- Table-level privilege grants.
--
-- Row Level Security only controls *which rows* a role can see — it does
-- nothing unless the role also has base SQL privileges on the table at all.
-- Supabase's own dashboard/CLI tooling applies these automatically when you
-- create a table, but tables created by running raw SQL directly in the SQL
-- Editor don't get them, which surfaces as PostgREST error 42501
-- ("permission denied for table ..."). RLS policies (0001_init.sql) remain
-- the actual security boundary; this just lets the roles query at all.
-- ============================================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.categories,
  public.providers,
  public.documents,
  public.document_extractions,
  public.bills,
  public.payments,
  public.document_matches,
  public.notifications,
  public.user_settings
to authenticated;

-- System rows (user_id is null) on these two are meant to be readable even
-- pre-auth per their RLS policy; harmless to expose read-only at the anon
-- role too since RLS still hides every user-owned row from anon.
grant select on public.categories, public.providers to anon;

-- Ensures future tables created the same way inherit these grants too.
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;
