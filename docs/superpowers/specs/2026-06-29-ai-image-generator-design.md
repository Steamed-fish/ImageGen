# AI Image Generator MVP Design

Date: 2026-06-29

## Summary

Build a deployable MVP for a general-purpose AI image generation website. The product is not a plain prompt box. Users choose structured options such as image type, aspect ratio, style, scene, and whitespace needs, then enter a subject and optional requirements. The system compiles those inputs into a professional English GPT Image prompt and calls the OpenAI Images API to generate one image.

The first version includes:

- Home page
- Image generation page
- Google login
- Generation history
- Credit system
- Upgrade interest entry without real payment

The first version explicitly excludes:

- Real payment
- Email flows
- Admin dashboard
- Complex SEO
- Image editing
- Reference image upload
- Multi-model switching

## Language Strategy

The MVP supports a bilingual Chinese and English interface. Users can switch the interface language from the header, and the choice is persisted in a `prompt_studio_locale` cookie. Chinese is the default language.

The final compiled prompt is always built from English templates and English preset prompt fragments for the OpenAI Images API. User-entered subject and additional requirements are preserved exactly as entered, so the MVP does not call a translation model or rewrite the user's free-text input.

## Product Positioning

The MVP is a general AI image generation tool with a structured creation workflow. It should feel like a professional creative studio rather than a broad template marketplace or a decorative landing page.

The visual direction is "creative studio":

- Calm, focused, and useful
- Professional enough for repeat use
- Structured controls as the main product signal
- Avoid a generic AI prompt-box feel

## Recommended Architecture

Use a single Next.js full-stack application for the first version:

- Next.js App Router for pages, route handlers, and server-side workflows
- Supabase Auth for Google login
- Supabase Postgres for profiles, credits, generation history, and upgrade waitlist
- Supabase Storage for generated image files
- OpenAI Images API for image generation
- Vercel for deployment

This keeps the MVP deployable and understandable. Image generation will be synchronous in the first version. A job queue or Supabase Edge Function can be introduced later if generation time, retry handling, or traffic requires it.

## Pages And Navigation

### Home Page

The home page introduces the product and routes users to the generator.

Content and behavior:

- Hero area with product name, concise value proposition, and primary CTA: "Start generating"
- Compact preview of the structured generator, so users immediately understand the product is not only a prompt box
- Short sections for supported image types, structured controls, saved history, and 5 free credits
- No complex SEO pages, blog, long marketing funnel, or pricing page in the MVP

### Image Generation Page

The generator is available before login. Anonymous users can fill out the form and preview the compiled prompt. Login is required only when they click Generate.

Inputs:

- Image type
- Aspect ratio
- Style
- Scene
- Whitespace requirement
- Subject
- Additional requirements

Image type options for MVP:

- Poster
- Cover image
- Social media image
- Product image
- Illustration
- Avatar
- Wallpaper
- Icon or logo concept

The page shows:

- Structured input form
- Non-editable compiled prompt preview
- Generation result area
- Current credit balance for logged-in users

Generate behavior:

- If the user is not logged in, prompt Google login.
- If the user has no credits, show an upgrade prompt.
- If the user has enough credits, generate exactly one image.

### History Page

The history page requires login.

It shows:

- Grid of generated images
- Status for each generation
- Created time
- Image type and subject

Detail view shows:

- Full generated image
- Original structured inputs
- Compiled prompt
- Generation time
- Download action
- Copy prompt action

Empty state:

- Explain that generated images will appear here
- Link back to the generator

### Account And Credits

Navigation includes an account/credit entry.

It shows:

- Current credit balance
- Free starter credit explanation
- Upgrade entry

There is no real pricing or payment in the MVP.

## Authentication

Use Supabase Auth with Google OAuth only for the first version.

On first login:

- Create a `profiles` row if one does not exist.
- Set `credits_balance` to `5`.
- Record a `credit_transactions` row for the starter credits.

