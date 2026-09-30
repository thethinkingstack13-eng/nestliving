# NestLiving

A Neo-Brutalist co-living space & roommate management platform, built with
Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, and MongoDB Atlas.

This build was verified end-to-end: `npm run build` compiles, type-checks,
and statically prerenders every route with no errors.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS -- Neo-Brutalist design tokens in `tailwind.config.ts`
- **Database:** Prisma ORM + MongoDB Atlas
- **Validation:** Zod (`lib/validations.ts`)
- **Icons:** lucide-react

## Prerequisites

- Node.js 18.18 or newer
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

## 1. Install dependencies

```bash
npm install
```

`npm install` runs `prisma generate` automatically via the `postinstall` script.
If that step fails on a restricted/offline network, skip it and run it
manually once you have normal internet access:

```bash
npm install --ignore-scripts
npx prisma generate
```

## 2. Configure environment variables

Copy the placeholder template, then enter real values in the ignored local
`.env` file. Never place live credentials in `.env.example` or another tracked
file.

```bash
cp .env.example .env
```

```
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster-url>/nestliving?retryWrites=true&w=majority"
JWT_SECRET="<a long random string>"
APP_URL="https://your-domain.example"
RESEND_API_KEY="<resend-api-key>"
EMAIL_OUTBOX_ENCRYPTION_KEY=""
CRON_SECRET=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
OWNER_ID_ENCRYPTION_KEY=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

Set the three Cloudinary values in `.env` and your deployment secret manager
to enable signed property and roommate-photo uploads. The API secret is used
only on the server; never expose it through a `NEXT_PUBLIC_` variable.

Registration and password recovery require `DATABASE_URL`, `JWT_SECRET`,
`RESEND_API_KEY`, `EMAIL_OUTBOX_ENCRYPTION_KEY`, and (in production) `APP_URL`.
New accounts must verify their email before login. Auth request limits are
stored in MongoDB and shared across server instances.

Generate `OWNER_ID_ENCRYPTION_KEY` with `openssl rand -hex 32` and set it in
your local environment and deployment secret manager. Back it up securely:
losing this key makes stored owner IDs permanently unreadable. Owner IDs are
encrypted before database writes and are not returned by the onboarding API.

If the database already contains owner profiles created before this change,
run this once after setting the encryption key:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/encrypt-owner-ids.ts
```

Before deploying email verification, capture a UTC cutoff, run `npx prisma db
push`, and mark accounts created before that cutoff as already verified:

```bash
EMAIL_VERIFICATION_CUTOFF="2026-09-29T00:00:00.000Z" npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/backfill-email-verification.ts
```

To create the initial administrator, provide `ADMIN_EMAIL` and a unique
`ADMIN_PASSWORD` of at least 16 characters to the seed command. Keep these
values in your local environment or deployment secret manager; do not commit
them to the repository. The seed will not promote an existing non-admin user.

```bash
read -r -s -p "Admin password: " ADMIN_PASSWORD
printf '\n'
export ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD
npx prisma db seed
```

Generate a random `JWT_SECRET` by running this in any terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate `EMAIL_OUTBOX_ENCRYPTION_KEY` with `openssl rand -hex 32`; email HTML
is encrypted before being saved in MongoDB. Set `APP_URL` to the public HTTPS
origin and configure a random `CRON_SECRET` in both the app and your scheduler.
Call `/api/cron/email-outbox` every few minutes with
`Authorization: Bearer $CRON_SECRET`; queued mail is retried with backoff and
eventually marked failed after repeated errors. Set `RESEND_API_KEY` to enable
delivery. Keep every real value in ignored `.env` and deployment secrets.

For existing accounts, push the new schema first, then run
`EMAIL_VERIFICATION_CUTOFF=<ISO timestamp before deployment> npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/backfill-email-verification.ts`
before deploying the verification requirement. This preserves accounts that
already existed before the cutoff while newly registered users must verify.

