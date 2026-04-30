export interface DatabaseMigrationStatus {
  id: string;
  description: string;
  applied: boolean;
  appliedAt: string | null;
}

export interface DatabaseUpgradeResult {
  migrations: DatabaseMigrationStatus[];
  appliedMigrations: string[];
  currentDatabaseVersion: string;
  requiredDatabaseVersion: string;
  needsUpgrade: boolean;
}

interface DatabaseMigration {
  id: string;
  version: string;
  description: string;
  sql: string;
}

const MIGRATION_TABLE_SQL = String.raw`
CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
)`;

const INITIAL_SCHEMA_SQL = String.raw`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT,
  envelope_from TEXT NOT NULL,
  envelope_to TEXT NOT NULL,
  from_address TEXT,
  to_addresses_json TEXT NOT NULL DEFAULT '[]',
  subject TEXT,
  sent_at TEXT,
  received_at TEXT NOT NULL,
  raw_size INTEGER NOT NULL DEFAULT 0,
  has_attachments INTEGER NOT NULL DEFAULT 0,
  attachment_count INTEGER NOT NULL DEFAULT 0,
  attachments_json TEXT NOT NULL DEFAULT '[]',
  content_truncated INTEGER NOT NULL DEFAULT 0,
  parse_status TEXT NOT NULL DEFAULT 'parsed',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS email_content_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('headers', 'text', 'html')),
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
  UNIQUE (email_id, kind, chunk_index)
);

CREATE TABLE IF NOT EXISTS email_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('subject', 'text', 'html')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  fields_json TEXT NOT NULL DEFAULT '["subject","text","html","code"]',
  keyword TEXT NOT NULL,
  match_mode TEXT NOT NULL DEFAULT 'contains' CHECK (match_mode IN ('contains', 'exact')),
  case_sensitive INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS share_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  window_minutes INTEGER NOT NULL DEFAULT 30,
  created_by_admin_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_accessed_at TEXT,
  FOREIGN KEY (created_by_admin_id) REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS share_link_rules (
  share_link_id INTEGER NOT NULL,
  rule_id INTEGER NOT NULL,
  PRIMARY KEY (share_link_id, rule_id),
  FOREIGN KEY (share_link_id) REFERENCES share_links(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'visitor', 'system')),
  actor_id TEXT,
  action TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails(from_address);
CREATE INDEX IF NOT EXISTS idx_emails_envelope_to ON emails(envelope_to);
CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_codes(email_id);
CREATE INDEX IF NOT EXISTS idx_email_codes_code ON email_codes(code);
CREATE INDEX IF NOT EXISTS idx_rules_enabled ON rules(enabled);
CREATE INDEX IF NOT EXISTS idx_share_links_status ON share_links(status);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC);
`;

const SHARE_LINK_TOKEN_SQL = String.raw`
ALTER TABLE share_links ADD COLUMN token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
`;

export const DATABASE_MIGRATIONS: DatabaseMigration[] = [
  { id: "0001_initial", version: "v0.0.1", description: "初始化核心表、索引与访问日志", sql: INITIAL_SCHEMA_SQL },
  { id: "0002_share_link_token", version: "v0.0.2", description: "保存分享链接 token 以便后台重新复制", sql: SHARE_LINK_TOKEN_SQL }
];

const UNINITIALIZED_DATABASE_VERSION = "未初始化";

export async function ensureDatabaseSchema(db: D1Database): Promise<DatabaseUpgradeResult> {
  return await applyPendingDatabaseMigrations(db);
}

export async function getDatabaseStatus(db: D1Database): Promise<DatabaseUpgradeResult> {
  await ensureMigrationTable(db);
  return await buildDatabaseResult(db, await listMigrationStatus(db), []);
}

