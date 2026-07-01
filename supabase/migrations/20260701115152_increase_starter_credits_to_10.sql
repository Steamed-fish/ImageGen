alter table public.profiles
alter column credits_balance set default 10;

update public.profiles p
set credits_balance = credits_balance + 5
where exists (
  select 1
  from public.credit_transactions ct
  where ct.user_id = p.id
    and ct.reason = 'signup_bonus'
    and ct.amount = 5
);

update public.credit_transactions
set amount = 10
where reason = 'signup_bonus'
  and amount = 5;
