create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  credits_balance integer not null default 5 check (credits_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('processing', 'completed', 'failed')),
  image_type text not null,
  aspect_ratio text not null,
  style text not null,
  scene text not null,
  whitespace text not null,
  subject text not null,
  extra_requirements text not null default '',
  compiled_prompt text not null,
  storage_path text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null check (reason in ('signup_bonus', 'generation')),
  generation_id uuid references public.generation_jobs(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists credit_transactions_one_signup_bonus_per_user
on public.credit_transactions(user_id)
where reason = 'signup_bonus';

create table if not exists public.upgrade_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  source text not null,
  created_at timestamptz not null default now(),
  unique (user_id, source)
);

create unique index if not exists generation_jobs_one_processing_per_user
on public.generation_jobs(user_id)
where status = 'processing';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.complete_generation_and_charge(
  p_user_id uuid,
  p_generation_id uuid,
  p_storage_path text
)
returns public.generation_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_job public.generation_jobs;
begin
  update public.profiles
  set credits_balance = credits_balance - 1
  where id = p_user_id and credits_balance >= 1;

  if not found then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  update public.generation_jobs
  set status = 'completed',
      storage_path = p_storage_path,
      completed_at = now(),
      error_message = null
  where id = p_generation_id
    and user_id = p_user_id
    and status = 'processing'
  returning * into updated_job;

  if updated_job.id is null then
    raise exception 'GENERATION_NOT_PROCESSING';
  end if;

  insert into public.credit_transactions(user_id, amount, reason, generation_id)
  values (p_user_id, -1, 'generation', p_generation_id);

  return updated_job;
end;
$$;

revoke execute on function public.complete_generation_and_charge(uuid, uuid, text) from public;
revoke execute on function public.complete_generation_and_charge(uuid, uuid, text) from anon;
revoke execute on function public.complete_generation_and_charge(uuid, uuid, text) from authenticated;
grant execute on function public.complete_generation_and_charge(uuid, uuid, text) to service_role;

create or replace function public.mark_generation_failed(
  p_user_id uuid,
  p_generation_id uuid,
  p_error_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.generation_jobs
  set status = 'failed',
      error_message = left(p_error_message, 1000),
      completed_at = now()
  where id = p_generation_id
    and user_id = p_user_id
    and status = 'processing';
end;
$$;

revoke execute on function public.mark_generation_failed(uuid, uuid, text) from public;
revoke execute on function public.mark_generation_failed(uuid, uuid, text) from anon;
revoke execute on function public.mark_generation_failed(uuid, uuid, text) from authenticated;
grant execute on function public.mark_generation_failed(uuid, uuid, text) to service_role;

alter table public.profiles enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.upgrade_waitlist enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "generation_jobs_select_own"
on public.generation_jobs for select
using (auth.uid() = user_id);

create policy "credit_transactions_select_own"
on public.credit_transactions for select
using (auth.uid() = user_id);

create policy "upgrade_waitlist_select_own"
on public.upgrade_waitlist for select
using (auth.uid() = user_id);

create policy "upgrade_waitlist_insert_own"
on public.upgrade_waitlist for insert
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('generated-images', 'generated-images', false)
on conflict (id) do nothing;

create policy "generated_images_select_own"
on storage.objects for select
using (
  bucket_id = 'generated-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