Get a free `RESEND_API_KEY` at [resend.com](https://resend.com) -- sign up,
create an API key. No domain verification needed to start; emails send
from `onboarding@resend.dev` until you verify your own domain.

Make sure your Atlas project's **Network Access** allows connections from
anywhere (`0.0.0.0/0`) so both your machine and your deployment host (e.g.
Vercel) can reach it.

## 3. Push the schema to your database

MongoDB doesn't use SQL-style migrations the way Postgres does, so instead
of `prisma migrate dev` you push the schema directly:

```bash
npx prisma db push
```

Run this after pulling schema changes so listing photos, room amenities,
review states, auth/outbox collections, and roommate connection indexes exist
in MongoDB. Run the same command in production before deploying code that
depends on the new fields.

For existing listings and tenant profiles, rebuild the lower-case search-key
columns once after the schema push:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/backfill-search-keys.ts
```

This applies the schema in `prisma/schema.prisma`, including user/profile,
property/room, booking, and roommate connection collections and indexes.

## 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
├── layout.tsx                  Root layout -- loads fonts, wraps every page
├── globals.css                 Tailwind entrypoint
├── page.tsx                    Landing page (hero + nav)
├── auth/register/page.tsx      Sign-up with tenant/owner role toggle
├── onboarding/
│   ├── tenant/page.tsx          Lifestyle profile setup
│   └── owner/page.tsx           Owner verification setup
├── rooms/page.tsx              Room search with filters
├── roommates/page.tsx          Roommate discovery dashboard
└── dashboard/
    ├── owner/page.tsx           Stats, incoming requests, active listings
    └── tenant/page.tsx          Submitted applications, recommended matches

components/
├── Navbar.tsx                  Site navigation
├── RoomCard.tsx                Reusable room listing card
├── RoommateCard.tsx            Reusable roommate profile card
└── BookingRequestTable.tsx     Approve/reject table (exports `StatusBadge`)

lib/
├── prisma.ts                   Singleton Prisma client
├── validations.ts              Shared Zod schemas
└── compatibility.ts            Roommate matching algorithm

prisma/
└── schema.prisma               Database models (MongoDB)
```

## Current state -- what's mock vs. real

**Now real (backed by MongoDB):**
- Registration (`/auth/register` -> `/api/auth/register`) -- creates a User,
  hashes the password with bcrypt, sets a session cookie.
- Login (`/auth/login` -> `/api/auth/login`) -- verifies credentials, sets a
  session cookie, redirects by real role.
- Logout (`/api/auth/logout`) -- clears the session cookie.
- Tenant & owner onboarding (`/api/onboarding/tenant`, `/api/onboarding/owner`)
  -- writes a `TenantProfile` / `OwnerProfile` linked to the logged-in user,
  then redirects to the matching dashboard.
- `/profile` -- shows the logged-in user's info and role-specific profile
  details, reading directly from Prisma.
- `/settings` -- account info (editable), password change, and **real
  notification preferences saved per-user in the database**.
- **Real email sending via Resend** -- a welcome email fires on
  registration. Booking-request and roommate-match email templates are
  pre-built in `lib/email.ts`, ready to wire in once those features exist
  (see `app/api/user/notifications/route.ts` and Phase 9 notes below).
- The Navbar checks `/api/auth/me` on every page and swaps the "LOG IN"
  button for a profile dropdown (My Profile / Settings / Log Out) once
  someone is signed in. It's now included on every page (previously it was
  missing from `/rooms`, `/roommates`, both dashboards, and both onboarding
  pages).
- `/dashboard/*`, `/onboarding/*`, `/profile`, and `/settings` are protected
  by `middleware.ts` -- visiting them without a valid session redirects to
  `/auth/login`.

Room search, roommate discovery, owner/tenant dashboards, property review,
listing creation, booking requests, and booking decisions are backed by Prisma.
New listings require admin approval. Booking approvals decrement available
beds conditionally inside a MongoDB transaction, so the production database
must support transactions (MongoDB Atlas replica sets do).

## Known things to swap before shipping

- **Partner badges** on the landing page footer use placeholder names
  (`STAYWELL`, `ROOMIO`, etc.) instead of real companies -- replace with
  actual partners once you have them.
- **Secrets:** configure `DATABASE_URL`, `JWT_SECRET`,
  `OWNER_ID_ENCRYPTION_KEY`, and Cloudinary settings in the hosting provider's
  secret manager. Never commit actual values to Git.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel ("Add New Project" -> select the repo).
3. Configure the required environment variables from `.env.example` in
  Vercel's Environment Variables settings. Keep their values out of Git.
4. Click Deploy. Every future push to the connected branch redeploys
   automatically.
