import { ENV } from "./env";
import { triggerReutersEnergyAutomation } from "./reutersEnergy";

function isTruthyQueryFlag(value: unknown) {
  return typeof value === "string" && /^(1|true|yes|on)$/i.test(value);
}

export function registerAutomationRoutes(app: any) {
  app.get("/api/cron/reuters-energy", async (req: any, res: any) => {
    const authorization = req.headers?.authorization;
    const hasValidCronSecret =
      Boolean(ENV.cronSecret) && authorization === `Bearer ${ENV.cronSecret}`;
    const force = hasValidCronSecret && isTruthyQueryFlag(req.query?.force);

    try {
      const result = await triggerReutersEnergyAutomation({ force });
      res.status(200).json({
        ok: true,
        result,
      });
    } catch (error) {
      console.error("[Reuters automation] Cron execution failed:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown cron error",
        ok: false,
      });
    }
  });
}