Email/password, magic links, email verification, and password reset are out of scope for the MVP.

## Credit System

Rules:

- New users receive 5 credits.
- Each successful generation costs 1 credit.
- One Generate action creates exactly one image.
- Credits are checked server-side before calling OpenAI.
- Credits are deducted only after the generated image is successfully saved to Supabase Storage.
- Failed OpenAI generation, failed upload, or failed database update must not consume credits.
- The first version should allow only one processing generation per user at a time to avoid duplicate submissions and credit race conditions.

When credits are insufficient:

- Return an insufficient-credit response from the server.
- Show an upgrade modal.
- Let the user join the upgrade waitlist.

## Upgrade Waitlist

The MVP has no payment integration.

Upgrade prompt behavior:

- Show a modal when users run out of credits or click the upgrade entry.
- Explain that upgrades are coming soon.
- Provide a button to join the waitlist.
- Store waitlist submissions in Supabase.

Waitlist records should include:

- User id
- Email
- Source
- Timestamp

## Data Model

### `profiles`

Purpose: store user-facing account data and the current credit balance.

Fields:

- `id`: UUID, references Supabase Auth user id
- `email`: text
- `display_name`: text
- `avatar_url`: text
- `credits_balance`: integer, default `5`
- `created_at`: timestamp
- `updated_at`: timestamp

### `generation_jobs`

Purpose: store generation history and status.

Fields:

- `id`: UUID
- `user_id`: UUID, references `profiles.id`
- `status`: enum-like text, one of `processing`, `completed`, `failed`
- `image_type`: text
- `aspect_ratio`: text
- `style`: text
- `scene`: text
- `whitespace`: text
- `subject`: text
- `extra_requirements`: text
- `compiled_prompt`: text
- `storage_path`: text
- `error_message`: text
- `created_at`: timestamp
- `completed_at`: timestamp

### `credit_transactions`

Purpose: store an auditable credit ledger.

Fields:

- `id`: UUID
- `user_id`: UUID, references `profiles.id`
- `amount`: integer
- `reason`: text, such as `signup_bonus` or `generation`
- `generation_id`: UUID, nullable reference to `generation_jobs.id`
- `created_at`: timestamp

### `upgrade_waitlist`

Purpose: record users who express upgrade intent before payments are available.

Fields:

- `id`: UUID
- `user_id`: UUID, references `profiles.id`
- `email`: text
- `source`: text
- `created_at`: timestamp

## Server Workflows

### Generate Image

Endpoint: a Next.js Route Handler, for example `POST /api/generate`.

Flow:

1. Verify the user session.
2. Validate request body and length limits.
3. Reject the request if the user already has a `processing` generation.
4. Fetch the user's profile and credit balance.
5. If credits are insufficient, return an insufficient-credit error.
6. Compile the professional prompt from structured inputs.
7. Create a `generation_jobs` row with status `processing`.
8. Call the OpenAI Images API to generate one image.
9. Decode the returned image data.
10. Upload the image to Supabase Storage.
11. Complete the generation and charge 1 credit in one database transaction or RPC.
12. Insert a `credit_transactions` row with amount `-1` in the same database transaction or RPC.
13. Return the completed generation record.

Failure behavior:

- If OpenAI generation fails, mark the job `failed` and do not deduct credits.
- If Storage upload fails, mark the job `failed` and do not deduct credits.
- If database completion or credit deduction fails, return a clear error and avoid reporting success to the user.
- The completion transaction must only succeed if the user still has at least 1 credit.

### Join Upgrade Waitlist

Endpoint: a Next.js Route Handler, for example `POST /api/upgrade-waitlist`.

Flow:

1. Verify the user session.
2. Fetch user email from profile or auth session.
3. Insert an `upgrade_waitlist` row with source.
4. Return success.

Duplicate waitlist handling:

- Multiple submissions from the same user should not create noisy duplicates.
- Prefer a unique constraint on `user_id` plus source-level UI that says the user has already joined.

## Prompt Compilation

