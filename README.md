# Tiyuk

[![CI](https://github.com/toliko-coding/My-docApp/actions/workflows/ci.yml/badge.svg)](https://github.com/toliko-coding/My-docApp/actions/workflows/ci.yml)

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
  hooks/                   Small reusable hooks (theme, color scheme, bills, categories, providers, documents)
  i18n/                    he/en translations + RTL handling
  lib/supabase.ts          Supabase client (reads EXPO_PUBLIC_* env vars only)
  lib/query-client.ts      React Query client
  types/database.ts        TypeScript types mirroring the SQL schema
  schemas/                 Zod schemas (bill form, AI output contract)
  services/document-processor/  OCR/AI provider abstraction + dev mock
  repositories/            Data-access layer (Supabase queries): bills, categories, providers, documents, extractions
  utils/                   Pure helper functions (dates, currency, file hashing/validation, category display)

supabase/migrations/       SQL schema, RLS policies, storage bucket setup
supabase/functions/       Edge Functions (process-document: server-side OCR/AI call, holds the vendor API key)
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

### 3. (Optional) Enable real AI document extraction

Without this step, uploaded documents go through the mock `DocumentProcessor` in development (clearly-fake sample data) and are not processed at all in production builds. To turn on real Claude-powered extraction:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com).
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link it to your project: `supabase login`, then `supabase link --project-ref <your-project-ref>`.
3. Set the key as a server-side secret — it is never present in the app itself:
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Deploy the Edge Function that does the actual OCR/AI call:
   ```bash
   supabase functions deploy process-document
   ```
5. Set `EXPO_PUBLIC_DOCUMENT_PROCESSOR=anthropic` in `.env`.

### 4. Run the app

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
npm test              # jest + @testing-library/react-native — unit and component tests
```

All three also run automatically on every push and pull request via GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## What's real vs. mocked right now

- **Real**: navigation, a manual Light/Dark/System appearance toggle (Profile → Appearance, backed by `user_settings.theme`, applied to both the app's own theme and React Navigation's native chrome — not just following the OS), a Profile screen (avatar/initials, editable display name, default currency that seeds every new bill, language, appearance, notification settings, app version footer), full Hebrew/English i18n (every screen routes through the translation system — including month names, so a Hebrew-only user never sees English text — with RTL layout), Supabase-backed auth (once `.env` is set), database schema with Row Level Security. Full bills CRUD (create/edit/delete, mark paid/unpaid, filters, provider auto-suggest/learning, categories). A Calendar tab showing every bill with a due date grouped into month sections, sorted chronologically, sharing the same list item/status UI as the Bills tab. Document capture and storage: camera, gallery, and PDF pickers; upload to a private Supabase Storage bucket with signed-URL viewing, SHA-256 content-hash duplicate detection, and a document viewer (open/share/download/delete) linked from a bill's detail screen. AI document extraction: after upload, a review screen runs the configured `DocumentProcessor`, shows the extracted provider/category/amount/dates with a per-field confidence flag ("AI wasn't sure — please check"), lets the user correct anything before confirming, and pre-fills the Add Bill form from the confirmed result. The real (`anthropic`) provider calls a Supabase Edge Function ([`supabase/functions/process-document`](supabase/functions/process-document)) that reads the private document, sends it to Claude for OCR + structured extraction, and returns validated JSON — the vendor API key lives only in that server-side function, never in the app.
- **Mocked (development only, clearly labeled)**: `src/services/document-processor/mock-provider.ts` — returns deliberately low-confidence sample data so the review flow is exercisable before the Edge Function is deployed / `EXPO_PUBLIC_DOCUMENT_PROCESSOR=anthropic` is set. It is never used outside `__DEV__`.
- **Real, but platform-limited**: payment reminder notifications ([`src/services/notifications.ts`](src/services/notifications.ts)). Scheduling logic, the `user_settings`/`notifications` tables, and the Notification Settings UI are fully implemented and correct — but `expo-notifications` itself removed Android support inside Expo Go as of SDK 53, so on that specific runtime the module is unavailable and every function degrades gracefully to a safe no-op (loaded dynamically, wrapped in try/catch) instead of crashing. The Notification Settings toggle honestly reflects this ("Requires a development build — unavailable in Expo Go on Android") rather than pretending the feature works. It's expected to work normally in a real development or production build, and on iOS.

## Build phases

1. **Foundation** (done) — project structure, navigation, auth, database schema, design system, RTL, dark/light mode.
2. **Bills** (done) — model, list, details, manual creation/edit, statuses, filters, provider auto-recognition.
3. **Document upload** (done) — camera, gallery, PDF picker; private Storage upload with content-hash duplicate detection; document viewer (open/share/delete) linked from bills.
4. **OCR + AI** (done) — provider-agnostic `DocumentProcessor` interface, Claude-powered structured extraction via a Supabase Edge Function, per-field confidence, review/correct screen, bill-form pre-fill.
5. **Dashboard** (done) — outstanding balance and remaining-bill count, paid-this-month total, upcoming payments list, and a per-category monthly-spending bar chart, all derived client-side from the same bills already fetched for the Bills tab (no separate aggregate query).
6. **Intelligence** (done) — an overdue banner on the dashboard; bill/receipt matching and duplicate detection during document review (matches an incoming document against existing bills by provider + amount + billing period/due date, offering "mark existing bill as paid" or "view existing bill" — persisted to `document_matches` for an audit trail); a computed (unstored) recurring-providers insight on the dashboard.
7. **Notifications** (done) — local payment-reminder scheduling (7/3/1 days before + due-date, configurable per user) built on `expo-notifications`, with a database mirror (`notifications` table) for auditability; a Notification Settings card (enable/disable, choose reminder offsets); reminders kept in sync on bill create/edit/mark-paid/unpaid/delete. Gracefully degrades — with an honest disabled UI state — where `expo-notifications` itself is unavailable (Expo Go on Android, SDK 53+); unaffected on iOS and in development/production builds.
8. **Testing & polish** (done) — a Jest test suite (98 tests) covering the app's pure business logic — date/currency/status formatting, dashboard/recurring-provider/calendar aggregation, provider-name normalization, file-validation rules, the bill-form Zod schema (including the paid-date and billing-period cross-field rules), reminder-time scheduling, the reminder-sync orchestration — plus `@testing-library/react-native` component tests for `BillForm` (validation, the paid-date auto-fill regression, category selection, retry-on-error, editing an existing bill). An error/loading-state audit found and fixed two screens (bill detail, bill edit) stuck on an infinite spinner instead of an actionable error on fetch failure. A security review of the RLS policies, storage bucket policies, and the Edge Function's auth handling found no issues (every table is owner-scoped, the Edge Function runs under the caller's own JWT with no `service_role` use, no secret ever reaches the client bundle). A performance check confirmed list virtualization (`FlatList`) and dashboard memoization (`useMemo`) were already in place. A live-testing follow-up also caught and fixed a second, more subtle recurrence of the Phase 7 expo-notifications crash (the try/catch around the dynamic import didn't catch a throw from inside the module's own side-effecting init code — fixed by checking `isRunningInExpoGo()` before ever importing it), and closed out the Calendar tab (deferred during Phase 7), which now shows every bill with a due date grouped into month sections.
