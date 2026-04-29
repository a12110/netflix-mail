import type { Context, Hono } from "hono";
import { emailDetailToRuleInput, listCandidateEmailDetailsSince } from "../services/emails";
import { writeAccessLog } from "../services/logs";
import { getRulesByIds, matchesAnyRule } from "../services/rules";
import { getShareLinkByToken, isShareLinkUsable, markShareLinkAccessed } from "../services/share-links";
import type { AppEnv, ShareLinkRow } from "../types";
import { notFound } from "../utils/http";
import { minutesAgoIso } from "../utils/time";
import { previewText, stripHtml } from "../utils/text";

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
      id: email.id,
      subject: email.subject,
      envelopeFrom: email.envelope_from,
      envelopeTo: email.envelope_to,
      fromAddress: email.from_address,
      receivedAt: email.received_at,
      codes: email.codes.map((code) => code.code),
      body: previewText(email.content.text || stripHtml(email.content.html), 1200),
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
