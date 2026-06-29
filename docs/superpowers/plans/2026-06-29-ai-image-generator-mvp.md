# AI Image Generator MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a Next.js MVP for a structured AI image generation website with Google login, saved history, starter credits, and an upgrade waitlist.

**Architecture:** A single Next.js App Router application handles pages, API routes, and server-side orchestration. Supabase provides Google auth, Postgres, row-level security, and private image storage. The server calls OpenAI's Image API with `gpt-image-2`, decodes the returned base64 image, uploads it to Supabase Storage, then completes the job and charges credits in a database RPC.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase JS/SSR, OpenAI Node SDK, Vitest, Testing Library, Playwright, Vercel.

---

## Source Design

Implement the approved spec:

- `docs/superpowers/specs/2026-06-29-ai-image-generator-design.md`

OpenAI reference checked on 2026-06-29:

- `https://developers.openai.com/api/docs/guides/image-generation`
- The guide recommends Image API for single-prompt image generation, shows `openai.images.generate({ model: "gpt-image-2", prompt })`, and returns `data[0].b64_json`.

## File Structure

Create this structure:

```text
.
├── app/
│   ├── api/
│   │   ├── generate/route.ts
│   │   ├── history/route.ts
│   │   └── upgrade-waitlist/route.ts
│   ├── auth/callback/route.ts
│   ├── generate/page.tsx
│   ├── history/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── account-menu.tsx
│   ├── app-header.tsx
│   ├── auth-dialog.tsx
│   ├── credit-badge.tsx
│   ├── generator-form.tsx
│   ├── history-grid.tsx
│   ├── prompt-preview.tsx
│   ├── result-panel.tsx
│   └── upgrade-modal.tsx
├── lib/
│   ├── auth/
│   │   ├── actions.ts
│   │   └── ensure-profile.ts
│   ├── generation/
│   │   ├── openai.ts
│   │   ├── options.ts
│   │   ├── prompt.ts
│   │   ├── sizes.ts
│   │   └── validation.ts
│   ├── supabase/
│   │   ├── admin.ts
│   │   ├── browser.ts
│   │   ├── middleware.ts
│   │   └── server.ts
│   ├── types.ts
│   └── utils.ts
├── middleware.ts
├── supabase/
│   └── migrations/202606290001_initial_schema.sql
├── tests/
│   ├── e2e/generator.spec.ts
│   ├── integration/generate-route.test.ts
│   ├── integration/upgrade-waitlist-route.test.ts
│   ├── setup.ts
│   └── unit/
│       ├── prompt.test.ts
│       ├── sizes.test.ts
│       └── validation.test.ts
├── .env.example
├── package.json
├── playwright.config.ts
├── vitest.config.ts
└── README.md
```

Responsibilities:

- `lib/generation/*`: pure generation domain logic and OpenAI integration wrapper.
- `lib/supabase/*`: Supabase clients only; no product logic.
- `app/api/*`: server workflows and HTTP responses.
- `components/*`: UI only; call API routes or auth actions.
- `supabase/migrations/*`: schema, RLS, Storage bucket, and RPCs.
- `tests/unit/*`: pure functions.
- `tests/integration/*`: API route behavior with mocked external dependencies.
- `tests/e2e/*`: browser-level product flow smoke tests.

## Task 1: Scaffold Next.js App And Tooling

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `playwright.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create the Next.js project files**

Create `package.json`:

```json
{
  "name": "prompt-studio",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "verify": "npm run typecheck && npm run test && npm run build"
  },
  "dependencies": {
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.50.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "^15.3.0",
    "openai": "^5.8.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.53.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.0",
    "@types/node": "^22.15.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.5.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.28.0",
    "eslint-config-next": "^15.3.0",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co"
      }
    ]
  }
};

export default nextConfig;
```

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

export default config;
```

Create `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f3eb",
        ink: "#201f1c",
        muted: "#746f66",
        line: "#ddd4c6",
        accent: "#c94f37",
        moss: "#667761",
        night: "#171717"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(36, 31, 24, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
```

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Studio",
  description: "Structured AI image generation with professional prompt assembly."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  background: #f7f3eb;
  color: #201f1c;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #f7f3eb;
  color: #201f1c;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
textarea,
select {
  font: inherit;
}
```

Create `app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-10 text-ink">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">
          Prompt Studio
        </p>
        <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight">
          Generate polished images from structured creative choices.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          Choose the image type, ratio, style, scene, and whitespace. Prompt
          Studio turns them into a professional image prompt and saves every
          result to your history.
        </p>
      </section>
    </main>
  );
}
```

Create `vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"]
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  }
});
```

Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and dependencies install without errors.

- [ ] **Step 3: Verify the scaffold**

Run:

```bash
npm run typecheck
npm run test
npm run build
```

Expected:

- TypeScript exits with code 0.
- Vitest exits with code 0 and reports no tests or setup success.
- Next.js build succeeds.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs tailwind.config.ts app tests vitest.config.ts playwright.config.ts .gitignore
git commit -m "chore: scaffold Next.js app"
```

## Task 2: Add Generation Domain Logic With Tests

**Files:**

- Create: `lib/generation/options.ts`
- Create: `lib/generation/sizes.ts`
- Create: `lib/generation/prompt.ts`
- Create: `lib/generation/validation.ts`
- Create: `lib/types.ts`
- Create: `lib/utils.ts`
- Create: `tests/unit/prompt.test.ts`
- Create: `tests/unit/sizes.test.ts`
- Create: `tests/unit/validation.test.ts`

- [ ] **Step 1: Write failing tests for prompt compilation**

