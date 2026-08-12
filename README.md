# DocApp

A mobile app (iOS + Android, via React Native + Expo) that centralizes household bills, receipts, and payments: scan a document, let AI extract the details, review them, and track everything from one dashboard.

## Stack

- **React Native + Expo (SDK 57) + TypeScript** — Expo Router for file-based navigation, EAS for native builds.
- **Supabase** — Postgres database, Auth (email/password now; Google/Apple planned), private Storage with Row Level Security.
- **Zod** — runtime validation of AI/OCR structured output before it ever reaches the database.
- OCR/AI is behind a provider-agnostic `DocumentProcessor` interface (see [`src/services/document-processor`](src/services/document-processor)) so no single vendor is hardcoded.

## Project structure

```
src/
  app/                    Expo Router screens (routes)
    (auth)/                 sign-in, sign-up
    (tabs)/                 Home, Bills, Scan, Calendar, Profile
  components/              Reusable UI (components/ui = design-system primitives)
  constants/theme.ts       Colors, spacing, radii, typography (light + dark)
  contexts/                React contexts (auth)
  hooks/                   Small reusable hooks (theme, color scheme)
  i18n/                    he/en translations + RTL handling
  lib/supabase.ts          Supabase client (reads EXPO_PUBLIC_* env vars only)
  types/database.ts        TypeScript types mirroring the SQL schema
  schemas/                 Zod schemas (AI output contract)
  services/document-processor/  OCR/AI provider abstraction + dev mock
  repositories/            Data-access layer (Supabase queries) — filled in from Phase 2
  utils/                   Pure helper functions

supabase/migrations/       SQL schema, RLS policies, storage bucket setup
```

## Setup

### 0. Node version

Requires Node **20.19.4+, 22.13+, or 24.3+** (see `engines` in `package.json`). Metro and `@expo/env` (the `.env` loader) both depend on newer `node:util`/`node:fs` APIs — on an older Node, `.env` loading crashes with `parseEnv is not a function` as soon as `.env` has real content in it. If you're on an unsupported version, install a newer one, e.g. with [`n`](https://github.com/tj/n): `n 22` (or `n lts`).

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migrations in `supabase/migrations/` in order (`0001_init.sql`, then `0002_storage.sql`). This creates all tables, RLS policies, the private `documents` storage bucket, and seeds the baseline categories/providers.
3. Copy `.env.example` to `.env` and fill in your project's URL and anon key (Project Settings → API):

   ```bash
   cp .env.example .env
   ```

   - `EXPO_PUBLIC_SUPABASE_URL` is the **base project URL**, e.g. `https://<ref>.supabase.co` — not a `/rest/v1/...` or other sub-path; the client library appends its own paths.
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` is the **anon / public** key (Supabase's newer dashboards call this the **publishable** key, `sb_publishable_...`). Never use the **secret** key (`sb_secret_...`, equivalent to `service_role`) here — it bypasses Row Level Security and must never ship inside the mobile app.

Until `.env` is filled in, the app runs with `isSupabaseConfigured = false` — auth screens show an explicit "backend not configured" state instead of pretending to work.

### 3. Run the app

```bash
npx expo start        # then press i / a / w, or scan the QR code with Expo Go
npm run ios           # iOS simulator
npm run android       # Android emulator
npm run web           # web preview
```

### Checks

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
```

## What's real vs. mocked right now

- **Real**: navigation, theming (light/dark), RTL + Hebrew/English i18n, Supabase-backed auth (once `.env` is set), database schema with Row Level Security.
- **Mocked (development only, clearly labeled)**: `src/services/document-processor/mock-provider.ts` — returns deliberately low-confidence sample data so the review flow can be built before a real OCR/AI vendor account exists. It is never used outside `__DEV__`.
- **Not built yet**: document capture/upload (Phase 3), OCR/AI extraction (Phase 4), the real dashboard numbers and bills list (Phase 2/5), matching, notifications (Phase 6/7). Screens that would otherwise need this data show honest empty states, not sample numbers.

## Build phases

1. **Foundation** (done) — project structure, navigation, auth, database schema, design system, RTL, dark/light mode.
2. Bills — model, list, details, manual creation, statuses, filters.
3. Document upload — camera, gallery, PDF, storage, preview.
4. OCR + AI — provider interface, structured extraction, classification, confidence, review screen.
5. Dashboard — outstanding total, paid this month, upcoming bills, category spending, charts.
6. Intelligence — duplicate detection, bill/receipt matching, recurring bills, overdue logic.
7. Notifications — payment reminders, notification settings.
8. Testing & polish — tests, error/loading states, performance, security review.
