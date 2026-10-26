# NextGenPay

NextGenPay is a pre-launch Next.js USDT account prototype. It includes
authenticated account scaffolding, configurable BEP-20/ERC-20/TRC-20 deposit
verification, internal USDT balances, and manually reviewed sell requests.
Supabase Auth and Postgres back the accounts and wallet ledger. Deposits remain
unavailable until operators apply the SQL migration and configure a server-only
Supabase secret key, verified receiving addresses/QR images, approved token
contracts, and chain RPCs. Sell requests do not execute INR payouts.

This code is not production-ready for custody or financial activity. Before
accepting customer funds, independently review security, operations, legal and
compliance requirements, account recovery, rate limiting, KYC/AML, monitoring,
incident response, and custody/key management. Never put private keys in this
application.

## Run locally

Requirements: Node.js, npm, and a Supabase project.

```powershell
npm install
npm run dev
```

Open http://localhost:3000. Other useful commands:

```powershell
npm run lint
npm run build
npm start
```

## Pages

- `/` — home page and sample-rate converter
- `/wallet` — authenticated balances, on-chain transaction-hash deposit verification, auto-detected Ethereum deposits, linked wallets, and sell requests
- `/login` — Supabase email/password registration and sign-in (registration requires email verification)
- `/admin` — authorized manual sell-request review queue
- `/dashboard` — redirects to `/wallet`
- `/p2p` — sample offers and simulated escrow flow
- `/deposit` — deposit service status and wallet entry point
- `/swap` — swap preview
- `/referrals` — sample referral dashboard
- `/account` — simulated account and verification interface
- `/about` — About NextGenPay
- `/contact` — contact page with WhatsApp and Telegram links

The floating Help panel provides a local chat preview and opens WhatsApp or
Telegram using the configured contact details. The chat preview is not
connected to a live support service.

## Supabase and wallet backend setup

The project uses Supabase Auth for email/password sign-in and Supabase Postgres
for profiles and wallet transactions. Copy `.env.example` to `.env.local` and
configure values there. `.env.local` is Git-ignored. Never prefix the Supabase
secret key, RPC keys, reconciliation secret, or private keys with
`NEXT_PUBLIC_`.

1. Keep the configured Supabase project URL and publishable key in
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Set
   `APP_ORIGIN` to the exact origin used by this app.
2. In the Supabase SQL Editor, apply
   `supabase/migrations/20261015000000_wallet_backend.sql`. This creates the
   profile/transaction tables, RLS policies, and narrowly granted database
   functions used for atomic balance changes.
3. Put the project's server-only secret key in `SUPABASE_SECRET_KEY` in
   `.env.local`. It is required for verified deposit credits, reconciliation,
   sell reviews, and admin setup. Never send it in chat, expose it to browser
   code, or commit it.
4. In Supabase Auth settings, enable email/password sign-up, configure SMTP,
   set the Site URL to `APP_ORIGIN`, and allow the callback URL
   `APP_ORIGIN/auth/confirm`. Set the confirmation email template link to:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/wallet">Confirm email address</a>
   ```

5. Set each receiving address and upload its matching QR image to `public/`,
   using the configured `DEPOSIT_*_QR` path. Keep BEP-20, ERC-20, and TRC-20
   addresses distinct in the UI; confirm each address on its intended network.
6. Configure backend-only `BSC_RPC_URL`, `ETHEREUM_RPC_URL`, and `TRON_RPC_URL`.
   A TronGrid API key can be set with `TRONGRID_API_KEY`.
7. Set the approved USDT token contracts. Ethereum ERC-20 and TRON TRC-20
   defaults identify Tether USD₮; **BEP-20 must be explicitly configured** for
   the exact Binance-Peg BSC-USD contract approved for the service. Do not assume
   a token is official based on its ticker or name.
8. Set confirmation thresholds to values approved for your operational risk
   policy, then run `npm run dev`.
9. Register an account and verify it through Supabase email. Promote the
   reviewed operator account to admin with
   `npm run admin:set -- admin@example.com`.
10. Apply `supabase/migrations/20261015150000_auto_ethereum_deposits.sql` in
    the Supabase SQL Editor. This migration is required for all automatic
    wallet-linking and scanner operations.
11. In production, run a trusted scheduler against `POST /api/wallet/reconcile`
    with the `Authorization` header set to the standard Bearer scheme followed
    by `DEPOSIT_RECONCILE_SECRET`, to reconcile old hash-based claims and scan
    automatic Ethereum transfers. Keep the secret on the scheduler only. For
    local testing, run `npm run deposits:watch` in a separate terminal while
    the app is running.

Automatic Ethereum deposits require each customer to link their sending wallet
by signing a short-lived message. The server scans confirmed ERC-20 Transfer
logs to the configured receiving address and credits a transfer only when the
sender matches a wallet linked to that account. This signature proves address
ownership; it does not authorize transactions or expose private keys. Transfers
from exchanges, unlinked wallets, or before initial scanner setup cannot be
automatically attributed. A transaction containing multiple matching transfers
is skipped for manual review. The scanner processes at most 1,000 blocks per
pass; production must run a trusted recurring scheduler.

Signed-in users can also submit a transaction hash from the wallet page. The
server independently checks the configured token contract, receiving address,
on-chain amount, and confirmation threshold; only confirmed transfers are
credited. A transaction that has not reached the threshold remains pending.

The second migration creates private wallet-link and scanner-state tables.
Only an account owner can read their linked addresses; only server-side
functions can create links or credit balances. Apply the migration and verify
the watcher/scheduler before enabling real deposits.

Sell requests atomically reserve the user's available USDT and remain pending.
An admin may confirm a payout completed elsewhere or reject the request (which
returns the reserved balance). The admin endpoint does not initiate a bank
transfer or any other payout.

The deposit watcher is not started automatically by the website. The Supabase
migrations, email settings, receiving addresses, and matching QR images must
be configured and verified first. No production deployment or live funds have
been tested.
