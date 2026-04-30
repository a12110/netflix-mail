import type { Context, Hono } from "hono";
import { MAX_EMAIL_LIMIT, MAX_EMAIL_PAGE } from "../constants";
import { emailDetailToRuleInput, listCandidateEmailDetailsSince } from "../services/emails";
import { writeAccessLog } from "../services/logs";
import { evaluateRuleSet, getRulesByIds } from "../services/rules";
import { getShareLinkByToken, isShareLinkUsable, markShareLinkAccessed } from "../services/share-links";
import type { AppEnv, ShareLinkRow } from "../types";
import { clampNumber, notFound } from "../utils/http";
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
  const pageSize = clampNumber(c.req.query("pageSize") ?? c.req.query("limit"), 20, 1, MAX_EMAIL_LIMIT);
  const requestedPage = clampNumber(c.req.query("page"), 1, 1, MAX_EMAIL_PAGE);
  const rules = await getRulesByIds(c.env.DB, link.ruleIds);
  const candidates = await listCandidateEmailDetailsSince(c.env.DB, since);
  const matchedEmails = candidates
    .filter((email) => evaluateRuleSet(emailDetailToRuleInput(email), rules).visible)
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
  const pagination = visitorPagination(matchedEmails.length, requestedPage, pageSize);
  const emails = matchedEmails.slice(pagination.offset, pagination.offset + pagination.pageSize);

  await Promise.all([markShareLinkAccessed(c.env.DB, link.id), logVisitorAccess(c, link)]);
  return c.json({ ok: true, windowMinutes: link.window_minutes, since, emails, pagination: pagination.response });
}

function visitorPagination(total: number, requestedPage: number, pageSize: number) {
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;
  return {
    pageSize,
    offset: (page - 1) * pageSize,
    response: {
      page,
      pageSize,
      total,
      totalPages,
      hasPreviousPage: totalPages > 0 && page > 1,
      hasNextPage: totalPages > 0 && page < totalPages
    }
  };
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
