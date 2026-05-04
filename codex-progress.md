# Current Summary

- Phase: CAPTCHA configuration backend/API development.
- First pending task: Let signed-in admins save a disabled CAPTCHA configuration safely.
- Recommended startup path: `AGENTS.md -> agent-state.md -> feature_list.json -> codex-progress.md`.
- Active blockers: none.

# Queue Snapshot

- Completed: default-disabled CAPTCHA database persistence; public login CAPTCHA challenge API; authenticated admin CAPTCHA settings read API.
- Pending next: admin disabled CAPTCHA save API, then provider validation, verification, and login UI tasks.

# Recent Entries

- 2026-05-05 Memory refresh: Replaced placeholder `AGENTS.md` with concise project facts and routing so `$Auto_dev` startup health passes. No product code changed.

- 2026-05-05 Worker 1: Completed backend task “Persist a default-disabled login CAPTCHA setting in the database upgrade flow.” Added migration `0005_login_captcha_settings`, registered database version `v0.0.5`, added `getLoginCaptchaSettings`, and verified the admin database upgrade API persists a disabled default CAPTCHA row. Validation: `./init.sh`, targeted `yarn test test/database-captcha.test.ts` with 60s timeout, and `yarn run check` with 60s timeout.

- 2026-05-05 Worker 2: Completed backend task “Expose the login page CAPTCHA challenge state without requiring an admin session.” Added public `GET /api/admin/login/captcha`, filtered CAPTCHA responses to provider plus browser-safe public parameters, and verified stored secret values are absent from the public response. Validation: `./init.sh`, targeted `yarn test test/admin-routes.test.ts` with 60s timeout, and `yarn run check` with 60s timeout. Also fixed a shared test mock `all()` signature so the backend check compiles.

- 2026-05-05 Worker 3: Completed backend task “Let signed-in admins read CAPTCHA settings without exposing stored secrets.” Added authenticated `GET /api/admin/captcha/settings`, returned current enabled/provider/public params, and redacted every saved secret param value as `[redacted]`. Validation: `./init.sh`, targeted `yarn test test/admin-routes.test.ts` with 60s Python subprocess timeout, and `yarn run check` with 60s Python subprocess timeout.