Create `tests/unit/prompt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { compilePrompt } from "@/lib/generation/prompt";

describe("compilePrompt", () => {
  it("creates a professional English image prompt from structured inputs", () => {
    const prompt = compilePrompt({
      imageType: "poster",
      aspectRatio: "4:5",
      style: "editorial",
      scene: "urban",
      whitespace: "top_text_space",
      subject: "a new coffee subscription brand",
      extraRequirements: "Use warm lighting and avoid readable text."
    });

    expect(prompt).toContain("Create a poster about a new coffee subscription brand");
    expect(prompt).toContain("editorial magazine-inspired visual style");
    expect(prompt).toContain("urban environment");
    expect(prompt).toContain("vertical 4:5 composition");
    expect(prompt).toContain("Reserve clean negative space near the top");
    expect(prompt).toContain("Additional requirements: Use warm lighting and avoid readable text.");
    expect(prompt).toContain("Avoid text artifacts, watermarks");
  });

  it("omits the additional requirements sentence when extra requirements are blank", () => {
    const prompt = compilePrompt({
      imageType: "avatar",
      aspectRatio: "1:1",
      style: "minimal",
      scene: "abstract",
      whitespace: "none",
      subject: "a calm productivity coach",
      extraRequirements: ""
    });

    expect(prompt).toContain("Create an avatar about a calm productivity coach");
    expect(prompt).not.toContain("Additional requirements:");
  });
});
```

- [ ] **Step 2: Write failing tests for size mapping**

Create `tests/unit/sizes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getImageSizeForAspectRatio } from "@/lib/generation/sizes";

describe("getImageSizeForAspectRatio", () => {
  it.each([
    ["1:1", "1024x1024"],
    ["4:5", "1024x1280"],
    ["16:9", "1536x864"],
    ["9:16", "864x1536"],
    ["3:2", "1536x1024"]
  ] as const)("maps %s to %s", (ratio, expected) => {
    expect(getImageSizeForAspectRatio(ratio)).toBe(expected);
  });
});
```

- [ ] **Step 3: Write failing tests for validation**

Create `tests/unit/validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { generationRequestSchema } from "@/lib/generation/validation";

describe("generationRequestSchema", () => {
  it("accepts valid structured generation input", () => {
    const parsed = generationRequestSchema.parse({
      imageType: "poster",
      aspectRatio: "1:1",
      style: "photorealistic",
      scene: "studio",
      whitespace: "none",
      subject: "a ceramic tea set",
      extraRequirements: "Soft shadows"
    });

    expect(parsed.subject).toBe("a ceramic tea set");
  });

  it("rejects unsupported options", () => {
    expect(() =>
      generationRequestSchema.parse({
        imageType: "unsupported",
        aspectRatio: "1:1",
        style: "photorealistic",
        scene: "studio",
        whitespace: "none",
        subject: "a ceramic tea set",
        extraRequirements: ""
      })
    ).toThrow();
  });

  it("requires a non-empty subject", () => {
    expect(() =>
      generationRequestSchema.parse({
        imageType: "poster",
        aspectRatio: "1:1",
        style: "photorealistic",
        scene: "studio",
        whitespace: "none",
        subject: " ",
        extraRequirements: ""
      })
    ).toThrow();
  });
});
```

- [ ] **Step 4: Run tests and verify they fail**

Run:

```bash
npm run test -- tests/unit/prompt.test.ts tests/unit/sizes.test.ts tests/unit/validation.test.ts
```

Expected: FAIL because `lib/generation/*` files do not exist.

- [ ] **Step 5: Implement generation domain files**

Create `lib/types.ts`:

```ts
export type ImageType =
  | "poster"
  | "cover"
  | "social"
  | "product"
  | "illustration"
  | "avatar"
  | "wallpaper"
  | "icon_logo";

export type AspectRatio = "1:1" | "4:5" | "16:9" | "9:16" | "3:2";

export type VisualStyle =
  | "photorealistic"
  | "editorial"
  | "minimal"
  | "3d_render"
  | "watercolor"
  | "cinematic"
  | "flat_illustration"
  | "luxury";

export type Scene =
  | "studio"
  | "outdoor"
  | "urban"
  | "nature"
  | "interior"
  | "abstract"
  | "product_setup"
  | "lifestyle";

export type Whitespace =
  | "none"
  | "top_text_space"
  | "left_text_space"
  | "right_text_space"
  | "center_subject_clean_bg";

export type GenerationInput = {
  imageType: ImageType;
  aspectRatio: AspectRatio;
  style: VisualStyle;
  scene: Scene;
  whitespace: Whitespace;
  subject: string;
  extraRequirements: string;
};

export type GenerationStatus = "processing" | "completed" | "failed";
```

Create `lib/generation/options.ts`:

```ts
import type {
  AspectRatio,
  ImageType,
  Scene,
  VisualStyle,
  Whitespace
} from "@/lib/types";

export const IMAGE_TYPES: Record<ImageType, { label: string; prompt: string }> = {
  poster: { label: "Poster", prompt: "poster" },
  cover: { label: "Cover image", prompt: "cover image" },
  social: { label: "Social media image", prompt: "social media image" },
  product: { label: "Product image", prompt: "product image" },
  illustration: { label: "Illustration", prompt: "illustration" },
  avatar: { label: "Avatar", prompt: "avatar" },
  wallpaper: { label: "Wallpaper", prompt: "wallpaper" },
  icon_logo: { label: "Icon or logo concept", prompt: "icon or logo concept" }
};

export const ASPECT_RATIOS: Record<AspectRatio, { label: string; prompt: string }> = {
  "1:1": { label: "1:1", prompt: "square 1:1 composition" },
  "4:5": { label: "4:5", prompt: "vertical 4:5 composition" },
  "16:9": { label: "16:9", prompt: "wide 16:9 composition" },
  "9:16": { label: "9:16", prompt: "vertical 9:16 composition" },
  "3:2": { label: "3:2", prompt: "landscape 3:2 composition" }
};

export const VISUAL_STYLES: Record<VisualStyle, { label: string; prompt: string }> = {
  photorealistic: { label: "Photorealistic", prompt: "photorealistic visual style" },
  editorial: {
    label: "Editorial",
    prompt: "editorial magazine-inspired visual style"
  },
  minimal: { label: "Minimal", prompt: "minimal, clean visual style" },
  "3d_render": { label: "3D render", prompt: "polished 3D render style" },
  watercolor: { label: "Watercolor", prompt: "soft watercolor illustration style" },
  cinematic: { label: "Cinematic", prompt: "cinematic lighting and framing" },
  flat_illustration: {
    label: "Flat illustration",
    prompt: "flat vector illustration style"
  },
  luxury: { label: "Luxury", prompt: "luxury brand visual style" }
};

export const SCENES: Record<Scene, { label: string; prompt: string }> = {
  studio: { label: "Studio", prompt: "studio setting" },
  outdoor: { label: "Outdoor", prompt: "outdoor setting" },
  urban: { label: "Urban", prompt: "urban environment" },
  nature: { label: "Nature", prompt: "natural environment" },
  interior: { label: "Interior", prompt: "interior setting" },
  abstract: { label: "Abstract", prompt: "abstract scene" },
  product_setup: { label: "Product setup", prompt: "carefully arranged product setup" },
  lifestyle: { label: "Lifestyle", prompt: "natural lifestyle scene" }
};

export const WHITESPACE: Record<Whitespace, { label: string; prompt: string }> = {
  none: { label: "No special whitespace", prompt: "Use a balanced composition." },
  top_text_space: {
    label: "Top text space",
    prompt: "Reserve clean negative space near the top for a text overlay."
  },
  left_text_space: {
    label: "Left text space",
    prompt: "Reserve clean negative space on the left for a text overlay."
  },
  right_text_space: {
    label: "Right text space",
    prompt: "Reserve clean negative space on the right for a text overlay."
  },
  center_subject_clean_bg: {
    label: "Center subject with clean background",
    prompt: "Keep the subject centered with a clean, uncluttered background."
  }
};

export const DEFAULT_GENERATION_INPUT = {
  imageType: "poster",
  aspectRatio: "1:1",
  style: "editorial",
  scene: "studio",
  whitespace: "none",
  subject: "",
  extraRequirements: ""
} satisfies {
  imageType: ImageType;
  aspectRatio: AspectRatio;
  style: VisualStyle;
  scene: Scene;
  whitespace: Whitespace;
  subject: string;
  extraRequirements: string;
};
```

