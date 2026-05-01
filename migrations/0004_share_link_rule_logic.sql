ALTER TABLE share_links ADD COLUMN allow_rule_logic TEXT NOT NULL DEFAULT 'or' CHECK (allow_rule_logic IN ('and', 'or'));
ALTER TABLE share_links ADD COLUMN block_rule_logic TEXT NOT NULL DEFAULT 'or' CHECK (block_rule_logic IN ('and', 'or'));
