create type public.user_role as enum ('USER', 'ADMIN');
create type public.deposit_network as enum ('BEP20', 'ERC20', 'TRC20');
create type public.transaction_type as enum ('DEPOSIT', 'SELL');
create type public.transaction_status as enum ('PENDING', 'COMPLETED', 'FAILED');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'USER',
  usdt_balance numeric(30, 8) not null default 0 check (usdt_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  reviewed_by uuid references public.profiles (id) on delete restrict,
  type public.transaction_type not null,
  network public.deposit_network,
  amount numeric(30, 8) not null check (amount > 0),
  tx_hash text,
  status public.transaction_status not null default 'PENDING',
  from_address text,
  to_address text,
  required_confirmations integer,
  actual_confirmations integer,
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type = 'DEPOSIT' and network is not null and tx_hash is not null)
    or (type = 'SELL' and network is null and tx_hash is null)
  )
);

create unique index transactions_network_tx_hash_unique
  on public.transactions (network, tx_hash)
  where tx_hash is not null;
create index transactions_user_created_at_idx
  on public.transactions (user_id, created_at desc);
create index transactions_status_type_created_at_idx
  on public.transactions (status, type, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();
revoke all on function public.set_updated_at() from public, anon, authenticated, service_role;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is not null then
    insert into public.profiles (id, email)
    values (new.id, lower(new.email))
    on conflict (id) do update set email = excluded.email;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_auth_user();
revoke all on function public.handle_new_auth_user() from public, anon, authenticated, service_role;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

revoke all on public.profiles, public.transactions from public, anon, authenticated, service_role;
grant select on public.profiles, public.transactions to authenticated;

create policy profiles_select_self_or_admin
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy transactions_select_self_or_admin
  on public.transactions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.request_sell(p_amount text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_amount numeric(30, 8);
  v_transaction public.transactions;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = 'P0001';
  end if;
  if p_amount !~ '^(0|[1-9][0-9]{0,21})(\.[0-9]{1,8})?$' then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;
  v_amount := p_amount::numeric;
  if v_amount <= 0 then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;

  update public.profiles
  set usdt_balance = usdt_balance - v_amount
  where id = v_user_id and usdt_balance >= v_amount;
  if not found then
    raise exception 'insufficient_balance' using errcode = 'P0001';
  end if;

  insert into public.transactions (user_id, type, amount, status)
  values (v_user_id, 'SELL', v_amount, 'PENDING')
  returning * into v_transaction;
  return to_jsonb(v_transaction);
end;
$$;

create or replace function public.process_deposit_claim(
  p_user_id uuid,
  p_network public.deposit_network,
  p_tx_hash text,
  p_amount text,
  p_status public.transaction_status,
  p_from_address text,
  p_to_address text,
  p_actual_confirmations integer,
  p_required_confirmations integer,
  p_admin_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_amount numeric(30, 8);
  v_transaction public.transactions;
begin
  if p_user_id is null or p_tx_hash is null or p_to_address is null then
    raise exception 'invalid_deposit_claim' using errcode = 'P0001';
  end if;
  if p_amount !~ '^(0|[1-9][0-9]{0,21})(\.[0-9]{1,8})?$' then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;
  v_amount := p_amount::numeric;
  if v_amount <= 0 then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;

  select * into v_transaction
  from public.transactions
  where network = p_network and tx_hash = p_tx_hash
  for update;

  if not found then
    insert into public.transactions (
      user_id, type, network, amount, tx_hash, status, from_address, to_address,
      actual_confirmations, required_confirmations, admin_note
    )
    values (
      p_user_id, 'DEPOSIT', p_network, v_amount, p_tx_hash, 'PENDING',
      p_from_address, p_to_address, p_actual_confirmations,
      p_required_confirmations, p_admin_note
    )
    on conflict (network, tx_hash) where tx_hash is not null do nothing
    returning * into v_transaction;

    if not found then
      select * into v_transaction
      from public.transactions
      where network = p_network and tx_hash = p_tx_hash
      for update;
    end if;
  end if;

  if v_transaction.user_id <> p_user_id then
    raise exception 'transaction_hash_already_claimed' using errcode = 'P0001';
  end if;
  if v_transaction.amount <> v_amount then
    raise exception 'transaction_amount_mismatch' using errcode = 'P0001';
  end if;
  if v_transaction.status = 'COMPLETED' then
    return jsonb_build_object('transaction', to_jsonb(v_transaction), 'credited', false);
  end if;
  if v_transaction.status = 'FAILED' then
    raise exception 'transaction_not_claimable' using errcode = 'P0001';
  end if;

  if p_status = 'FAILED' then
    update public.transactions
    set status = 'FAILED', admin_note = p_admin_note,
        actual_confirmations = p_actual_confirmations,
        required_confirmations = p_required_confirmations
    where id = v_transaction.id
    returning * into v_transaction;
    return jsonb_build_object('transaction', to_jsonb(v_transaction), 'credited', false);
  end if;

  if p_status = 'PENDING' then
    update public.transactions
    set from_address = p_from_address, to_address = p_to_address,
        actual_confirmations = p_actual_confirmations,
        required_confirmations = p_required_confirmations
    where id = v_transaction.id
    returning * into v_transaction;
    return jsonb_build_object('transaction', to_jsonb(v_transaction), 'credited', false);
  end if;

  update public.transactions
  set status = 'COMPLETED', from_address = p_from_address, to_address = p_to_address,
      actual_confirmations = p_actual_confirmations,
      required_confirmations = p_required_confirmations
  where id = v_transaction.id and status = 'PENDING'
  returning * into v_transaction;

  if not found then
    raise exception 'deposit_state_changed' using errcode = 'P0001';
  end if;

  update public.profiles
  set usdt_balance = usdt_balance + v_amount
  where id = p_user_id;
  if not found then
    raise exception 'profile_not_found' using errcode = 'P0001';
  end if;

  return jsonb_build_object('transaction', to_jsonb(v_transaction), 'credited', true);
end;
$$;

create or replace function public.list_pending_deposits()
returns setof public.transactions
language sql
security definer
set search_path = public, pg_temp
as $$
  select *
  from public.transactions
  where type = 'DEPOSIT' and status = 'PENDING'
  order by created_at asc
  limit 50;
$$;

create or replace function public.review_sell_request(
  p_transaction_id uuid,
  p_admin_id uuid,
  p_decision text,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_transaction public.transactions;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_admin_id and role = 'ADMIN'
  ) then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  if p_decision not in ('COMPLETE', 'FAIL') then
    raise exception 'invalid_review_decision' using errcode = 'P0001';
  end if;

  select * into v_transaction
  from public.transactions
  where id = p_transaction_id and type = 'SELL' and status = 'PENDING'
  for update;
  if not found then
    raise exception 'sell_request_not_pending' using errcode = 'P0001';
  end if;

  update public.transactions
  set status = case when p_decision = 'COMPLETE' then 'COMPLETED'::public.transaction_status else 'FAILED'::public.transaction_status end,
      reviewed_by = p_admin_id, reviewed_at = now(), admin_note = p_note
  where id = p_transaction_id
  returning * into v_transaction;

  if p_decision = 'FAIL' then
    update public.profiles
    set usdt_balance = usdt_balance + v_transaction.amount
    where id = v_transaction.user_id;
    if not found then
      raise exception 'profile_not_found' using errcode = 'P0001';
    end if;
  end if;

  return to_jsonb(v_transaction);
end;
$$;

create or replace function public.set_user_admin(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(p_email) and u.email_confirmed_at is not null;
  if not found then
    return false;
  end if;

  update public.profiles
  set role = 'ADMIN'
  where id = v_user_id;
  return found;
end;
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.request_sell(text) from public, anon;
grant execute on function public.request_sell(text) to authenticated;
revoke all on function public.process_deposit_claim(
  uuid, public.deposit_network, text, text, public.transaction_status,
  text, text, integer, integer, text
) from public, anon, authenticated;
grant execute on function public.process_deposit_claim(
  uuid, public.deposit_network, text, text, public.transaction_status,
  text, text, integer, integer, text
) to service_role;
revoke all on function public.review_sell_request(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.review_sell_request(uuid, uuid, text, text)
  to service_role;
revoke all on function public.list_pending_deposits() from public, anon, authenticated;
grant execute on function public.list_pending_deposits() to service_role;
revoke all on function public.set_user_admin(text) from public, anon, authenticated;
grant execute on function public.set_user_admin(text) to service_role;
