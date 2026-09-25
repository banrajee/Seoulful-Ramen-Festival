# Seoulful Ramen Festival

Independent front end for the temporary Seoulful Ramen Festival menu. It preserves the completed festival design while allowing festival deployments to proceed without redeploying the permanent shop menu.

## Routes

- `/` — public festival menu and intended QR destination
- `/festival` — compatibility route for the former URL shape
- `/admin` — festival-only management using the existing Supabase owner account

## Data boundary

The public menu reads core product presentation fields from `menu_items` and reads festival settings from `festival_items` and `festival_combos`. The admin writes only to `festival_items` and `festival_combos`; it never updates `menu_items`.

Required environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

No service-role key is used. Copy `.env.example` to `.env.local` for local development and configure the same variables separately in the Festival Vercel project.

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm dev
```

The database migration files are retained as migration history. They have already been applied to the shared Supabase project and should not be rerun as part of ordinary deployments.

