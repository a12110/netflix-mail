import type { Hono } from "hono";
import type { AppEnv } from "../types";
import { adminPage } from "../views/admin";
import { setupPage } from "../views/setup";
import { visitorPage } from "../views/visitor";

export function registerPageRoutes(app: Hono<AppEnv>): void {
  app.get("/", (c) => c.redirect("/admin"));
  app.get("/admin", (c) => c.html(adminPage()));
  app.get("/setup", (c) => c.html(setupPage()));
  app.get("/v/:token", (c) => c.html(visitorPage(c.req.param("token"))));
}
