import { ENV } from "./env";
import { runReutersEnergyAutomation } from "./reutersEnergy";

export function registerAutomationRoutes(app: any) {
  app.get("/api/cron/reuters-energy", async (req: any, res: any) => {
    if (!ENV.cronSecret) {
      res.status(503).json({
        error: "CRON_SECRET is not configured",
        ok: false,
      });
      return;
    }

    const authorization = req.headers?.authorization;
    if (authorization !== `Bearer ${ENV.cronSecret}`) {
      res.status(401).json({
        error: "Unauthorized",
        ok: false,
      });
      return;
    }

    try {
      const result = await runReutersEnergyAutomation();
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
