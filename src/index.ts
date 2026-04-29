import { Hono } from "hono";
import { registerAdminRoutes } from "./routes/admin";
import { registerPageRoutes } from "./routes/pages";
import { registerVisitorRoutes } from "./routes/visitor";
import { storeInboundEmail } from "./services/emails";
import { writeAccessLog } from "./services/logs";
import type { AppEnv, Env } from "./types";

const app = new Hono<AppEnv>();

registerPageRoutes(app);
registerAdminRoutes(app);
registerVisitorRoutes(app);

app.notFound((c) => c.json({ ok: false, error: "Not found" }, 404));

export default {
  fetch: app.fetch,

  async email(message, env): Promise<void> {
    const emailId = await storeInboundEmail(message, env);
    await writeAccessLog(env.DB, {
      actorType: "system",
      actorId: emailId,
      action: "email.received"
    });
  }
} satisfies ExportedHandler<Env>;
