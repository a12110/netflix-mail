export async function writeAccessLog(
  db: D1Database,
  input: {
    actorType: "admin" | "visitor" | "system";
    actorId?: string | number | null;
    action: string;
    request?: Request;
  }
): Promise<void> {
  const ip = input.request?.headers.get("CF-Connecting-IP") ?? null;
  const userAgent = input.request?.headers.get("User-Agent") ?? null;
  await db
    .prepare(
      "INSERT INTO access_logs (actor_type, actor_id, action, ip, user_agent) VALUES (?1, ?2, ?3, ?4, ?5)"
    )
    .bind(input.actorType, input.actorId == null ? null : String(input.actorId), input.action, ip, userAgent)
    .run();
}
