# Agent State

## Current Phase
- Authenticated admin CAPTCHA settings read API completed; next `$Auto_dev` worker should continue with safely saving a disabled CAPTCHA configuration.

## First Pending Task
- Let signed-in admins save a disabled CAPTCHA configuration safely.

## Recommended Next Reads
- `AGENTS.md`
- `feature_list.json`
- `src/services/captcha-settings.ts`
- `src/routes/admin.ts`
- `test/admin-routes.test.ts`
- `test/database-captcha.test.ts`

## Active Blockers
- None.

## Notes
- Public admin login CAPTCHA challenge API is available at `GET /api/admin/login/captcha` and does not require an admin session.
- Authenticated admin CAPTCHA settings read API is available at `GET /api/admin/captcha/settings` and requires a valid `nm_session` admin cookie.
- Admin CAPTCHA settings response includes `enabled`, `provider`, `publicParams`, and `secretParams` keys; `secretParams` values are redacted as `[redacted]` and raw stored secrets are not returned.
- Database migration `0005_login_captcha_settings` creates a singleton `login_captcha_settings` row with `enabled = 0` by default.
- CAPTCHA provider storage uses a provider enum plus `public_params_json` and `secret_params_json` for all six planned providers.
- Raw secret provider parameters must remain server-side and be redacted or omitted from public/admin read responses.
