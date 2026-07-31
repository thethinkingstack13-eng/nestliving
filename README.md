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

Copy the template and fill in your Atlas connection string (Atlas -> your
cluster -> "Connect" -> "Drivers"):

```bash
cp .env.example .env
```

```
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster-url>/nestliving?retryWrites=true&w=majority"
JWT_SECRET="<a long random string>"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Generate a random `JWT_SECRET` by running this in any terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

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

This creates all collections from `prisma/schema.prisma` (users,
tenant_profiles, properties, rooms, amenities, booking_requests) in your
Atlas database.

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

**Still mock (hardcoded arrays, not yet wired to Prisma):**
- Room listings (`/rooms`), roommate discovery (`/roommates`)
- Dashboard content itself (stats, booking request tables, property lists)
- Booking request creation/approval
- Admin property approval / user management

The natural next phase is building `/api/rooms`, `/api/bookings`, and
`/api/admin/*` routes and swapping each dashboard's mock array for a real
Prisma query.

## Known things to swap before shipping

- **Images:** `next.config.js` only whitelists `picsum.photos` (used by
  mock room photos). Add your real image host (e.g. a cloud storage
  bucket) to `images.remotePatterns` once you're using real property/avatar
  photos.
- **Partner badges** on the landing page footer use placeholder names
  (`STAYWELL`, `ROOMIO`, etc.) instead of real companies -- replace with
  actual partners once you have them.
- **Auth:** there's no session/auth provider wired in yet -- the register
  form assumes an API route will set a session cookie on success.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel ("Add New Project" -> select the repo).
3. In the import screen's Environment Variables section, add `DATABASE_URL`
   with your Atlas connection string.
4. Click Deploy. Every future push to the connected branch redeploys
   automatically.
