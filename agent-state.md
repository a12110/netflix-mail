# Agent State

## Current Phase
- Tencent Cloud, Alibaba Cloud CAPTCHA 2.0, and GeeTest login CAPTCHA payload verification completed; next `$Auto_dev` worker should continue with the admin CAPTCHA settings UI task.

## First Pending Task
- Show an admin CAPTCHA settings page for choosing a provider and editing parameters.

## Recommended Next Reads
- `AGENTS.md`
- `feature_list.json`
- `src/views/admin.ts`
- `src/views/admin-client.ts`
- `src/routes/pages.ts`
- `src/routes/admin.ts`
- `test/views.test.ts`

## Active Blockers
- None.

## Notes
- Public admin login CAPTCHA challenge API is available at `GET /api/admin/login/captcha` and does not require an admin session.
- Authenticated admin CAPTCHA settings read API is available at `GET /api/admin/captcha/settings` and requires a valid `nm_session` admin cookie.
- Authenticated admin CAPTCHA settings update API is available at `PATCH /api/admin/captcha/settings`.
- The update API supports disabling with `{ "enabled": false }` while preserving stored provider params.
- The update API supports enabled settings for all six providers, with provider-specific public params and secret credentials redacted on read.
- Admin login accepts `captchaToken` for Turnstile, hCaptcha, and reCAPTCHA when CAPTCHA is enabled.
- Admin login accepts provider-specific `captchaPayload` for Tencent Cloud CAPTCHA, Alibaba Cloud CAPTCHA 2.0, and GeeTest CAPTCHA when CAPTCHA is enabled.
- Login CAPTCHA verification runs before password authentication; missing or failed CAPTCHA does not create a session cookie.
- Admin CAPTCHA settings responses include `enabled`, `provider`, `publicParams`, and redacted `secretParams`; raw stored secrets must not appear in public or admin read responses.
- Database migration `0005_login_captcha_settings` creates a singleton `login_captcha_settings` row with `enabled = 0` by default.
- CAPTCHA provider storage uses a provider enum plus `public_params_json` and `secret_params_json` for all six planned providers.
