# Agent State

## Current Phase
- Disabled CAPTCHA save API completed; next `$Auto_dev` worker should continue with validating and persisting Turnstile, hCaptcha, and reCAPTCHA settings.

## First Pending Task
- Validate and persist Turnstile, hCaptcha, and reCAPTCHA settings.

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
- Authenticated admin CAPTCHA settings update API is available at `PATCH /api/admin/captcha/settings`; currently it accepts `{ "enabled": false }` without provider-specific parameters and preserves provider/public/secret params while disabling CAPTCHA.
- Admin CAPTCHA settings response includes `enabled`, `provider`, `publicParams`, and `secretParams` keys; `secretParams` values are redacted as `[redacted]` and raw stored secrets are not returned.
- Database migration `0005_login_captcha_settings` creates a singleton `login_captcha_settings` row with `enabled = 0` by default.
- CAPTCHA provider storage uses a provider enum plus `public_params_json` and `secret_params_json` for all six planned providers.
- Raw secret provider parameters must remain server-side and be redacted or omitted from public/admin read responses.