Use deterministic template-based prompt compilation in the MVP. Do not call a text model to rewrite prompts.

Inputs map to English prompt fragments:

- Image type controls purpose and output format.
- Aspect ratio controls composition language.
- Style controls visual language.
- Scene controls environment and context.
- Whitespace controls whether to reserve clean space for text or design overlays.
- Subject and additional requirements provide user-specific intent.

Prompt shape:

```text
Create a [image type] about [subject] in [style], set in [scene], with [aspect ratio] composition, [whitespace instruction]. Additional requirements: [extra requirements]. Avoid text artifacts, watermarks, distorted anatomy, low-resolution details, and cluttered composition.
```

Prompt preview:

- Show the compiled prompt before generation.
- The preview is read-only.
- Users adjust structured inputs rather than editing the compiled prompt directly.

## Error Handling

User-facing cases:

- Not logged in: show Google login prompt when Generate is clicked.
- Insufficient credits: show upgrade modal and waitlist entry.
- OpenAI failure: show a friendly message and preserve credits.
- Storage failure: show a friendly message and preserve credits.
- Validation failure: show field-level messages.

Input limits:

- Subject should be required and length-limited.
- Additional requirements should be optional and length-limited.
- All structured options should be chosen from server-approved values.

Security boundaries:

- Never expose the OpenAI API key to the browser.
- Use server-side Supabase clients for privileged operations.
- Use row-level security policies so users can only read their own profile, generation history, credit transactions, and waitlist status.
- Restrict Storage access so users can only access their own generated images, or serve signed URLs from the server.

## Testing Strategy

Unit tests:

- Prompt compilation
- Input validation
- Credit sufficiency rules
- Option mapping

Integration tests:

- Successful generation with mocked OpenAI response
- Insufficient credits returns an upgrade-required response
- OpenAI failure does not deduct credits
- Storage upload failure does not deduct credits
- Waitlist submission creates a record

End-to-end tests:

- Anonymous user fills generator, clicks Generate, and sees login prompt
- Logged-in user generates an image and sees it in history
- Credit balance decreases after successful generation
- User with no credits sees upgrade modal
- User joins waitlist

Manual deployment checks:

- Google OAuth works on the deployed Vercel domain
- Supabase RLS policies behave correctly
- Supabase Storage bucket can save and read generated images
- Required Vercel environment variables are configured
- OpenAI image generation succeeds with the configured model and size

## Implementation Defaults

These defaults keep implementation concrete while leaving room for later iteration:

- Working product name: `Prompt Studio`.
- Visual palette: warm neutral background, dark ink text, restrained accent color, 8px-or-less card radius.
- Aspect-ratio presets: `1:1`, `4:5`, `16:9`, `9:16`, `3:2`.
- Style presets: `Photorealistic`, `Editorial`, `Minimal`, `3D render`, `Watercolor`, `Cinematic`, `Flat illustration`, `Luxury`.
- Scene presets: `Studio`, `Outdoor`, `Urban`, `Nature`, `Interior`, `Abstract`, `Product setup`, `Lifestyle`.
- Whitespace presets: `No special whitespace`, `Top text space`, `Left text space`, `Right text space`, `Center subject with clean background`.
- History image access: private Supabase Storage bucket with signed URLs generated server-side.
- Failed generations: keep failed records in the database but do not show them in the main history grid unless the user opens an account/activity view later.

## Acceptance Criteria

The MVP is complete when:

- A user can open the home page and understand the structured image generation workflow.
- A user can fill the generator before logging in.
- A user must log in with Google before generating.
- A new Google user receives 5 credits.
- A logged-in user with credits can generate one image.
- The generated image is saved to Supabase Storage.
- The generation appears in the user's history.
- A successful generation deducts 1 credit.
- A failed generation does not deduct credits.
- A user with insufficient credits sees an upgrade prompt.
- A user can join the upgrade waitlist.
- The application can be deployed to Vercel with documented environment variables.