Create `lib/generation/sizes.ts`:

```ts
import type { AspectRatio } from "@/lib/types";

const SIZE_BY_RATIO: Record<AspectRatio, string> = {
  "1:1": "1024x1024",
  "4:5": "1024x1280",
  "16:9": "1536x864",
  "9:16": "864x1536",
  "3:2": "1536x1024"
};

export function getImageSizeForAspectRatio(aspectRatio: AspectRatio) {
  return SIZE_BY_RATIO[aspectRatio];
}
```

Create `lib/generation/prompt.ts`:

```ts
import {
  ASPECT_RATIOS,
  IMAGE_TYPES,
  SCENES,
  VISUAL_STYLES,
  WHITESPACE
} from "@/lib/generation/options";
import type { GenerationInput } from "@/lib/types";

function articleFor(value: string) {
  return /^[aeiou]/i.test(value) ? "an" : "a";
}

export function compilePrompt(input: GenerationInput) {
  const imageType = IMAGE_TYPES[input.imageType].prompt;
  const style = VISUAL_STYLES[input.style].prompt;
  const scene = SCENES[input.scene].prompt;
  const ratio = ASPECT_RATIOS[input.aspectRatio].prompt;
  const whitespace = WHITESPACE[input.whitespace].prompt;
  const subject = input.subject.trim();
  const extra = input.extraRequirements.trim();

  const sentences = [
    `Create ${articleFor(imageType)} ${imageType} about ${subject} in ${style}, set in ${scene}, with ${ratio}.`,
    whitespace
  ];

  if (extra.length > 0) {
    sentences.push(`Additional requirements: ${extra}.`);
  }

  sentences.push(
    "Avoid text artifacts, watermarks, distorted anatomy, low-resolution details, and cluttered composition."
  );

  return sentences.join(" ");
}
```

Create `lib/generation/validation.ts`:

```ts
import { z } from "zod";

export const generationRequestSchema = z.object({
  imageType: z.enum([
    "poster",
    "cover",
    "social",
    "product",
    "illustration",
    "avatar",
    "wallpaper",
    "icon_logo"
  ]),
  aspectRatio: z.enum(["1:1", "4:5", "16:9", "9:16", "3:2"]),
  style: z.enum([
    "photorealistic",
    "editorial",
    "minimal",
    "3d_render",
    "watercolor",
    "cinematic",
    "flat_illustration",
    "luxury"
  ]),
  scene: z.enum([
    "studio",
    "outdoor",
    "urban",
    "nature",
    "interior",
    "abstract",
    "product_setup",
    "lifestyle"
  ]),
  whitespace: z.enum([
    "none",
    "top_text_space",
    "left_text_space",
    "right_text_space",
    "center_subject_clean_bg"
  ]),
  subject: z.string().trim().min(1).max(180),
  extraRequirements: z.string().trim().max(500).default("")
});

export type GenerationRequest = z.infer<typeof generationRequestSchema>;
```

