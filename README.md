# Prompt Studio

Prompt Studio is a structured AI image generation MVP. Users choose an image type, aspect ratio, style, scene, whitespace direction, subject, and extra requirements; the app compiles those inputs into a professional GPT Image prompt and generates one image through the OpenAI Images API.

The MVP includes the home page, generator, Supabase Google OAuth login, generation history, credit tracking, and an upgrade waitlist. New profiles receive 10 starter credits during profile bootstrap. A successful generation uploads the image to Supabase Storage and then charges 1 credit through a Supabase RPC. The upgrade flow records waitlist interest only; there is no real payment processing.

## Stack

- Next.js App Router
- Supabase Auth, Postgres, and Storage
- OpenAI Images API with `gpt-image-2`
- Vercel

## Language Strategy

The interface supports Chinese and English. Chinese is the default, and the header language switcher persists the selected locale in the `prompt_studio_locale` cookie.

Compiled generation prompts are intentionally English: templates and preset prompt fragments stay in English for the OpenAI Images API, while user-entered subject and additional requirements are preserved exactly as typed. The MVP does not make an extra translation call.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in local or hosted values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Do not expose it client-side, commit it, or prefix it with `NEXT_PUBLIC_`.

## Local Development

```bash
npm install
npm run dev
```

The app runs locally at `http://localhost:3000` by default.

## Verification

```bash
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

E2E tests use Playwright. If the Playwright-managed Chromium install is unavailable or stuck locally, installed Google Chrome can be used automatically on macOS when managed Chromium is missing. You can also opt in explicitly:

```bash
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

To reuse an already running local dev server during E2E tests:

```bash
PLAYWRIGHT_REUSE_SERVER=1 npm run test:e2e
```

## Supabase Setup

Apply the initial schema migration. If you use the Supabase CLI, install it and
link this app to a Supabase project or pass a database URL before pushing:

```bash
supabase db push
```

Otherwise, apply `supabase/migrations/202606290001_initial_schema.sql` through
the Supabase dashboard or your preferred SQL migration workflow.

The migration creates:

- `profiles`, including credit balances
- `generation_jobs`
- `credit_transactions`
- `upgrade_waitlist`
- A private `generated-images` Storage bucket
- Row Level Security policies
- RPCs for generation completion and failure handling

Enable Google OAuth in Supabase Auth. Configure callback URLs for local development and production:

```text
http://localhost:3000/auth/callback
https://your-vercel-domain/auth/callback
```

Generated images are stored in the private `generated-images` bucket. Server routes use the service role key for privileged job, credit, and storage updates.

## Deployment

Deploy the app to Vercel.

Set the same environment variables in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain
```

Set `NEXT_PUBLIC_SITE_URL` to the deployed origin, without a trailing slash. In Supabase Auth, add the deployed callback URL:

```text
https://your-vercel-domain/auth/callback
```

Before launch, confirm the Supabase migration has been applied and the private `generated-images` bucket exists.

## MVP Notes

- No real payment flow is implemented.
- The upgrade modal submits to an upgrade waitlist only.
- Emails, admin tooling, complex SEO, image editing, reference uploads, and multi-model switching are outside this MVP.
