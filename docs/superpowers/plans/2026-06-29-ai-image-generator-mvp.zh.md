# AI 图片生成器 MVP 实施计划（中文翻译版）

> **给 agentic workers 的说明：** 必须使用子技能 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，按任务逐项执行本计划。步骤使用 checkbox（`- [ ]`）语法便于跟踪。
>
> 本文件是 `docs/superpowers/plans/2026-06-29-ai-image-generator-mvp.md` 的中文阅读版。代码块、SQL、TypeScript、JSON、命令和精确文件内容以英文原文为准；本译文保留路径、命令、任务顺序和验收标准，便于中文执行和评审。

**目标：** 构建并部署一个基于 Next.js 的结构化 AI 图片生成网站 MVP，包含 Google 登录、生成历史、初始积分和升级候补名单。

**架构：** 使用一个 Next.js App Router 应用同时承载页面、API 路由和服务端工作流。Supabase 负责 Google 认证、Postgres、行级安全策略和私有图片存储。服务端调用 OpenAI Image API 的 `gpt-image-2`，解析返回的 base64 图片，上传到 Supabase Storage，然后通过数据库 RPC 完成任务并扣除积分。

**技术栈：** Next.js 15、React 19、TypeScript、Tailwind CSS、Supabase JS/SSR、OpenAI Node SDK、Vitest、Testing Library、Playwright、Vercel。

**语言策略补充：** MVP 界面支持中文和英文，默认语言为中文。用户选择的语言保存在 `prompt_studio_locale` cookie 中，并通过共享字典渲染。最终编译出来的 prompt 按设计保持英文：prompt 模板和预设片段使用英文，用户输入的主题和补充要求原样保留。MVP 不包含额外的翻译 API 调用。

---

## 源设计

实现已批准的设计规格：

- `docs/superpowers/specs/2026-06-29-ai-image-generator-design.md`

OpenAI 参考资料已于 2026-06-29 检查：

- `https://developers.openai.com/api/docs/guides/image-generation`
- 指南推荐使用 Image API 进行单 prompt 图片生成，示例为 `openai.images.generate({ model: "gpt-image-2", prompt })`，返回 `data[0].b64_json`。

## 文件结构

创建英文原计划中的目录结构，核心包括：

- `app/`：页面、API 路由、认证回调、全局布局和样式。
- `components/`：账户菜单、页头、认证弹窗、积分徽章、生成表单、历史网格、prompt 预览、结果面板、升级弹窗。
- `lib/auth/`：认证相关 action 和 profile 初始化。
- `lib/generation/`：图片生成领域逻辑、prompt 拼装、选项、尺寸、校验和 OpenAI 包装器。
- `lib/supabase/`：Supabase server/browser/admin/middleware client。
- `supabase/migrations/`：数据库 schema、RLS、Storage bucket 和 RPC。
- `tests/unit/`：纯函数测试。
- `tests/integration/`：API route 测试，外部依赖使用 mock。
- `tests/e2e/`：浏览器级 smoke tests。

职责划分：

- `lib/generation/*`：纯生成领域逻辑和 OpenAI 集成包装器。
- `lib/supabase/*`：只放 Supabase client，不放产品逻辑。
- `app/api/*`：服务端工作流和 HTTP 响应。
- `components/*`：只放 UI，调用 API route 或 auth action。
- `supabase/migrations/*`：schema、RLS、Storage bucket 和 RPC。
- `tests/unit/*`：纯函数。
- `tests/integration/*`：mock 外部依赖的 API route 行为。
- `tests/e2e/*`：浏览器级产品流程 smoke test。

## 任务 1：搭建 Next.js 应用和工具链

**文件：**

- 创建：`package.json`
- 创建：`tsconfig.json`
- 创建：`next.config.ts`
- 创建：`postcss.config.mjs`
- 创建：`tailwind.config.ts`
- 创建：`app/layout.tsx`
- 创建：`app/globals.css`
- 创建：`app/page.tsx`
- 创建：`vitest.config.ts`
- 创建：`tests/setup.ts`
- 创建：`playwright.config.ts`
- 修改：`.gitignore`

