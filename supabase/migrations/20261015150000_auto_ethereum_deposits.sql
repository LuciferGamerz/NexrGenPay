create table public.deposit_wallets (
  address text primary key check (address = lower(address)),
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index deposit_wallets_user_id_idx on public.deposit_wallets (user_id);

create table public.deposit_wallet_challenges (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  address text not null check (address = lower(address)),
  message text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index deposit_wallet_challenges_expiry_idx
  on public.deposit_wallet_challenges (expires_at);

create table public.deposit_scanner_state (
  network public.deposit_network primary key,
  last_scanned_block bigint not null check (last_scanned_block >= 0),
  locked_by uuid,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.deposit_wallets enable row level security;
alter table public.deposit_wallet_challenges enable row level security;
alter table public.deposit_scanner_state enable row level security;

revoke all on public.deposit_wallets, public.deposit_wallet_challenges,
  public.deposit_scanner_state from public, anon, authenticated, service_role;
grant select on public.deposit_wallets to authenticated;

create policy deposit_wallets_select_self
  on public.deposit_wallets for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.create_deposit_wallet_challenge(
  p_user_id uuid,
  p_challenge_id uuid,
  p_address text,
  p_message text,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_address !~ '^0x[0-9a-f]{40}$'
    or p_expires_at <= now()
    or p_expires_at > now() + interval '10 minutes'
    or length(p_message) > 1000 then
    raise exception 'invalid_wallet_challenge' using errcode = 'P0001';
  end if;

  delete from public.deposit_wallet_challenges
  where expires_at <= now() or used_at is not null;

  insert into public.deposit_wallet_challenges (id, user_id, address, message, expires_at)
  values (p_challenge_id, p_user_id, p_address, p_message, p_expires_at);
  return true;
end;
$$;

create or replace function public.get_deposit_wallet_challenge(
  p_user_id uuid,
  p_challenge_id uuid,
  p_address text
)
returns text
language sql
security definer
set search_path = public, pg_temp
as $$
  select message
  from public.deposit_wallet_challenges
  where id = p_challenge_id
    and user_id = p_user_id
    and address = p_address
    and used_at is null
    and expires_at > now();
$$;

create or replace function public.complete_deposit_wallet_link(
  p_user_id uuid,
  p_challenge_id uuid,
  p_address text,
  p_start_block bigint
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_challenge public.deposit_wallet_challenges;
  v_existing_user uuid;
begin
  select * into v_challenge
  from public.deposit_wallet_challenges
  where id = p_challenge_id
  for update;

  if not found
    or v_challenge.user_id <> p_user_id
    or v_challenge.address <> p_address
    or v_challenge.used_at is not null
    or v_challenge.expires_at <= now()
    or p_start_block < 0 then
    raise exception 'wallet_challenge_expired_or_invalid' using errcode = 'P0001';
  end if;

  update public.deposit_wallet_challenges set used_at = now() where id = p_challenge_id;

  insert into public.deposit_wallets (address, user_id)
  values (p_address, p_user_id)
  on conflict (address) do nothing;

  select user_id into v_existing_user
  from public.deposit_wallets
  where address = p_address;

  if v_existing_user <> p_user_id then
    raise exception 'wallet_already_linked' using errcode = 'P0001';
  end if;

  insert into public.deposit_scanner_state (network, last_scanned_block)
  values ('ERC20', p_start_block)
  on conflict (network) do nothing;

  return true;
end;
$$;

create or replace function public.list_deposit_wallets()
returns table (address text, user_id uuid)
language sql
security definer
set search_path = public, pg_temp
as $$
  select w.address, w.user_id
  from public.deposit_wallets w
  order by w.created_at asc;
$$;

create or replace function public.claim_deposit_scanner(
  p_network public.deposit_network,
  p_initial_block bigint,
  p_lock_id uuid,
  p_lease_seconds integer
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_state public.deposit_scanner_state;
begin
  if p_network <> 'ERC20'
    or p_initial_block < 0
    or p_lease_seconds < 30
    or p_lease_seconds > 300 then
    raise exception 'invalid_scanner_claim' using errcode = 'P0001';
  end if;

  insert into public.deposit_scanner_state (network, last_scanned_block)
  values (p_network, p_initial_block)
  on conflict (network) do nothing;

  select * into v_state
  from public.deposit_scanner_state
  where network = p_network
  for update;

  if v_state.locked_until > now() then
    return null;
  end if;

  update public.deposit_scanner_state
  set locked_by = p_lock_id,
      locked_until = now() + make_interval(secs => p_lease_seconds),
      updated_at = now()
  where network = p_network;

  return v_state.last_scanned_block;
end;
$$;

create or replace function public.complete_deposit_scanner(
  p_network public.deposit_network,
  p_lock_id uuid,
  p_last_scanned_block bigint
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.deposit_scanner_state
  set last_scanned_block = p_last_scanned_block,
      locked_by = null,
      locked_until = null,
      updated_at = now()
  where network = p_network
    and locked_by = p_lock_id
    and p_last_scanned_block >= last_scanned_block;
  return found;
end;
$$;

create or replace function public.release_deposit_scanner(
  p_network public.deposit_network,
  p_lock_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.deposit_scanner_state
  set locked_by = null, locked_until = null, updated_at = now()
  where network = p_network and locked_by = p_lock_id;
  return found;
end;
$$;

revoke all on function public.create_deposit_wallet_challenge(uuid, uuid, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.create_deposit_wallet_challenge(uuid, uuid, text, text, timestamptz)
  to service_role;
revoke all on function public.get_deposit_wallet_challenge(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.get_deposit_wallet_challenge(uuid, uuid, text)
  to service_role;
revoke all on function public.complete_deposit_wallet_link(uuid, uuid, text, bigint)
  from public, anon, authenticated;
grant execute on function public.complete_deposit_wallet_link(uuid, uuid, text, bigint)
  to service_role;
revoke all on function public.list_deposit_wallets() from public, anon, authenticated;
grant execute on function public.list_deposit_wallets() to service_role;
revoke all on function public.claim_deposit_scanner(public.deposit_network, bigint, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.claim_deposit_scanner(public.deposit_network, bigint, uuid, integer)
  to service_role;
revoke all on function public.complete_deposit_scanner(public.deposit_network, uuid, bigint)
  from public, anon, authenticated;
grant execute on function public.complete_deposit_scanner(public.deposit_network, uuid, bigint)
  to service_role;
revoke all on function public.release_deposit_scanner(public.deposit_network, uuid)
  from public, anon, authenticated;
grant execute on function public.release_deposit_scanner(public.deposit_network, uuid)
  to service_role;
