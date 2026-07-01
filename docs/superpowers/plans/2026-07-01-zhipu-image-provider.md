# Zhipu Image Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default image generation provider with low-cost Zhipu `cogview-3-flash`, while keeping OpenAI as a configurable fallback.

**Architecture:** Keep `/api/generate` and the Supabase upload/credit workflow unchanged. Move provider-specific image generation behind `lib/generation/providers`, so the route still receives image bytes and does not care whether a provider returns base64 or a temporary image URL.

**Tech Stack:** Next.js 15, TypeScript, Vitest, native `fetch`, Zhipu image generation API, existing OpenAI SDK wrapper.

---

### Task 1: Provider Abstraction

**Files:**
- Create: `lib/generation/providers/types.ts`
- Create: `lib/generation/providers/zhipu.ts`
- Create: `lib/generation/providers/openai.ts`
- Create: `lib/generation/providers/index.ts`
- Modify: `lib/generation/openai.ts`
- Test: `tests/unit/image-provider.test.ts`

- [ ] Write failing tests for Zhipu default provider, request body, URL download, and missing API key.
- [ ] Run `npm test -- tests/unit/image-provider.test.ts` and confirm the tests fail because the provider files do not exist.
- [ ] Implement provider files with `cogview-3-flash` as the default.
- [ ] Keep `lib/generation/openai.ts` as a compatibility re-export for existing route tests.
- [ ] Run `npm test -- tests/unit/image-provider.test.ts tests/unit/openai-wrapper.test.ts`.

### Task 2: Error And Configuration Polish

**Files:**
- Modify: `.env.example`
- Modify: `app/api/generate/route.ts`
- Modify: `lib/i18n/config.ts`
- Test: `tests/integration/generate-route.test.ts`

- [ ] Add `IMAGE_PROVIDER=zhipu` and `ZHIPU_API_KEY=` to `.env.example`.
- [ ] Add API error classification for missing provider credentials.
- [ ] Add Chinese and English UI messages for provider credential errors.
- [ ] Run `npm test -- tests/integration/generate-route.test.ts`.

### Task 3: Verification

- [ ] Run `npm run lint`.
- [ ] Run `npm run verify`.
- [ ] Restart the local dev server.
- [ ] Ask the user to place `ZHIPU_API_KEY` in `.env.local` before real generation smoke testing.
