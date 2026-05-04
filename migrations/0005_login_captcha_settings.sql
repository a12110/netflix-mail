CREATE TABLE IF NOT EXISTS login_captcha_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  provider TEXT NOT NULL DEFAULT 'cloudflare_turnstile' CHECK (
    provider IN (
      'cloudflare_turnstile',
      'hcaptcha',
      'google_recaptcha',
      'tencent_cloud_captcha',
      'alibaba_cloud_captcha_2',
      'geetest_captcha'
    )
  ),
  public_params_json TEXT NOT NULL DEFAULT '{}',
  secret_params_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO login_captcha_settings (
  id,
  enabled,
  provider,
  public_params_json,
  secret_params_json
) VALUES (
  1,
  0,
  'cloudflare_turnstile',
  '{}',
  '{}'
);
