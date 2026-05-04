# Current Summary

- Phase: CAPTCHA configuration backend/API development.
- First pending task: Validate and persist Tencent Cloud, Alibaba Cloud 2.0, and GeeTest CAPTCHA settings.
- Recommended startup path: `AGENTS.md -> agent-state.md -> feature_list.json -> codex-progress.md`.
- Active blockers: none.

# Queue Snapshot

- Completed: default-disabled CAPTCHA database persistence; public login CAPTCHA challenge API; authenticated admin CAPTCHA settings read API; disabled CAPTCHA save API; Turnstile/hCaptcha/reCAPTCHA settings validation and persistence.
- Pending next: Tencent/Alibaba/GeeTest provider validation, CAPTCHA verification, admin settings UI, and login UI tasks.

# Recent Entries

- 2026-05-05 Memory refresh: Replaced placeholder `AGENTS.md` with concise project facts and routing so `$Auto_dev` startup health passes. No product code changed.

- 2026-05-05 Worker 1: Completed backend task “Persist a default-disabled login CAPTCHA setting in the database upgrade flow.” Added migration `0005_login_captcha_settings`, registered database version `v0.0.5`, added `getLoginCaptchaSettings`, and verified the admin database upgrade API persists a disabled default CAPTCHA row. Validation: `./init.sh`, targeted `yarn test test/database-captcha.test.ts` with 60s timeout, and `yarn run check` with 60s timeout.

- 2026-05-05 Worker 2: Completed backend task “Expose the login page CAPTCHA challenge state without requiring an admin session.” Added public `GET /api/admin/login/captcha`, filtered CAPTCHA responses to provider plus browser-safe public parameters, and verified stored secret values are absent from the public response. Validation: `./init.sh`, targeted `yarn test test/admin-routes.test.ts` with 60s timeout, and `yarn run check` with 60s timeout. Also fixed a shared test mock `all()` signature so the backend check compiles.

- 2026-05-05 Worker 3: Completed backend task “Let signed-in admins read CAPTCHA settings without exposing stored secrets.” Added authenticated `GET /api/admin/captcha/settings`, returned current enabled/provider/public params, and redacted every saved secret param value as `[redacted]`. Validation: `./init.sh`, targeted `yarn test test/admin-routes.test.ts` with 60s Python subprocess timeout, and `yarn run check` with 60s Python subprocess timeout.

- 2026-05-05 Worker 4: Completed backend task “Let signed-in admins save a disabled CAPTCHA configuration safely.” Added authenticated `PATCH /api/admin/captcha/settings` handling for `{ "enabled": false }`, persisted disabled state by updating only the `enabled` flag, preserved existing provider params and admin sessions, and verified the public login CAPTCHA challenge reports disabled after update. Validation: `./init.sh`, targeted `yarn vitest run test/admin-routes.test.ts test/database-captcha.test.ts`, and `yarn run check`.

- 2026-05-05 Worker 5: Completed backend task “Validate and persist Turnstile, hCaptcha, and reCAPTCHA settings.” Extended authenticated `PATCH /api/admin/captcha/settings` to accept `cloudflare_turnstile`, `hcaptcha`, and `google_recaptcha` when enabled, require `publicParams.siteKey` and `secretParams.secretKey`, persist public/secret parameter JSON, and keep raw secrets redacted on read. Verified valid updates for all three providers, 400 on a missing required key, and no mutation after the rejected request. Validation: `./init.sh`, targeted `yarn vitest run test/admin-routes.test.ts test/database-captcha.test.ts`, and `yarn run check`.
