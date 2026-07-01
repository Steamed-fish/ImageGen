# Frontend SaaS Redesign Spec

**Design read:** High-end AI SaaS redesign for creators and small teams, with a polished product-led marketing language, using Tailwind plus owned shadcn/ui components.

**Dials:** DESIGN_VARIANCE 7, MOTION_INTENSITY 5, VISUAL_DENSITY 5.

**Scope:** UI and UX only. Do not change backend routes, Supabase schema, auth behavior, provider behavior, or credit charging logic.

## Visual System

- Theme: light product interface with off-white canvas, ink text, restrained charcoal panels, and one electric-cyan accent.
- Shape: 16px cards and panels, 12px inputs and buttons, full-pill only for badges.
- Typography: use Next font with a modern sans stack, no serif default.
- Motion: CSS transitions and subtle loading skeletons only. No scroll hijack.
- Components: local shadcn-style `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Select`, `Dialog`, and `Skeleton`.

## Pages

### Home

- Create a strong first viewport with a product value proposition, clear CTA, and a real visual sample wall.
- Show the workflow: choose constraints, preview professional English prompt, generate and save.
- Include example creative outputs and value sections with varied layouts.

### Generate

- Convert the page into a professional creation workspace.
- Left panel: structured controls and subject inputs.
- Right panel: prompt preview, output canvas, and state feedback.
- Preserve all existing submit, auth, upgrade, and API behavior.

### History

- Reframe history as a visual work library.
- Use a gallery layout with polished image cards, metadata, prompt excerpts, and open-image actions.
- Empty state should feel like an empty studio library, not a table placeholder.

### Account

- Add a read-only SaaS dashboard page at `/account`.
- Display account email, credits, completed generations, failed generations, and recent works.
- Use existing Supabase reads only. Do not mutate account or billing state.

## States

- Loading: skeletons matching final layout.
- Error: clear contextual panel, no generic red line only.
- Empty: visually composed empty states with next action.
- Success: generated image canvas and refreshed account data remain as implemented.

## Verification

- Update affected component tests for new copy and layout contracts.
- Run `npm run typecheck`.
- Run `npm run build`.
