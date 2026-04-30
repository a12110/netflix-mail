import type { Context, Hono } from "hono";
import { emailDetailToRuleInput, listCandidateEmailDetailsSince } from "../services/emails";
import { writeAccessLog } from "../services/logs";
import { getRulesByIds, matchesAnyRule } from "../services/rules";
import { getShareLinkByToken, isShareLinkUsable, markShareLinkAccessed } from "../services/share-links";
import type { AppEnv, ShareLinkRow } from "../types";
import { notFound } from "../utils/http";
import { minutesAgoIso } from "../utils/time";
import { cleanEmailBody, previewText, stripHtml } from "../utils/text";

export function registerVisitorRoutes(app: Hono<AppEnv>): void {
  app.get("/api/visitor/:token/emails", visitorEmails);
}

async function visitorEmails(c: Context<AppEnv>): Promise<Response> {
  const token = c.req.param("token");
  if (!token) {
    return notFound(c, "Link is not available.");
  }
  const link = await getShareLinkByToken(c.env.DB, token);
  if (!link || !isShareLinkUsable(link)) {
    return notFound(c, "Link is not available.");
  }

  const since = minutesAgoIso(link.window_minutes);
  const rules = await getRulesByIds(c.env.DB, link.ruleIds);
  const candidates = await listCandidateEmailDetailsSince(c.env.DB, since);
  const emails = candidates
    .filter((email) => matchesAnyRule(emailDetailToRuleInput(email), rules))
    .map((email) => ({
      subject: email.subject,
      receivedAt: email.received_at,
      codes: email.codes.map((code) => code.code),
      body: previewText(cleanEmailBody(email.content.text || stripHtml(email.content.html)), 1200),
      bodyText: cleanEmailBody(email.content.text || stripHtml(email.content.html)),
      bodyHtml: email.content.html || "",
      trustedAuthentication: hasTrustedAuthentication(email.content.headers),
      contentTruncated: Boolean(email.content_truncated)
    }));

  await Promise.all([markShareLinkAccessed(c.env.DB, link.id), logVisitorAccess(c, link)]);
  return c.json({ ok: true, windowMinutes: link.window_minutes, since, emails });
}

async function logVisitorAccess(c: Context<AppEnv>, link: ShareLinkRow): Promise<void> {
  await writeAccessLog(c.env.DB, {
    actorType: "visitor",
    actorId: link.id,
    action: "share_link.view",
    request: c.req.raw
  });
}

function hasTrustedAuthentication(headersText: string): boolean {
  const text = authenticationHeaderText(headersText).toLowerCase();
  return /\bdkim\s*=\s*pass\b/.test(text) || /\bdmarc\s*=\s*pass\b/.test(text) || /\barc\s*=\s*pass\b/.test(text);
}

function authenticationHeaderText(headersText: string): string {
  try {
    const headers = JSON.parse(headersText || "[]") as Array<{ key?: string; originalKey?: string; value?: string }>;
    if (!Array.isArray(headers)) return "";
    return headers
      .filter((header) => /^(authentication-results|arc-authentication-results)$/i.test(header.key || header.originalKey || ""))
      .map((header) => String(header.value || ""))
      .join("\n");
  } catch {
    return headersText || "";
  }
}
