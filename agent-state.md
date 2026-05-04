# Agent State

## Current Phase
- Tencent Cloud, Alibaba Cloud 2.0, and GeeTest CAPTCHA settings validation/persistence completed; next `$Auto_dev` worker should continue with Turnstile, hCaptcha, and reCAPTCHA token verification before admin password authentication.

## First Pending Task
- Verify Turnstile, hCaptcha, and reCAPTCHA tokens before admin password authentication.

## Recommended Next Reads
- `AGENTS.md`
- `feature_list.json`
- `src/services/captcha-settings.ts`
- `src/routes/admin.ts`
- `test/admin-routes.test.ts`
- `test/database-captcha.test.ts` if storage behavior needs confirmation

## Active Blockers
- None.

## Notes
- Public admin login CAPTCHA challenge API is available at `GET /api/admin/login/captcha` and does not require an admin session.
- Authenticated admin CAPTCHA settings read API is available at `GET /api/admin/captcha/settings` and requires a valid `nm_session` admin cookie.
- Authenticated admin CAPTCHA settings update API is available at `PATCH /api/admin/captcha/settings`.
- The update API supports disabling with `{ "enabled": false }` while preserving stored provider params.
- The update API now supports enabled settings for `cloudflare_turnstile`, `hcaptcha`, and `google_recaptcha` using `publicParams.siteKey` plus `secretParams.secretKey`.
- The update API now supports enabled settings for `tencent_cloud_captcha`, `alibaba_cloud_captcha_2`, and `geetest_captcha` using provider-specific public params plus redacted server credentials on read.
- Admin CAPTCHA settings responses include `enabled`, `provider`, `publicParams`, and redacted `secretParams`; raw stored secrets must not appear in public or admin read responses.
- Database migration `0005_login_captcha_settings` creates a singleton `login_captcha_settings` row with `enabled = 0` by default.
- CAPTCHA provider storage uses a provider enum plus `public_params_json` and `secret_params_json` for all six planned providers.
