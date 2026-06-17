import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { registerAutomationRoutes } from "./automationRoutes";
import { createContext } from "./context";
import { registerNewsletterRoutes } from "./newsletterRoutes";
import { registerOAuthRoutes } from "./oauth";
import { registerSeoRoutes } from "./seoRoutes";
import { registerStorageProxy } from "./storageProxy";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerSeoRoutes(app);
registerAutomationRoutes(app);
registerNewsletterRoutes(app);
registerOAuthRoutes(app);

app.use(
  ["/api/trpc", "/trpc"],
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export default app;