Create `lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 6: Run unit tests**

Run:

```bash
npm run test -- tests/unit/prompt.test.ts tests/unit/sizes.test.ts tests/unit/validation.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib tests/unit
git commit -m "feat: add generation domain logic"
```

## Task 3: Add Supabase Schema, RLS, Storage, And RPCs

**Files:**

- Create: `supabase/migrations/202606290001_initial_schema.sql`
- Create: `.env.example`

- [ ] **Step 1: Create the database migration**

Create `supabase/migrations/202606290001_initial_schema.sql`:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  credits_balance integer not null default 5 check (credits_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('processing', 'completed', 'failed')),
  image_type text not null,
  aspect_ratio text not null,
  style text not null,
  scene text not null,
  whitespace text not null,
  subject text not null,
  extra_requirements text not null default '',
  compiled_prompt text not null,
  storage_path text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null check (reason in ('signup_bonus', 'generation')),
  generation_id uuid references public.generation_jobs(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.upgrade_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  source text not null,
  created_at timestamptz not null default now(),
  unique (user_id, source)
);

create unique index if not exists generation_jobs_one_processing_per_user
on public.generation_jobs(user_id)
where status = 'processing';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.complete_generation_and_charge(
  p_user_id uuid,
  p_generation_id uuid,
  p_storage_path text
)
returns public.generation_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_job public.generation_jobs;
begin
  update public.profiles
  set credits_balance = credits_balance - 1
  where id = p_user_id and credits_balance >= 1;

  if not found then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  update public.generation_jobs
  set status = 'completed',
      storage_path = p_storage_path,
      completed_at = now(),
      error_message = null
  where id = p_generation_id
    and user_id = p_user_id
    and status = 'processing'
  returning * into updated_job;

  if updated_job.id is null then
    raise exception 'GENERATION_NOT_PROCESSING';
  end if;

  insert into public.credit_transactions(user_id, amount, reason, generation_id)
  values (p_user_id, -1, 'generation', p_generation_id);

  return updated_job;
end;
$$;

create or replace function public.mark_generation_failed(
  p_user_id uuid,
  p_generation_id uuid,
  p_error_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.generation_jobs
  set status = 'failed',
      error_message = left(p_error_message, 1000),
      completed_at = now()
  where id = p_generation_id
    and user_id = p_user_id
    and status = 'processing';
end;
$$;

alter table public.profiles enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.upgrade_waitlist enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "generation_jobs_select_own"
on public.generation_jobs for select
using (auth.uid() = user_id);

create policy "generation_jobs_insert_own"
on public.generation_jobs for insert
with check (auth.uid() = user_id);

create policy "credit_transactions_select_own"
on public.credit_transactions for select
using (auth.uid() = user_id);

create policy "upgrade_waitlist_select_own"
on public.upgrade_waitlist for select
using (auth.uid() = user_id);

create policy "upgrade_waitlist_insert_own"
on public.upgrade_waitlist for insert
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('generated-images', 'generated-images', false)
on conflict (id) do nothing;

create policy "generated_images_select_own"
on storage.objects for select
using (
  bucket_id = 'generated-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "generated_images_insert_own"
on storage.objects for insert
with check (
  bucket_id = 'generated-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

- [ ] **Step 2: Create environment example**

Create `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 3: Apply migration locally**

Run after linking a Supabase project or starting local Supabase:

```bash
supabase db push
```

Expected: migration succeeds and the `generated-images` private bucket exists.

- [ ] **Step 4: Commit**

```bash
git add supabase .env.example
git commit -m "feat: add Supabase schema"
```

## Task 4: Add Supabase Clients, Auth Callback, And Profile Bootstrap

**Files:**

- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/browser.ts`
- Create: `lib/supabase/admin.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `middleware.ts`
- Create: `lib/auth/ensure-profile.ts`
- Create: `lib/auth/actions.ts`
- Create: `app/auth/callback/route.ts`
- Create: `components/app-header.tsx`
- Create: `components/account-menu.tsx`
- Create: `components/credit-badge.tsx`

- [ ] **Step 1: Implement Supabase clients**

Create `lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
}
```

Create `lib/supabase/browser.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Create `lib/supabase/admin.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
```

Create `lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  await supabase.auth.getUser();
  return response;
}
```

Create `middleware.ts`:

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
```

- [ ] **Step 2: Implement profile bootstrap**

Create `lib/auth/ensure-profile.ts`:

```ts
import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function ensureProfile(user: User) {
  const admin = createSupabaseAdminClient();
  const email = user.email ?? "";
  const displayName =
    typeof user.user_metadata.name === "string" ? user.user_metadata.name : null;
  const avatarUrl =
    typeof user.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  const { data: existing, error: existingError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return;
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: user.id,
    email,
    display_name: displayName,
    avatar_url: avatarUrl,
    credits_balance: 5
  });

  if (profileError) {
    throw profileError;
  }

  const { error: transactionError } = await admin.from("credit_transactions").insert({
    user_id: user.id,
    amount: 5,
    reason: "signup_bonus"
  });

  if (transactionError) {
    throw transactionError;
  }
}
```

Create `app/auth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/generate";

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      await ensureProfile(data.user);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
```

Create `lib/auth/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithGoogle(next = "/generate") {
  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
    }
  });

  if (error) {
    throw error;
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
```

- [ ] **Step 3: Add header and account UI**

Create `components/credit-badge.tsx`:

```tsx
export function CreditBadge({ credits }: { credits: number | null }) {
  if (credits === null) {
    return null;
  }

  return (
    <span className="rounded border border-line bg-white px-3 py-1 text-sm font-medium text-ink">
      {credits} credits
    </span>
  );
}
```

Create `components/account-menu.tsx`:

```tsx
import { LogIn, LogOut } from "lucide-react";
import { signInWithGoogle, signOut } from "@/lib/auth/actions";

type AccountMenuProps = {
  email: string | null;
};

export function AccountMenu({ email }: AccountMenuProps) {
  if (!email) {
    return (
      <form action={async () => {
        "use server";
        await signInWithGoogle("/generate");
      }}>
        <button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white">
          <LogIn className="h-4 w-4" />
          Sign in
        </button>
      </form>
    );
  }

  return (
    <form action={signOut} className="inline-flex items-center gap-3">
      <span className="max-w-48 truncate text-sm text-muted">{email}</span>
      <button className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink">
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}
```

Create `components/app-header.tsx`:

```tsx
import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { CreditBadge } from "@/components/credit-badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function AppHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let credits: number | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", user.id)
      .maybeSingle();
    credits = data?.credits_balance ?? null;
  }

  return (
    <header className="border-b border-line bg-canvas/95 px-6 py-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="text-lg font-semibold text-ink">
          Prompt Studio
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/generate" className="text-sm text-muted hover:text-ink">
            Generate
          </Link>
          <Link href="/history" className="text-sm text-muted hover:text-ink">
            History
          </Link>
          <CreditBadge credits={credits} />
          <AccountMenu email={user?.email ?? null} />
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Wire header into layout**

Modify `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Studio",
  description: "Structured AI image generation with professional prompt assembly."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify auth plumbing compiles**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

```bash
git add app/auth components lib/auth lib/supabase middleware.ts app/layout.tsx
git commit -m "feat: add Supabase auth plumbing"
```

## Task 5: Build Generator UI And Prompt Preview

**Files:**

