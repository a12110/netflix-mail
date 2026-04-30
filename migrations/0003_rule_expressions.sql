ALTER TABLE rules ADD COLUMN action TEXT NOT NULL DEFAULT 'allow' CHECK (action IN ('allow', 'block'));
ALTER TABLE rules ADD COLUMN expression_json TEXT;
ALTER TABLE rules ADD COLUMN schema_version INTEGER NOT NULL DEFAULT 2;
CREATE INDEX IF NOT EXISTS idx_rules_action_enabled ON rules(action, enabled);