export async function applyPendingDatabaseMigrations(db: D1Database): Promise<DatabaseUpgradeResult> {
  await ensureMigrationTable(db);
  const applied = await appliedMigrationIds(db);
  const appliedMigrations: string[] = [];
  for (const migration of DATABASE_MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    await applyMigration(db, migration);
    await markMigrationApplied(db, migration);
    applied.add(migration.id);
    appliedMigrations.push(migration.id);
  }
  return await buildDatabaseResult(db, await listMigrationStatus(db), appliedMigrations);
}

async function buildDatabaseResult(
  db: D1Database,
  migrations: DatabaseMigrationStatus[],
  appliedMigrations: string[]
): Promise<DatabaseUpgradeResult> {
  const currentDatabaseVersion = await currentVersionFromSchema(db, migrations);
  const requiredDatabaseVersion = DATABASE_MIGRATIONS.at(-1)?.version ?? UNINITIALIZED_DATABASE_VERSION;
  return {
    migrations,
    appliedMigrations,
    currentDatabaseVersion,
    requiredDatabaseVersion,
    needsUpgrade: currentDatabaseVersion !== requiredDatabaseVersion
  };
}

async function currentVersionFromSchema(db: D1Database, migrations: DatabaseMigrationStatus[]): Promise<string> {
  if (await columnExists(db, "share_links", "token")) {
    return migrationVersion("0002_share_link_token");
  }
  if (await tableExists(db, "share_links")) {
    return migrationVersion("0001_initial");
  }
  return currentVersionFromMigrations(migrations);
}

function currentVersionFromMigrations(migrations: DatabaseMigrationStatus[]): string {
  const latestApplied = [...migrations].reverse().find((migration) => migration.applied);
  if (!latestApplied) {
    return UNINITIALIZED_DATABASE_VERSION;
  }
  return migrationVersion(latestApplied.id);
}

function migrationVersion(id: string): string {
  return DATABASE_MIGRATIONS.find((migration) => migration.id === id)?.version ?? id;
}

async function applyMigration(db: D1Database, migration: DatabaseMigration): Promise<void> {
  if (migration.id === "0002_share_link_token") {
    await applyShareLinkTokenMigration(db);
    return;
  }
  await runSqlStatements(db, migration.sql);
}

async function applyShareLinkTokenMigration(db: D1Database): Promise<void> {
  if (!(await columnExists(db, "share_links", "token"))) {
    await db.prepare("ALTER TABLE share_links ADD COLUMN token TEXT").run();
  }
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token)").run();
}

async function ensureMigrationTable(db: D1Database): Promise<void> {
  await db.prepare(MIGRATION_TABLE_SQL).run();
}

async function appliedMigrationIds(db: D1Database): Promise<Set<string>> {
  const result = await db.prepare("SELECT id FROM schema_migrations").all<{ id: string }>();
  return new Set(result.results.map((row) => row.id));
}

async function listMigrationStatus(db: D1Database): Promise<DatabaseMigrationStatus[]> {
  const result = await db.prepare("SELECT id, applied_at FROM schema_migrations").all<{ id: string; applied_at: string }>();
  const applied = new Map(result.results.map((row) => [row.id, row.applied_at]));
  return DATABASE_MIGRATIONS.map((migration) => ({
    id: migration.id,
    description: migration.description,
    applied: applied.has(migration.id),
    appliedAt: applied.get(migration.id) ?? null
  }));
}

async function markMigrationApplied(db: D1Database, migration: DatabaseMigration): Promise<void> {
  await db
    .prepare(
      `INSERT OR REPLACE INTO schema_migrations (id, description, applied_at)
       VALUES (?1, ?2, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
    )
    .bind(migration.id, migration.description)
    .run();
}

async function columnExists(db: D1Database, table: string, column: string): Promise<boolean> {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  return result.results.some((row) => row.name === column);
}

async function tableExists(db: D1Database, table: string): Promise<boolean> {
  const row = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?1").bind(table).first<{ name: string }>();
  return Boolean(row);
}

async function runSqlStatements(db: D1Database, sql: string): Promise<void> {
  for (const statement of splitSqlStatements(sql)) {
    await db.prepare(statement).run();
  }
}

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}
