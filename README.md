## PropertySuite

PropertySuite is a unified real-estate and construction operations platform for Samarth Developers Pro Pvt. Ltd.

This repository now contains:

1. A `Next.js 16` web app with App Router, `proxy.ts`, role-based login, `app/api/v1/*` endpoints, dashboard, module workspaces, PDF memo generation, Excel export, and document vault upload flow.
2. An `Electron` desktop wrapper in [`electron`](./electron) that loads the same Next.js app.
3. A `Flutter` Android client scaffold in [`mobile/flutter`](./mobile/flutter) that authenticates against the same `v1` API using bearer tokens.
4. A MySQL schema and seed script in [`database/schema.sql`](./database/schema.sql) and [`scripts/setup-db.mjs`](./scripts/setup-db.mjs).

## Stack

- `next@16.2.4`
- `react@19`
- `mysql2`
- `jose` JWT sessions
- `bcryptjs`
- `pdf-lib`
- `nodemailer`
- `twilio`
- `xlsx`
- `electron`
- `flutter`

## Environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required keys:

- `APP_URL`
- `APP_SESSION_SECRET`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Optional integrations:

- `SMTP_*` for email
- `TWILIO_*` for WhatsApp
- `FILE_STORAGE_DIR` for document uploads under `storage/`

## Web App

```bash
npm run dev
```

Default admin after DB setup:

- Email: `admin@samarthdevelopers.local`
- Password: `Admin@12345`

## Database Setup

```bash
npm run db:setup
```

This applies all tables and seeds:

- admin user
- branding settings
- default festival message templates

## Desktop App

Development:

```bash
npm run electron:dev
```

Build:

```bash
npm run electron:build
```

## Flutter Android App

Open `mobile/flutter` in Flutter tooling and run:

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://YOUR_SERVER:3000
```

For an Android emulator on the same machine as the API, the scaffold defaults to:

- `http://10.0.2.2:3000`

## Verification

The current codebase passes:

```bash
npm run lint
npm run build
```