- Create: `components/prompt-preview.tsx`
- Create: `components/result-panel.tsx`
- Create: `components/upgrade-modal.tsx`
- Create: `components/auth-dialog.tsx`
- Create: `components/generator-form.tsx`
- Create: `app/generate/page.tsx`

- [ ] **Step 1: Add preview and result components**

Create `components/prompt-preview.tsx`:

```tsx
export function PromptPreview({ prompt }: { prompt: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Professional prompt</h2>
        <span className="text-xs uppercase text-muted">Read-only</span>
      </div>
      <p className="mt-4 whitespace-pre-wrap rounded-md bg-canvas p-4 text-sm leading-6 text-muted">
        {prompt}
      </p>
    </section>
  );
}
```

Create `components/result-panel.tsx`:

```tsx
type ResultPanelProps = {
  imageUrl: string | null;
  error: string | null;
  isLoading: boolean;
};

export function ResultPanel({ imageUrl, error, isLoading }: ResultPanelProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-base font-semibold text-ink">Result</h2>
      <div className="mt-4 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-canvas">
        {isLoading ? (
          <p className="text-sm text-muted">Generating...</p>
        ) : imageUrl ? (
          <img src={imageUrl} alt="Generated result" className="h-full w-full object-cover" />
        ) : (
          <p className="px-6 text-center text-sm text-muted">
            Your generated image will appear here.
          </p>
        )}
      </div>
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
    </section>
  );
}
```

- [ ] **Step 2: Add modal components**

Create `components/auth-dialog.tsx`:

```tsx
import { signInWithGoogle } from "@/lib/auth/actions";

export function AuthDialog({ open }: { open: boolean }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Sign in to generate</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          You can prepare the prompt before signing in. Google login is required
          when you create the image.
        </p>
        <form action={async () => {
          "use server";
          await signInWithGoogle("/generate");
        }}>
          <button className="mt-5 w-full rounded-md bg-ink px-4 py-2 text-sm font-medium text-white">
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
```

Create `components/upgrade-modal.tsx`:

```tsx
"use client";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  onJoinWaitlist: () => Promise<void>;
  joined: boolean;
};

export function UpgradeModal({
  open,
  onClose,
  onJoinWaitlist,
  joined
}: UpgradeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Upgrade coming soon</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          You have used your free credits. Join the waitlist and we will let you
          know when paid plans are available.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink"
          >
            Close
          </button>
          <button
            onClick={onJoinWaitlist}
            disabled={joined}
            className="flex-1 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {joined ? "Joined" : "Join waitlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add generator form**

Create `components/generator-form.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  ASPECT_RATIOS,
  DEFAULT_GENERATION_INPUT,
  IMAGE_TYPES,
  SCENES,
  VISUAL_STYLES,
  WHITESPACE
} from "@/lib/generation/options";
import { compilePrompt } from "@/lib/generation/prompt";
import type { GenerationInput } from "@/lib/types";
import { PromptPreview } from "@/components/prompt-preview";
import { ResultPanel } from "@/components/result-panel";
import { UpgradeModal } from "@/components/upgrade-modal";

type GeneratorFormProps = {
  isLoggedIn: boolean;
};

type GenerateResponse =
  | { imageUrl: string }
  | { error: string; code?: "UNAUTHENTICATED" | "INSUFFICIENT_CREDITS" };

export function GeneratorForm({ isLoggedIn }: GeneratorFormProps) {
  const [input, setInput] = useState<GenerationInput>(DEFAULT_GENERATION_INPUT);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [joined, setJoined] = useState(false);

  const prompt = useMemo(() => {
    if (!input.subject.trim()) {
      return "Enter a subject to preview the professional prompt.";
    }
    return compilePrompt(input);
  }, [input]);

  function update<K extends keyof GenerationInput>(key: K, value: GenerationInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setError(null);

    if (!isLoggedIn) {
      setError("Please sign in with Google to generate an image.");
      return;
    }

    setIsLoading(true);
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const payload = (await response.json()) as GenerateResponse;
    setIsLoading(false);

    if (!response.ok || "error" in payload) {
      if ("code" in payload && payload.code === "INSUFFICIENT_CREDITS") {
        setUpgradeOpen(true);
      }
      setError("error" in payload ? payload.error : "Generation failed.");
      return;
    }

    setImageUrl(payload.imageUrl);
  }

  async function joinWaitlist() {
    const response = await fetch("/api/upgrade-waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "insufficient_credits_modal" })
    });

    if (response.ok) {
      setJoined(true);
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="rounded-lg border border-line bg-white p-5">
          <h1 className="text-2xl font-semibold text-ink">Create an image</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Select label="Image type" value={input.imageType} options={IMAGE_TYPES} onChange={(value) => update("imageType", value as GenerationInput["imageType"])} />
            <Select label="Aspect ratio" value={input.aspectRatio} options={ASPECT_RATIOS} onChange={(value) => update("aspectRatio", value as GenerationInput["aspectRatio"])} />
            <Select label="Style" value={input.style} options={VISUAL_STYLES} onChange={(value) => update("style", value as GenerationInput["style"])} />
            <Select label="Scene" value={input.scene} options={SCENES} onChange={(value) => update("scene", value as GenerationInput["scene"])} />
            <div className="sm:col-span-2">
              <Select label="Whitespace" value={input.whitespace} options={WHITESPACE} onChange={(value) => update("whitespace", value as GenerationInput["whitespace"])} />
            </div>
          </div>
          <label className="mt-5 block text-sm font-medium text-ink">
            Subject
            <input
              value={input.subject}
              onChange={(event) => update("subject", event.target.value)}
              maxLength={180}
              className="mt-2 w-full rounded-md border border-line px-3 py-2"
              placeholder="a coffee brand launch poster"
            />
          </label>
          <label className="mt-5 block text-sm font-medium text-ink">
            Additional requirements
            <textarea
              value={input.extraRequirements}
              onChange={(event) => update("extraRequirements", event.target.value)}
              maxLength={500}
              className="mt-2 min-h-28 w-full rounded-md border border-line px-3 py-2"
              placeholder="Mood, colors, objects, audience, details to avoid"
            />
          </label>
          <button
            onClick={submit}
            disabled={isLoading || !input.subject.trim()}
            className="mt-6 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Generate 1 image
          </button>
        </section>
        <div className="grid gap-6">
          <PromptPreview prompt={prompt} />
          <ResultPanel imageUrl={imageUrl} error={error} isLoading={isLoading} />
        </div>
      </div>
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onJoinWaitlist={joinWaitlist}
        joined={joined}
      />
    </>
  );
}