- [ ] **步骤 1：创建 Next.js 项目文件**

按英文原计划中的代码块创建：

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `vitest.config.ts`
- `tests/setup.ts`
- `playwright.config.ts`

- [ ] **步骤 2：安装依赖**

运行：

```bash
npm install
```

预期：生成 `package-lock.json`，依赖安装无错误。

- [ ] **步骤 3：验证脚手架**

运行：

```bash
npm run typecheck
npm run test
npm run build
```

预期：

- TypeScript 以 code 0 退出。
- Vitest 以 code 0 退出，并报告无测试或 setup 成功。
- Next.js build 成功。

- [ ] **步骤 4：提交**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs tailwind.config.ts app tests vitest.config.ts playwright.config.ts .gitignore
git commit -m "chore: scaffold Next.js app"
```

## 任务 2：添加生成领域逻辑和测试

**文件：**

- 创建：`lib/generation/options.ts`
- 创建：`lib/generation/sizes.ts`
- 创建：`lib/generation/prompt.ts`
- 创建：`lib/generation/validation.ts`
- 创建：`lib/types.ts`
- 创建：`lib/utils.ts`
- 创建：`tests/unit/prompt.test.ts`
- 创建：`tests/unit/sizes.test.ts`
- 创建：`tests/unit/validation.test.ts`

- [ ] **步骤 1：先写 prompt 编译的失败测试**

创建 `tests/unit/prompt.test.ts`。测试应覆盖：

- 结构化输入能被拼装成专业英文图片 prompt。
- 图片类型、比例、风格、场景、留白和补充要求都会进入 prompt。
- 补充要求为空时，不生成 `Additional requirements:` 句子。

- [ ] **步骤 2：先写尺寸映射的失败测试**

创建 `tests/unit/sizes.test.ts`。测试映射关系：

- `1:1` -> `1024x1024`
- `4:5` -> `1024x1280`
- `16:9` -> `1536x864`
- `9:16` -> `864x1536`
- `3:2` -> `1536x1024`

- [ ] **步骤 3：先写校验 schema 的失败测试**

创建 `tests/unit/validation.test.ts`。测试：

- 有效结构化输入可通过。
- 不支持的选项会被拒绝。
- `subject` 必须是非空字符串。

- [ ] **步骤 4：运行测试并确认失败**

运行：

```bash
npm run test -- tests/unit/prompt.test.ts tests/unit/sizes.test.ts tests/unit/validation.test.ts
```

预期：失败，因为 `lib/generation/*` 文件尚不存在。

- [ ] **步骤 5：实现生成领域文件**

按英文原计划中的代码块创建：

- `lib/types.ts`
- `lib/generation/options.ts`
- `lib/generation/sizes.ts`
- `lib/generation/prompt.ts`
- `lib/generation/validation.ts`
- `lib/utils.ts`

- [ ] **步骤 6：运行单元测试**

运行：

```bash
npm run test -- tests/unit/prompt.test.ts tests/unit/sizes.test.ts tests/unit/validation.test.ts
```

预期：通过。

- [ ] **步骤 7：提交**

```bash
git add lib tests/unit
git commit -m "feat: add generation domain logic"
```

## 任务 3：添加 Supabase Schema、RLS、Storage 和 RPC

**文件：**

- 创建：`supabase/migrations/202606290001_initial_schema.sql`
- 创建：`.env.example`

- [ ] **步骤 1：创建数据库迁移**

创建 `supabase/migrations/202606290001_initial_schema.sql`。迁移需要包含：

- `pgcrypto` 扩展。
- `profiles` 表：用户 profile、邮箱、头像、`credits_balance`，默认 5。
- `generation_jobs` 表：生成任务、状态、选项、prompt、storage path 和错误信息。
- `credit_transactions` 表：积分流水，原因包含 `signup_bonus` 和 `generation`。
- `upgrade_waitlist` 表：升级候补名单，`(user_id, source)` 唯一。
- 每个用户最多一个 `processing` 任务的 partial unique index。
- `touch_updated_at()` trigger。
- `complete_generation_and_charge()` RPC：成功完成生成并扣 1 分。
- `mark_generation_failed()` RPC：标记生成失败。
- 对 `profiles`、`generation_jobs`、`credit_transactions`、`upgrade_waitlist` 开启 RLS。
- 创建 `generated-images` 私有 Storage bucket。
- Storage select policy：用户只能读取自己目录下的文件。

安全注意：英文计划中的初版 SQL 后续需要确保不要允许客户端修改 `credits_balance`，也不要让普通 authenticated 用户直接执行服务端 RPC。

- [ ] **步骤 2：创建环境变量示例**

创建 `.env.example`：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **步骤 3：本地应用迁移**

在已链接 Supabase 项目或启动本地 Supabase 后运行：

```bash
supabase db push
```

预期：迁移成功，`generated-images` 私有 bucket 存在。

- [ ] **步骤 4：提交**

```bash
git add supabase .env.example
git commit -m "feat: add Supabase schema"
```

## 任务 4：添加 Supabase Client、认证回调和 Profile 初始化

**文件：**

- 创建：`lib/supabase/server.ts`
- 创建：`lib/supabase/browser.ts`
- 创建：`lib/supabase/admin.ts`
- 创建：`lib/supabase/middleware.ts`
- 创建：`middleware.ts`
- 创建：`lib/auth/ensure-profile.ts`
- 创建：`lib/auth/actions.ts`
- 创建：`app/auth/callback/route.ts`
- 创建：`components/app-header.tsx`
- 创建：`components/account-menu.tsx`
- 创建：`components/credit-badge.tsx`

- [ ] **步骤 1：实现 Supabase clients**

按英文原计划创建：

- `lib/supabase/server.ts`：server component / route 使用的 SSR client。
- `lib/supabase/browser.ts`：浏览器 client。
- `lib/supabase/admin.ts`：使用 `SUPABASE_SERVICE_ROLE_KEY` 的服务端 admin client。
- `lib/supabase/middleware.ts`：同步 Supabase session cookie。
- `middleware.ts`：接入 `updateSession()`。

- [ ] **步骤 2：实现 profile 初始化**

创建 `lib/auth/ensure-profile.ts`：

- 如果 profile 不存在，插入 profile。
- 新用户 `credits_balance = 5`。
- 插入 `credit_transactions` 的 `signup_bonus` 记录。
- 要能处理重试和唯一约束冲突。

创建 `app/auth/callback/route.ts`：

- 读取 OAuth `code`。
- 调用 `exchangeCodeForSession()`。
- 通过 `getUser()` 获取用户。
- 调用 `ensureProfile()`。
- 安全跳转到 `next`，默认 `/generate`。

创建 `lib/auth/actions.ts`：

- `signInWithGoogle(next = "/generate")`。
- `signOut()`。

- [ ] **步骤 3：添加 header 和账户 UI**

创建：

- `components/credit-badge.tsx`
- `components/account-menu.tsx`
- `components/app-header.tsx`

UI 要展示：

- `Prompt Studio` 品牌链接。
- `Generate` / `History` 导航。
- 登录用户积分。
- 未登录时 Google 登录入口。
- 已登录时邮箱和退出按钮。

- [ ] **步骤 4：接入 header 到 layout**

修改 `app/layout.tsx`，在 body 中渲染 `<AppHeader />` 和 `{children}`。

- [ ] **步骤 5：验证认证 plumbing 能编译**

运行：

```bash
npm run typecheck
npm run build
```

预期：两条命令都通过。

- [ ] **步骤 6：提交**

```bash
git add lib/supabase lib/auth middleware.ts app/auth components app/layout.tsx
git commit -m "feat: add Supabase auth plumbing"
```

## 任务 5：构建生成 UI 和 Prompt 预览

**文件：**

- 创建：`components/prompt-preview.tsx`
- 创建：`components/result-panel.tsx`
- 创建：`components/upgrade-modal.tsx`
- 创建：`components/auth-dialog.tsx`
- 创建：`components/generator-form.tsx`
- 创建：`app/generate/page.tsx`

- [ ] **步骤 1：添加预览和结果组件**

创建：

- `components/prompt-preview.tsx`：展示只读 prompt。
- `components/result-panel.tsx`：展示 loading、错误和生成结果图片。

- [ ] **步骤 2：添加弹窗组件**

创建：

- `components/auth-dialog.tsx`：未登录点击生成时展示登录提示。
- `components/upgrade-modal.tsx`：积分不足时展示升级 coming soon 和 waitlist 按钮。

- [ ] **步骤 3：添加生成表单**

创建 `components/generator-form.tsx`。功能：

- 使用 `DEFAULT_GENERATION_INPUT` 初始化表单状态。
- 结构化选择：图片类型、比例、风格、场景、留白。
- 输入：`subject` 和 `extraRequirements`。
- 实时调用 `compilePrompt()` 显示 prompt 预览。
- 未登录点击 Generate 时打开登录弹窗。
- 已登录点击 Generate 时 POST `/api/generate`。
- `INSUFFICIENT_CREDITS` 时打开升级弹窗。
- 成功时展示返回的 `imageUrl`。
- 升级候补名单按钮 POST `/api/upgrade-waitlist`。

- [ ] **步骤 4：添加生成页面**

创建 `app/generate/page.tsx`：

- 服务端读取当前用户。
- 渲染 `<GeneratorForm isLoggedIn={Boolean(user)} />`。

- [ ] **步骤 5：验证 UI 能编译**

运行：

```bash
npm run typecheck
npm run build
```

预期：两条命令都通过。

- [ ] **步骤 6：提交**

```bash
git add app/generate components
git commit -m "feat: add generator UI"
```

## 任务 6：添加 OpenAI 包装器和生成 API

**文件：**

- 创建：`lib/generation/openai.ts`
- 创建：`app/api/generate/route.ts`
- 创建：`tests/integration/generate-route.test.ts`

- [ ] **步骤 1：先写失败的 route 测试**

创建 `tests/integration/generate-route.test.ts`，mock Supabase 和 OpenAI。至少覆盖：

- 未登录返回 401，code 为 `UNAUTHENTICATED`。
- 积分不足返回 402，code 为 `INSUFFICIENT_CREDITS`。
- 成功生成会上传图片、调用 `complete_generation_and_charge` 并返回 signed URL 和 compiled prompt。
- 生成失败会调用 `mark_generation_failed`，不会扣积分。
- 旧的 `processing` job 应在新生成前被回收，避免用户被永久卡住。

- [ ] **步骤 2：运行 route 测试并确认失败**

运行：

```bash
npm run test -- tests/integration/generate-route.test.ts
```

预期：失败，因为 route 和 OpenAI wrapper 尚不存在。

- [ ] **步骤 3：添加 OpenAI 包装器**

创建 `lib/generation/openai.ts`：

- 使用 OpenAI Node SDK。
- 调用 `openai.images.generate()`。
- 使用 `model: "gpt-image-2"`。
- 使用 `quality: "medium"`。
- `size` 来自 `getImageSizeForAspectRatio(aspectRatio)`。
- GPT image 模型默认返回 base64，不要为 GPT image 传不支持的 `response_format`。
- 从 `result.data?.[0]?.b64_json` 读取图片。
- 缺少图片数据时抛错。
- 返回 `Buffer.from(imageBase64, "base64")`。

- [ ] **步骤 4：添加生成 route**

创建 `app/api/generate/route.ts`。流程：

1. 通过 `createSupabaseServerClient().auth.getUser()` 获取用户。
2. 未登录返回 401 `UNAUTHENTICATED`。
3. 解析 JSON，使用 `generationRequestSchema` 校验；无效返回 400 `VALIDATION_ERROR`。
4. 使用 `createSupabaseAdminClient()` 做 profiles、jobs、storage、RPC 操作。
5. 回收当前用户超过阈值的旧 `processing` 任务，防止平台超时留下永久锁。
6. 如果仍有活跃 `processing` 任务，返回 409 `GENERATION_IN_PROGRESS`。
7. 查询 profile 积分；profile 缺失返回 404，积分不足返回 402。
8. 调用 `compilePrompt(parsed.data)`。
9. 插入 `generation_jobs` 的 `processing` 记录。
10. 调用 `generateImageBytes()`。
11. 上传到 `generated-images` bucket，路径 `${user.id}/${job.id}.png`。
12. 调用 `complete_generation_and_charge`，在数据库内完成任务并扣 1 分。
13. 创建一小时 signed URL。
14. 返回 `{ id, imageUrl, compiledPrompt }`。
15. 如果生成、上传或 completion 失败，调用 `mark_generation_failed`，返回 500 `GENERATION_FAILED`，并说明积分不会被扣。

- [ ] **步骤 5：运行集成和单元测试**

运行：

```bash
npm run test -- tests/unit tests/integration/generate-route.test.ts
```

预期：通过。如果 Supabase 链式 test double 抛出方法缺失，按 route 实际调用补 mock 方法并重跑。不要改变期望的 HTTP 状态码或 response code。

- [ ] **步骤 6：提交**

```bash
git add app/api/generate lib/generation/openai.ts tests/integration/generate-route.test.ts
git commit -m "feat: add image generation API"
```

## 任务 7：添加升级候补名单 API

**文件：**

- 创建：`app/api/upgrade-waitlist/route.ts`
- 创建：`tests/integration/upgrade-waitlist-route.test.ts`

- [ ] **步骤 1：先写失败测试**

创建 `tests/integration/upgrade-waitlist-route.test.ts`。覆盖：

- 未登录请求返回 401。
- 有效请求 upsert 当前用户的 waitlist 记录。
- 无效 source 返回 400，不写数据库。
- 写入失败返回 500。
- 重复候补记录应视为成功。

- [ ] **步骤 2：添加 route 实现**

创建 `app/api/upgrade-waitlist/route.ts`：

- 通过 Supabase server client 获取用户。
- 未登录返回 401 `UNAUTHENTICATED`。
- 校验 body 中 `source`：trim 后长度 1 到 80。
- 使用 admin client upsert `upgrade_waitlist`：
  - `user_id` 为认证用户 id。
  - `email` 为认证用户 email 或空字符串。
  - `source` 为校验后的 source。
  - `onConflict: "user_id,source"`。
  - `ignoreDuplicates: true`。
- 写入失败返回 500 `WAITLIST_FAILED`。
- 成功返回 `{ ok: true }`。

- [ ] **步骤 3：运行测试**

运行：

```bash
npm run test -- tests/integration/upgrade-waitlist-route.test.ts
```

预期：通过。

- [ ] **步骤 4：提交**

```bash
git add app/api/upgrade-waitlist tests/integration/upgrade-waitlist-route.test.ts
git commit -m "feat: add upgrade waitlist API"
```

## 任务 8：添加历史 API 和历史页面

**文件：**

- 创建：`app/api/history/route.ts`
- 创建：`components/history-grid.tsx`
- 创建：`app/history/page.tsx`

- [ ] **步骤 1：添加历史 API**

创建 `app/api/history/route.ts`：

- 使用 server client 获取当前用户。
- 未登录返回 401 `UNAUTHENTICATED`。
- 使用 admin client 查询 `generation_jobs`。
- 只查询当前用户、`status = "completed"` 的记录。
- 按 `created_at` 降序。
- 选择 `id, image_type, subject, compiled_prompt, storage_path, created_at, completed_at`。
- 为每个 `storage_path` 创建一小时 signed URL。
- signed URL 失败或 `storage_path` 为空时，当前 item 的 `imageUrl` 为 `null`。
- 查询失败返回 500 `HISTORY_FAILED`。
- 成功返回 `{ items }`。

- [ ] **步骤 2：添加历史 UI**

创建 `components/history-grid.tsx`：

- items 为空时展示空状态。
- items 非空时展示卡片网格。
- 每张卡展示图片预览、图片类型、主题、compiled prompt。
- 有 `imageUrl` 时展示打开或下载链接。

创建 `app/history/page.tsx`：

- 服务端获取用户。
- 未登录 `redirect("/generate")`。
- 登录后查询 completed jobs 并生成 signed URL。
- 渲染标题 `Generation history` 和 `<HistoryGrid />`。

- [ ] **步骤 3：验证**

运行：

```bash
npm run typecheck
npm run build
```

预期：两条命令都通过。

- [ ] **步骤 4：提交**

```bash
git add app/api/history app/history components/history-grid.tsx
git commit -m "feat: add generation history"
```

## 任务 9：完成首页和视觉打磨

**文件：**

- 修改：`app/page.tsx`
- 修改：`app/globals.css`

- [ ] **步骤 1：替换占位首页**

修改 `app/page.tsx`，首页应包含：

- `Prompt Studio` 品牌信号。
- H1：结构化图片生成，面向更 polished 的创意工作。
- 支持文案：选择图片类型、比例、风格、场景和留白；系统拼装专业 GPT Image prompt 并保存历史。
- 主按钮链接 `/generate`，文案类似 `Start generating`。
- 次按钮链接 `/history`。
- 生成器预览面板：
  - Type: Poster
  - Ratio: 4:5
  - Style: Editorial
  - Scene: Studio
  - Whitespace: Top text space
  - 示例 compiled prompt。
- 三个功能点：
  - Structured choices
  - Prompt assembly
  - Saved history

- [ ] **步骤 2：验证响应式 polish**

运行：

```bash
npm run build
npm run dev
```

打开：

- `http://localhost:3000/`
- `http://localhost:3000/generate`
- `http://localhost:3000/history`

预期：

- Header links 可见。
- 首页首屏清楚展示产品和生成器预览。
- 生成页在桌面宽度无文字重叠。
- 历史页根据登录状态重定向或展示空状态。
- 移动端无水平溢出，短屏首屏能看到生成器预览的至少一部分。

- [ ] **步骤 3：提交**

```bash
git add app/page.tsx app/globals.css
git commit -m "feat: polish home page"
```

## 任务 10：添加 E2E Smoke Tests

**文件：**

- 创建：`tests/e2e/generator.spec.ts`

- [ ] **步骤 1：编写 Playwright smoke tests**

创建 `tests/e2e/generator.spec.ts`。覆盖：

1. 匿名用户可填写生成器并看到登录提示：
   - 打开 `/generate`。
   - 填写 Subject：`a launch poster for a ceramic tea brand`。
   - 验证 prompt 预览包含 `Create a poster about a launch poster`。
   - 点击 `Generate 1 image`。
   - 验证出现 `Please sign in with Google to generate an image.`。

2. 首页链接可进入生成页：
   - 打开 `/`。
   - 点击 `Start generating`。
   - URL 应为 `/generate`。
   - 页面展示标题 `Create an image`。

3. 可选移动端 smoke：
   - 设置移动视口。
   - 首页无水平溢出。
   - 生成器预览进入首屏。

- [ ] **步骤 2：运行 E2E 测试**

运行：

```bash
npm run test:e2e
```

预期：匿名流程通过。

- [ ] **步骤 3：提交**

```bash
git add tests/e2e/generator.spec.ts
git commit -m "test: add generator smoke tests"
```

## 任务 11：添加 README 和部署说明

**文件：**

- 创建：`README.md`
- 修改：`.env.example`

- [ ] **步骤 1：编写 README**

创建 `README.md`，内容包括：

- 项目简介：Prompt Studio 是结构化 AI 图片生成 MVP。
- 用户选择：图片类型、比例、风格、场景、留白、主题、补充要求。
- 系统拼装专业 GPT Image prompt，并调用 OpenAI Images API 生成一张图片。
- Stack：
  - Next.js App Router
  - Supabase Auth / Postgres / Storage
  - OpenAI Images API with `gpt-image-2`
  - Vercel
- 环境变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- 本地开发：

```bash
npm install
npm run dev
```

- 测试：

```bash
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

- Supabase 设置：
  - 应用 `supabase/migrations/202606290001_initial_schema.sql`。
  - 如果使用 Supabase CLI，需要先安装并 link 项目或提供 DB URL。
  - 启用 Google OAuth。
  - 设置 callback URL：

```text
http://localhost:3000/auth/callback
https://your-vercel-domain/auth/callback
```

- 迁移会创建：
  - `profiles`
  - `generation_jobs`
  - `credit_transactions`
  - `upgrade_waitlist`
  - 私有 `generated-images` Storage bucket
  - RLS policies
  - generation completion/failure RPCs

- 部署：
  - 部署到 Vercel。
  - 设置同样的环境变量。
  - `NEXT_PUBLIC_SITE_URL` 设置为部署后的 origin。

- MVP 边界：
  - 不做真实支付。
  - 升级弹窗只提交候补名单。
  - 不做邮件、后台、复杂 SEO、图片编辑、参考图上传、多模型切换。

- [ ] **步骤 2：验证文档与实现一致**

运行：

```bash
rg -n "NEXT_PUBLIC_SUPABASE_URL|OPENAI_API_KEY|gpt-image-2|generated-images" README.md .env.example lib app supabase
```

预期：所有必要环境变量和集成名称都已记录。

- [ ] **步骤 3：提交**

```bash
git add README.md .env.example
git commit -m "docs: add setup and deployment notes"
```

## 任务 12：最终验证

**文件：**

- 不预期新增文件。

- [ ] **步骤 1：运行完整自动化验证**

运行：

```bash
npm run typecheck
npm run test
npm run build
```

预期：全部通过。

- [ ] **步骤 2：运行 E2E 验证**

运行：

```bash
npm run test:e2e
```

预期：匿名 smoke tests 通过。

- [ ] **步骤 3：手动本地 smoke test**

运行：

```bash
npm run dev
```

打开：

- `http://localhost:3000/`
- `http://localhost:3000/generate`

预期：

- 首页加载，首屏清楚展示 Prompt Studio 和生成器预览。
- 生成页允许匿名用户填写表单。
- 修改主题和选项时，prompt 预览会更新。
- 匿名点击 Generate 时展示需要登录的提示。

- [ ] **步骤 4：手动认证 smoke test**

在 Supabase Google OAuth 和环境变量配置完成后：

1. 使用 Google 登录。
2. 确认 `profiles` 表有一条 `credits_balance = 5` 的记录。
3. 生成一张图片。
4. 确认 `generation_jobs` 有一条 `status = completed` 的记录。
5. 确认 `generated-images` bucket 中存在用户目录下的 PNG 文件，路径模式为 `generated-images/{auth-user-id}/{generation-job-id}.png`。
6. 确认 `profiles.credits_balance = 4`。
7. 确认 `credit_transactions` 中存在 `-1` 的 generation 记录。
8. 打开 `/history`，确认生成图片出现。

- [ ] **步骤 5：在来源任务处修复验证失败**

如果本任务中任何命令失败，回到引入失败文件的任务，修复实现，重新运行该任务的验证命令，再重复最终验证。

## 计划自审清单

- 规格覆盖：
  - 首页：任务 9。
  - 带结构化控件和只读 prompt 预览的生成页：任务 2 和任务 5。
  - Google 登录：任务 4。
  - 新用户 5 积分：任务 3 和任务 4。
  - 生成历史：任务 8。
  - 成功存储后检查和扣除积分：任务 3 和任务 6。
  - 积分不足时升级提示和候补名单：任务 5 和任务 7。
  - 不做真实支付、邮件、后台、SEO、编辑、上传、多模型切换：由架构和文件范围保证。
  - 部署说明：任务 11。
- 占位符扫描：
  - 不保留未完成标记或延期工作话术。
  - 不保留 shell placeholder 或尖括号文件路径。
- 类型一致性：
  - `GenerationInput` 字段与 validation schema 和表单状态一致。
  - option id 与 Supabase 字段和 prompt compiler 一致。
  - API response code 与 generator form 处理逻辑一致。
- 已知执行注意事项：
  - 集成测试使用 mock 的 Supabase 链式 client；如果执行中调整 mock 形状，行为断言不能变。
  - E2E 测试不应被 Vitest 收集。
  - 真实 Supabase RLS/RPC/Storage 和完整登录生成历史流程需要在配置真实环境变量后手动验证。
