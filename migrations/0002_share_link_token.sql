ALTER TABLE share_links ADD COLUMN token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