function Select({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Record<string, { label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2"
      >
        {Object.entries(options).map(([key, option]) => (
          <option key={key} value={key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 4: Add generate page**

Create `app/generate/page.tsx`:

```tsx
import { GeneratorForm } from "@/components/generator-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GeneratePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-canvas px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <GeneratorForm isLoggedIn={Boolean(user)} />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify UI compiles**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

```bash
git add app/generate components
git commit -m "feat: add generator UI"
```

## Task 6: Add OpenAI Wrapper And Generate API

**Files:**

- Create: `lib/generation/openai.ts`
- Create: `app/api/generate/route.ts`
- Create: `tests/integration/generate-route.test.ts`

- [ ] **Step 1: Write failing route tests**

Create `tests/integration/generate-route.test.ts` with dependency mocks for Supabase and OpenAI. Use these scenarios:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn()
}));

vi.mock("@/lib/generation/openai", () => ({
  generateImageBytes: vi.fn()
}));

describe("POST /api/generate", () => {
  it("returns 401 when the user is not logged in", async () => {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
    } as never);

    const { POST } = await import("@/app/api/generate/route");
    const response = await POST(new Request("http://test.local/api/generate", {
      method: "POST",
      body: JSON.stringify(validRequest()),
      headers: { "Content-Type": "application/json" }
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHENTICATED"
    });
  });

  it("returns 402 when credits are insufficient", async () => {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: { credits_balance: 0 } })
          }))
        }))
      }))
    } as never);

    const { POST } = await import("@/app/api/generate/route");
    const response = await POST(new Request("http://test.local/api/generate", {
      method: "POST",
      body: JSON.stringify(validRequest()),
      headers: { "Content-Type": "application/json" }
    }));

    expect(response.status).toBe(402);
    await expect(response.json()).resolves.toMatchObject({
      code: "INSUFFICIENT_CREDITS"
    });
  });
});

function validRequest() {
  return {
    imageType: "poster",
    aspectRatio: "1:1",
    style: "editorial",
    scene: "studio",
    whitespace: "none",
    subject: "a coffee brand poster",
    extraRequirements: ""
  };
}
```

- [ ] **Step 2: Run route tests and verify failure**

Run:

```bash
npm run test -- tests/integration/generate-route.test.ts
```

Expected: FAIL because route and OpenAI wrapper do not exist.

- [ ] **Step 3: Add OpenAI wrapper**

Create `lib/generation/openai.ts`:

```ts
import OpenAI from "openai";
import { getImageSizeForAspectRatio } from "@/lib/generation/sizes";
import type { AspectRatio } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateImageBytes({
  prompt,
  aspectRatio
}: {
  prompt: string;
  aspectRatio: AspectRatio;
}) {
  const result = await openai.images.generate({
    model: "gpt-image-2",
    prompt,
    size: getImageSizeForAspectRatio(aspectRatio),
    quality: "medium"
  });

  const imageBase64 = result.data?.[0]?.b64_json;

  if (!imageBase64) {
    throw new Error("OpenAI did not return image data.");
  }

  return Buffer.from(imageBase64, "base64");
}
```

- [ ] **Step 4: Add generate route**

Create `app/api/generate/route.ts`:

```ts
import { NextResponse } from "next/server";
import { generateImageBytes } from "@/lib/generation/openai";
import { compilePrompt } from "@/lib/generation/prompt";
import { generationRequestSchema } from "@/lib/generation/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to generate images.", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const parsed = generationRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the generation form.", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  const { data: processing } = await admin
    .from("generation_jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "processing")
    .maybeSingle();

  if (processing) {
    return NextResponse.json(
      { error: "An image is already being generated.", code: "GENERATION_IN_PROGRESS" },
      { status: 409 }
    );
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Your account profile could not be loaded.", code: "PROFILE_NOT_FOUND" },
      { status: 404 }
    );
  }

  if (profile.credits_balance < 1) {
    return NextResponse.json(
      { error: "You do not have enough credits.", code: "INSUFFICIENT_CREDITS" },
      { status: 402 }
    );
  }

  const compiledPrompt = compilePrompt(parsed.data);
  const { data: job, error: jobError } = await admin
    .from("generation_jobs")
    .insert({
      user_id: user.id,
      status: "processing",
      image_type: parsed.data.imageType,
      aspect_ratio: parsed.data.aspectRatio,
      style: parsed.data.style,
      scene: parsed.data.scene,
      whitespace: parsed.data.whitespace,
      subject: parsed.data.subject,
      extra_requirements: parsed.data.extraRequirements,
      compiled_prompt: compiledPrompt
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Could not start the generation.", code: "JOB_CREATE_FAILED" },
      { status: 500 }
    );
  }

  try {
    const imageBytes = await generateImageBytes({
      prompt: compiledPrompt,
      aspectRatio: parsed.data.aspectRatio
    });
    const storagePath = `${user.id}/${job.id}.png`;
    const { error: uploadError } = await admin.storage
      .from("generated-images")
      .upload(storagePath, imageBytes, {
        contentType: "image/png",
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: completed, error: completeError } = await admin.rpc(
      "complete_generation_and_charge",
      {
        p_user_id: user.id,
        p_generation_id: job.id,
        p_storage_path: storagePath
      }
    );

    if (completeError || !completed) {
      throw completeError ?? new Error("Completion failed.");
    }

    const { data: signed } = await admin.storage
      .from("generated-images")
      .createSignedUrl(storagePath, 60 * 60);

    return NextResponse.json({
      id: job.id,
      imageUrl: signed?.signedUrl ?? null,
      compiledPrompt
    });
  } catch (error) {
    await admin.rpc("mark_generation_failed", {
      p_user_id: user.id,
      p_generation_id: job.id,
      p_error_message: error instanceof Error ? error.message : "Unknown generation error"
    });

    return NextResponse.json(
      { error: "Generation failed. Your credits were not charged.", code: "GENERATION_FAILED" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Run integration and unit tests**

Run:

```bash
npm run test -- tests/unit tests/integration/generate-route.test.ts
```

Expected: PASS. If the chained Supabase test double throws, compare the thrown method name with the calls in `app/api/generate/route.ts`, add that method to the mocked object, and rerun the same command. Do not change the expected HTTP statuses or response codes.

- [ ] **Step 6: Commit**

```bash
git add app/api/generate lib/generation/openai.ts tests/integration/generate-route.test.ts
git commit -m "feat: add image generation API"
```

## Task 7: Add Upgrade Waitlist API

**Files:**

- Create: `app/api/upgrade-waitlist/route.ts`
- Create: `tests/integration/upgrade-waitlist-route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/integration/upgrade-waitlist-route.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn()
}));

describe("POST /api/upgrade-waitlist", () => {
  it("requires login", async () => {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
    } as never);

    const { POST } = await import("@/app/api/upgrade-waitlist/route");
    const response = await POST(new Request("http://test.local/api/upgrade-waitlist", {
      method: "POST",
      body: JSON.stringify({ source: "test" })
    }));

    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 2: Add route implementation**

Create `app/api/upgrade-waitlist/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  source: z.string().trim().min(1).max(80)
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to join the waitlist.", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid waitlist source.", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("upgrade_waitlist").upsert(
    {
      user_id: user.id,
      email: user.email ?? "",
      source: parsed.data.source
    },
    { onConflict: "user_id,source", ignoreDuplicates: true }
  );

  if (error) {
    return NextResponse.json(
      { error: "Could not join the waitlist.", code: "WAITLIST_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm run test -- tests/integration/upgrade-waitlist-route.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/api/upgrade-waitlist tests/integration/upgrade-waitlist-route.test.ts
git commit -m "feat: add upgrade waitlist API"
```

## Task 8: Add History API And History Page

**Files:**

- Create: `app/api/history/route.ts`
- Create: `components/history-grid.tsx`
- Create: `app/history/page.tsx`

- [ ] **Step 1: Add history API**

Create `app/api/history/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to view history.", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: jobs, error } = await admin
    .from("generation_jobs")
    .select("id, image_type, subject, compiled_prompt, storage_path, created_at, completed_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Could not load history.", code: "HISTORY_FAILED" },
      { status: 500 }
    );
  }

  const items = await Promise.all(
    (jobs ?? []).map(async (job) => {
      const { data: signed } = await admin.storage
        .from("generated-images")
        .createSignedUrl(job.storage_path, 60 * 60);

      return {
        ...job,
        imageUrl: signed?.signedUrl ?? null
      };
    })
  );

  return NextResponse.json({ items });
}
```

- [ ] **Step 2: Add history UI**

Create `components/history-grid.tsx`:

```tsx
type HistoryItem = {
  id: string;
  image_type: string;
  subject: string;
  compiled_prompt: string;
  imageUrl: string | null;
  created_at: string;
};

export function HistoryGrid({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-ink">No images yet</h2>
        <p className="mt-3 text-sm text-muted">
          Your generated images will appear here after the first successful run.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="aspect-square bg-canvas">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.subject} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="p-4">
            <p className="text-xs uppercase text-muted">{item.image_type}</p>
            <h2 className="mt-2 line-clamp-2 text-base font-semibold text-ink">
              {item.subject}
            </h2>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
              {item.compiled_prompt}
            </p>
            <a
              href={item.imageUrl ?? "#"}
              download
              className="mt-4 inline-flex rounded-md border border-line px-3 py-2 text-sm font-medium text-ink"
            >
              Download
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
```

Create `app/history/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { HistoryGrid } from "@/components/history-grid";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/generate");
  }

  const admin = createSupabaseAdminClient();
  const { data: jobs } = await admin
    .from("generation_jobs")
    .select("id, image_type, subject, compiled_prompt, storage_path, created_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const items = await Promise.all(
    (jobs ?? []).map(async (job) => {
      const { data: signed } = await admin.storage
        .from("generated-images")
        .createSignedUrl(job.storage_path, 60 * 60);

      return {
        ...job,
        imageUrl: signed?.signedUrl ?? null
      };
    })
  );

  return (
    <main className="min-h-screen bg-canvas px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Generation history</h1>
        <div className="mt-6">
          <HistoryGrid items={items} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add app/api/history app/history components/history-grid.tsx
git commit -m "feat: add generation history"
```

## Task 9: Finish Home Page And Visual Polish

**Files:**

- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace placeholder home page**

Modify `app/page.tsx`:

```tsx
import Link from "next/link";
import { ArrowRight, History, Sparkles, Wand2 } from "lucide-react";

const previewRows = [
  ["Type", "Poster"],
  ["Ratio", "4:5"],
  ["Style", "Editorial"],
  ["Scene", "Studio"],
  ["Whitespace", "Top text space"]
];

export default function HomePage() {
  return (
    <main className="bg-canvas text-ink">
      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            Prompt Studio
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight">
            Structured image generation for polished creative work.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Pick image type, ratio, style, scene, and whitespace. Prompt Studio
            turns your choices into a professional GPT Image prompt and saves
            every result to your history.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white"
            >
              Start generating
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink"
            >
              View history
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <p className="text-sm font-semibold">Generator preview</p>
              <p className="text-xs text-muted">5 starter credits included</p>
            </div>
            <Wand2 className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-5 grid gap-3">
            {previewRows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-md bg-canvas px-4 py-3">
                <span className="text-sm text-muted">{label}</span>
                <span className="text-sm font-medium text-ink">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md bg-night p-4 text-sm leading-6 text-white">
            Create a poster about a ceramic coffee subscription in editorial
            magazine-inspired style, set in a studio setting...
          </div>
        </div>
      </section>
      <section className="border-t border-line bg-white px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          <Feature icon={<Sparkles className="h-5 w-5" />} title="Structured choices" text="Use presets for type, ratio, style, scene, and whitespace instead of starting from a blank prompt." />
          <Feature icon={<Wand2 className="h-5 w-5" />} title="Prompt assembly" text="Every choice becomes a professional English prompt preview before generation." />
          <Feature icon={<History className="h-5 w-5" />} title="Saved history" text="Successful generations are saved privately so you can revisit and download them." />
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  text
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-lg border border-line bg-canvas p-5">
      <div className="text-accent">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </article>
  );
}
```

- [ ] **Step 2: Verify responsive polish**

Run:

```bash
npm run build
npm run dev
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/generate`
- `http://localhost:3000/history`

Expected:

- Header links are visible.
- Home first viewport shows product and generator preview.
- Generate page has no text overlap at desktop width.
- History redirects or shows empty state depending on auth.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "feat: polish home page"
```

## Task 10: Add E2E Smoke Tests

**Files:**

- Create: `tests/e2e/generator.spec.ts`

- [ ] **Step 1: Write Playwright smoke tests**

Create `tests/e2e/generator.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("anonymous user can fill generator and sees login-required message", async ({ page }) => {
  await page.goto("/generate");
  await page.getByLabel("Subject").fill("a launch poster for a ceramic tea brand");
  await expect(page.getByText("Create a poster about a launch poster")).toBeVisible();
  await page.getByRole("button", { name: "Generate 1 image" }).click();
  await expect(page.getByText("Please sign in with Google to generate an image.")).toBeVisible();
});

test("home page links to generator", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Start generating/i }).click();
  await expect(page).toHaveURL(/\/generate$/);
  await expect(page.getByRole("heading", { name: "Create an image" })).toBeVisible();
});
```

- [ ] **Step 2: Run E2E tests**

Run:

```bash
npm run test:e2e
```

Expected: PASS for anonymous flows.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/generator.spec.ts
git commit -m "test: add generator smoke tests"
```

## Task 11: Add README And Deployment Notes

**Files:**

- Create: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Write README**

Create `README.md`:

````md
# Prompt Studio

Prompt Studio is a structured AI image generation MVP. Users choose image type,
aspect ratio, style, scene, whitespace needs, subject, and extra requirements.
The app compiles those choices into a professional GPT Image prompt and uses the
OpenAI Image API to generate one image.

## Stack

- Next.js App Router
- Supabase Auth, Postgres, Storage
- OpenAI Images API with `gpt-image-2`
- Vercel deployment

## Environment Variables

Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Local Development

```bash
npm install
npm run dev
```

## Tests

```bash
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

## Supabase Setup

Apply the schema in `supabase/migrations/202606290001_initial_schema.sql`.

Enable Google OAuth in Supabase Auth and set the callback URL:

```text
http://localhost:3000/auth/callback
https://your-vercel-domain/auth/callback
```

The migration creates:

- `profiles`
- `generation_jobs`
- `credit_transactions`
- `upgrade_waitlist`
- private `generated-images` Storage bucket
- RLS policies
- generation completion RPCs

## Deployment

Deploy to Vercel and set the same environment variables. Set
`NEXT_PUBLIC_SITE_URL` to the deployed origin, for example:

```text
https://prompt-studio.example.com
```
````

- [ ] **Step 2: Verify docs match implementation**

Run:

```bash
rg -n "NEXT_PUBLIC_SUPABASE_URL|OPENAI_API_KEY|gpt-image-2|generated-images" README.md .env.example lib app supabase
```

Expected: all required environment variables and integration names are documented.

- [ ] **Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "docs: add setup and deployment notes"
```

## Task 12: Final Verification

**Files:**

- No new files expected.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm run typecheck
npm run test
npm run build
```

Expected: all pass.

- [ ] **Step 2: Run E2E verification**

Run:

```bash
npm run test:e2e
```

Expected: anonymous smoke tests pass.

- [ ] **Step 3: Manual local smoke test**

Run:

```bash
npm run dev
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/generate`

Expected:

- Home page loads and first viewport clearly shows Prompt Studio and the generator preview.
- Generate page allows anonymous form input.
- Prompt preview updates when subject and options change.
- Anonymous Generate click shows a sign-in-required message.

- [ ] **Step 4: Manual authenticated smoke test**

With Supabase Google OAuth and environment variables configured:

1. Sign in with Google.
2. Confirm a `profiles` row exists with `credits_balance = 5`.
3. Generate one image.
4. Confirm a row exists in `generation_jobs` with `status = completed`.
5. Confirm a file exists under the authenticated user's folder in the `generated-images` bucket. The expected path pattern is `generated-images/{auth-user-id}/{generation-job-id}.png`.
6. Confirm `profiles.credits_balance = 4`.
7. Confirm `credit_transactions` contains a `-1` generation row.
8. Visit `/history` and confirm the generated image appears.

- [ ] **Step 5: Resolve verification failures at the source task**

If any command in this task fails, return to the task that introduced the failing file, fix that implementation, rerun that task's verification command, and amend that task's commit before repeating final verification.

## Plan Self-Review Checklist

- Spec coverage:
  - Home page: Task 9.
  - Generate page with structured controls and read-only prompt preview: Tasks 2 and 5.
  - Google login: Task 4.
  - New user 5 credits: Tasks 3 and 4.
  - Generation history: Task 8.
  - Credit check and charge after successful storage: Tasks 3 and 6.
  - Insufficient credit upgrade prompt and waitlist: Tasks 5 and 7.
  - No payment, email, admin, SEO, editing, upload, or multi-model switching: maintained by architecture and file scope.
  - Deployment notes: Task 11.
- Placeholder scan:
  - No unfinished-marker tokens or deferred-work language remain.
  - No shell placeholders or angle-bracket file paths remain.
- Type consistency:
  - `GenerationInput` keys match validation schema and form state.
  - Option ids match Supabase fields and prompt compiler.
  - API response codes match generator form handling.
- Known execution caution:
  - Integration tests use mocked chained Supabase clients; their behavior assertions must remain exactly the same if the test double shape is refined during execution.
