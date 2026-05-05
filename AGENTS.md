# AGENTS.md

Default startup memory for Codex agents working in this repository. Keep generic workflow rules in global skills; keep this file focused on stable project facts and routing.

## 1. Project Summary
- **Project:** Netflix Mail
- **Domain:** Cloudflare Workers + Email Routing + D1 temporary access-code mail viewer.
- **Goal:** Receive routed emails, store searchable metadata/content in D1, let admins manage rules/share links, and let visitors view recent matching codes through scoped links.
- **Tech stack:** TypeScript, Hono, Cloudflare Workers, Cloudflare D1, PostalMime, Vitest, Wrangler, vanilla server-rendered admin UI.

## 2. Memory Files
Read in this default order:
1. `AGENTS.md` — stable project facts and doc routing.
2. `agent-state.md` — current handoff, first pending task, blockers.
3. `feature_list.json` — typed task queue and pass/fail source of truth.
4. `codex-progress.md` — short recent execution log.

Use `codex-progress-archive.md` only for older audit history. Read `init.sh` only when a task needs runtime/test startup.

## 3. Project Facts
- The Worker serves email ingestion, admin pages/APIs, setup, database migration UI/API, and visitor share-link pages from one Cloudflare Worker.
- D1 stores admins, email metadata/content chunks, extracted codes, rules, share links, audit logs, and login CAPTCHA settings.
- Admin passwords use PBKDF2-SHA256; sessions are cookie-based and signed with `SESSION_SECRET`.
- Email content has size limits via `MAX_EMAIL_CONTENT_BYTES` and headers via `MAX_EMAIL_HEADERS_BYTES`; attachments store metadata only, not binary content.
- Share links validate token hashes and show only rule-matching mail from the latest 30-minute visitor window.
- Current CAPTCHA work stores one singleton `login_captcha_settings` row, default disabled, with provider, `public_params_json`, and `secret_params_json`; secrets must never appear in public or admin read responses.
- Supported CAPTCHA provider targets: Cloudflare Turnstile, hCaptcha, Google reCAPTCHA, Tencent Cloud CAPTCHA, Alibaba Cloud CAPTCHA 2.0, and GeeTest CAPTCHA.

## 4. Doc Routing
- Runtime/bootstrap: `init.sh`, `package.json`, `wrangler.jsonc`.
- Backend routes: `src/index.ts`, `src/routes/admin.ts`, `src/routes/pages.ts`, `src/routes/visitor.ts`.
- CAPTCHA storage/API: `src/services/captcha-settings.ts`, `src/routes/admin.ts`, `test/database-captcha.test.ts`, `test/admin-routes.test.ts`.
- Database migrations: `migrations/*.sql`, `src/services/database.ts`, admin database tests.
- Admin UI/pages: `src/views/admin.ts`, `src/views/admin-client.ts`, `src/routes/pages.ts`, `test/views.test.ts`.
- Deployment docs: `README.md`, `docs/cloudflare-workers-gui-deploy.md`.
- Agent workflow docs: `project_DS/workflows/auto_dev_loop.md`, `project_DS/workflows/task_init_loop.md`.

## 5. Validation Notes
- Preferred full check: `yarn run check`.
- Backend unit tests should use a 60-second hard timeout when possible.
- For frontend/e2e tasks, use browser verification only after code-level tests pass or when the task explicitly requires rendered behavior.
