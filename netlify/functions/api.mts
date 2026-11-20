import type { Config } from "@netlify/functions";
import { withLambda } from "@netlify/aws-lambda-compat";
import serverless from "serverless-http";
// Express app (tRPC, SEO, OAuth, storage proxy, cron), built by `pnpm build`.
import app from "../../dist/vercel-api.js";

const handler = serverless(app as any);

export default withLambda(handler as any);

export const config: Config = {
  path: [
    "/api/*",
    "/trpc/*",
    "/oauth/callback",
    "/robots.txt",
    "/sitemap.xml",
    "/news-sitemap.xml",
    "/rss.xml",
    "/article/*",
    "/magazine/*",
    "/manus-storage/*",
  ],
};
