# Agent State

## Current Phase
- CAPTCHA database persistence and public login challenge API tasks completed; next `$Auto_dev` worker should continue with authenticated admin CAPTCHA settings read API.

## First Pending Task
- Let signed-in admins read CAPTCHA settings without exposing stored secrets.

## Recommended Next Reads
- `AGENTS.md`
- `feature_list.json`
- `src/services/captcha-settings.ts`
- `src/routes/admin.ts`
- `src/routes/pages.ts`
- `test/database-captcha.test.ts`
- `test/admin-routes.test.ts`
- `test/views.test.ts`

## Active Blockers
- None.

## Notes
- Public admin login CAPTCHA challenge API is available at `GET /api/admin/login/captcha` and does not require an admin session.
- The public challenge response returns `{ enabled: false }` when disabled, or provider plus whitelisted `publicParams` when enabled.
- Database migration `0005_login_captcha_settings` creates a singleton `login_captcha_settings` row with `enabled = 0` by default.
- CAPTCHA provider storage uses a provider enum plus `public_params_json` and `secret_params_json` so later backend tasks can support Cloudflare Turnstile, hCaptcha, Google reCAPTCHA, Tencent Cloud CAPTCHA, Alibaba Cloud CAPTCHA 2.0, and GeeTest CAPTCHA.
- Secret provider parameters must remain server-side and be redacted or omitted from public/admin read responses in later tasks.
