create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists credit_transactions_generation_id_idx
on public.credit_transactions(generation_id);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using ((select auth.uid()) = id);

drop policy if exists "generation_jobs_select_own" on public.generation_jobs;
create policy "generation_jobs_select_own"
on public.generation_jobs for select
using ((select auth.uid()) = user_id);

drop policy if exists "credit_transactions_select_own" on public.credit_transactions;
create policy "credit_transactions_select_own"
on public.credit_transactions for select
using ((select auth.uid()) = user_id);

drop policy if exists "upgrade_waitlist_select_own" on public.upgrade_waitlist;
create policy "upgrade_waitlist_select_own"
on public.upgrade_waitlist for select
using ((select auth.uid()) = user_id);

drop policy if exists "upgrade_waitlist_insert_own" on public.upgrade_waitlist;
create policy "upgrade_waitlist_insert_own"
on public.upgrade_waitlist for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "generated_images_select_own" on storage.objects;
create policy "generated_images_select_own"
on storage.objects for select
using (
  bucket_id = 'generated-images'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
