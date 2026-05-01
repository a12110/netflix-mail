import type { RULE_FIELDS } from "./constants";

export interface Env {
  DB: D1Database;
  APP_NAME?: string;
  ADMIN_SETUP_TOKEN?: string;
  MAX_EMAIL_CONTENT_BYTES?: string;
  MAX_EMAIL_HEADERS_BYTES?: string;
  SESSION_SECRET?: string;
}

export type AppEnv = {
  Bindings: Env;
};

export type RuleField = (typeof RULE_FIELDS)[number];

export interface AdminRow {
  id: number;
  username: string;
  password_hash: string;
  status: "active" | "disabled";
  created_at: string;
  last_login_at: string | null;
}

export interface EmailRow {
  id: number;
  message_id: string | null;
  envelope_from: string;
  envelope_to: string;
  from_address: string | null;
  to_addresses_json: string;
  subject: string | null;
  sent_at: string | null;
  received_at: string;
  raw_size: number;
  has_attachments: number;
  attachment_count: number;
  attachments_json: string;
  content_truncated: number;
  parse_status: string;
  created_at: string;
}

export interface EmailSummary extends EmailRow {
  codes: string | null;
}

export interface EmailCodeRow {
  id: number;
  email_id: number;
  code: string;
  source: "subject" | "text" | "html";
  created_at: string;
}

export interface RuleRow {
  id: number;
  name: string;
  fields_json: string;
  keyword: string;
  match_mode: "contains" | "exact";
  case_sensitive: number;
  enabled: number;
  action?: "allow" | "block";
  expression_json?: string | null;
  schema_version?: number;
  created_at: string;
  updated_at: string;
}

export type ShareLinkRuleLogic = "and" | "or";

export interface ShareLinkRow {
  id: number;
  name: string | null;
  token: string | null;
  token_hash: string;
  expires_at: string | null;
  status: "active" | "disabled";
  window_minutes: number;
  allow_rule_logic?: ShareLinkRuleLogic;
  block_rule_logic?: ShareLinkRuleLogic;
  created_by_admin_id: number;
  created_at: string;
  last_accessed_at: string | null;
}

export interface SessionPayload {
  sub: number;
  username: string;
  exp: number;
}
