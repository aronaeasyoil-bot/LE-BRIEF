import { normalizeNewsletterEmail, unsubscribeNewsletterEmail } from "./newsletter";

function renderUnsubscribeHtml(success: boolean) {
  const title = success ? "Desinscription confirmee" : "Lien de desinscription invalide";
  const description = success
    ? "Votre adresse email a bien ete retiree de la newsletter LE BRIEF."
    : "Le lien de desinscription est invalide ou a deja ete utilise.";

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#05070c;color:#f8fafc;font-family:Inter,Arial,sans-serif;">
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
      <div style="max-width:560px;width:100%;background:#0f172a;border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:36px;">
        <div style="font-size:34px;font-weight:800;letter-spacing:-0.03em;margin-bottom:18px;">
          <span style="color:#ffffff;">LE </span><span style="color:#d62828;">BRIEF</span>
        </div>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">${title}</h1>
        <p style="margin:0;color:#cbd5e1;font-size:16px;line-height:1.7;">${description}</p>
      </div>
    </div>
  </body>
</html>`;
}

export function registerNewsletterRoutes(app: any) {
  app.get("/api/newsletter/unsubscribe", async (req: any, res: any) => {
    const email = normalizeNewsletterEmail(String(req.query?.email || ""));
    const token = String(req.query?.token || "");

    try {
      const success = await unsubscribeNewsletterEmail(email, token);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(success ? 200 : 400).send(renderUnsubscribeHtml(success));
    } catch (error) {
      console.error("[Newsletter] Unsubscribe failed:", error);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(500).send(renderUnsubscribeHtml(false));
    }
  });
}

