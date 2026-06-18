import { ChangeEvent, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  FileSpreadsheet,
  Mail,
  RefreshCw,
  Send,
  Upload,
  Users,
} from "lucide-react";

const newsletterText = {
  ar: {
    configureProvider:
      "يلزم ضبط خدمة الإرسال قبل تفعيل إرسال النشرات. أضف RESEND_API_KEY و NEWSLETTER_FROM_EMAIL في Vercel.",
    currentDraft: "المسودة الحالية",
    emptyCampaigns: "لم يتم إنشاء أي حملة بعد.",
    emptyDraft: "لا توجد مسودة أسبوعية حالياً.",
    emptySubscribers: "لا يوجد مشتركون بعد.",
    generate: "إنشاء مسودة الأسبوع",
    import: "استيراد القائمة",
    importHint: "حمّل CSV أو الصق قائمة الإيميلات. سيتم حذف التكرارات تلقائياً.",
    importReady: "الملف جاهز للاستيراد",
    latestCampaigns: "آخر الحملات",
    noFile: "لم يتم تحميل ملف بعد.",
    preview: "معاينة البريد",
    recentSubscribers: "آخر المشتركين",
    refreshDraft: "تحديث المسودة",
    sendNow: "إرسال الآن",
    sendingDisabled: "الإرسال غير مفعّل حتى يتم ضبط مزود البريد.",
    sent: "تم الإرسال",
    statsCampaigns: "الحملات",
    statsSubscribers: "المشتركون",
    status: {
      draft: "مسودة",
      failed: "خطأ",
      sending: "إرسال",
      sent: "مرسل",
    },
    subtitle: "إنشاء نشرة أسبوعية تلقائياً ثم إرسالها فقط بعد ضغطك على زر الإرسال.",
    title: "Newsletter",
  },
  en: {
    configureProvider:
      "Email delivery is not configured yet. Add RESEND_API_KEY and NEWSLETTER_FROM_EMAIL in Vercel before sending newsletters.",
    currentDraft: "Current draft",
    emptyCampaigns: "No newsletter campaigns yet.",
    emptyDraft: "No daily draft is available yet.",
    emptySubscribers: "No subscribers yet.",
    generate: "Generate daily draft",
    import: "Import list",
    importHint: "Upload a CSV or paste a list of emails. Duplicates are removed automatically.",
    importReady: "File ready to import",
    latestCampaigns: "Latest campaigns",
    noFile: "No file loaded yet.",
    preview: "Email preview",
    recentSubscribers: "Recent subscribers",
    refreshDraft: "Refresh draft",
    sendNow: "Send now",
    sendingDisabled: "Sending stays disabled until the mail provider is configured.",
    sent: "Sent",
    statsCampaigns: "Campaigns",
    statsSubscribers: "Subscribers",
    status: {
      draft: "Draft",
      failed: "Failed",
      sending: "Sending",
      sent: "Sent",
    },
    subtitle: "A daily draft is prepared automatically at 02:00 Dubai time, then it is sent only after your approval from the admin panel.",
    title: "Newsletter",
  },
  fr: {
    configureProvider:
      "L'envoi email n'est pas encore configure. Ajoutez RESEND_API_KEY et NEWSLETTER_FROM_EMAIL dans Vercel avant l'envoi.",
    currentDraft: "Brouillon en attente",
    emptyCampaigns: "Aucune campagne newsletter pour le moment.",
    emptyDraft: "Aucun brouillon quotidien n'est disponible pour le moment.",
    emptySubscribers: "Aucun abonne pour le moment.",
    generate: "Generer le brouillon quotidien",
    import: "Importer la liste",
    importHint: "Chargez un CSV ou collez une liste d'emails. Les doublons sont elimines automatiquement.",
    importReady: "Fichier pret a importer",
    latestCampaigns: "Dernieres campagnes",
    noFile: "Aucun fichier charge pour le moment.",
    preview: "Apercu email",
    recentSubscribers: "Derniers abonnes",
    refreshDraft: "Rafraichir le brouillon",
    sendNow: "Envoyer maintenant",
    sendingDisabled: "L'envoi restera bloque tant que le fournisseur email n'est pas configure.",
    sent: "Envoye",
    statsCampaigns: "Campagnes",
    statsSubscribers: "Abonnes",
    status: {
      draft: "Brouillon",
      failed: "Erreur",
      sending: "Envoi",
      sent: "Envoye",
    },
    subtitle: "Le brouillon quotidien est prepare automatiquement a 02:00 heure de Dubai, puis l'envoi ne part qu'apres votre clic sur le bouton Envoyer.",
    title: "Newsletter",
  },
} as const;

function formatDateTime(value?: Date | string | null, locale = "fr-FR") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClasses(status: "draft" | "sending" | "sent" | "failed") {
  switch (status) {
    case "sent":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "sending":
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";
    case "failed":
      return "border-destructive/20 bg-destructive/10 text-destructive";
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }
}

export default function NewsletterAdminTab() {
  const { lang } = useLanguage();
  const text = newsletterText[lang as keyof typeof newsletterText] || newsletterText.fr;
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar-SA" : "fr-FR";
  const utils = trpc.useUtils();
  const [rawImportText, setRawImportText] = useState("");
  const [fileLabel, setFileLabel] = useState("");

  const dashboardQuery = trpc.newsletter.dashboard.useQuery();
  const importMutation = trpc.newsletter.importSubscribers.useMutation({
    onSuccess: async (result) => {
      await utils.newsletter.dashboard.invalidate();
      toast.success(
        lang === "fr"
          ? `${result.importedCount} emails importes, ${result.duplicateCount} doublons ignores.`
          : lang === "ar"
            ? `تم استيراد ${result.importedCount} بريداً وتجاهل ${result.duplicateCount} مكرراً.`
            : `${result.importedCount} emails imported, ${result.duplicateCount} duplicates ignored.`,
      );
      setRawImportText("");
      setFileLabel("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const generateMutation = trpc.newsletter.generateDailyDraft.useMutation({
    onSuccess: async () => {
      await utils.newsletter.dashboard.invalidate();
      toast.success(lang === "fr" ? "Brouillon quotidien mis a jour." : lang === "ar" ? "تم تحديث المسودة الأسبوعية." : "Daily draft updated.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const sendMutation = trpc.newsletter.sendCampaign.useMutation({
    onSuccess: async (result) => {
      await utils.newsletter.dashboard.invalidate();
      toast.success(
        lang === "fr"
          ? `Newsletter envoyee a ${result.sentCount} contacts.`
          : lang === "ar"
            ? `تم إرسال النشرة إلى ${result.sentCount} جهة اتصال.`
            : `Newsletter sent to ${result.sentCount} contacts.`,
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const campaigns = dashboardQuery.data?.campaigns ?? [];
  const currentDraft = useMemo(
    () =>
      campaigns.find(
        (campaign) =>
          campaign.language === "fr" &&
          (campaign.status === "draft" || campaign.status === "failed" || campaign.status === "sending"),
      ) ??
      campaigns.find(
        (campaign) =>
          campaign.status === "draft" || campaign.status === "failed" || campaign.status === "sending",
      ),
    [campaigns],
  );

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const textContent = await file.text();
    setRawImportText(textContent);
    setFileLabel(file.name);
  };

  const handleImport = () => {
    if (!rawImportText.trim()) {
      toast.error(text.noFile);
      return;
    }

    importMutation.mutate({
      language: "fr",
      rawText: rawImportText,
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{text.title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{text.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => generateMutation.mutate({ force: true })}
            disabled={generateMutation.isPending}
            className="bg-primary text-primary-foreground"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
            {text.generate}
          </Button>
        </div>
      </div>

      {!dashboardQuery.data?.sendConfigured && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div>{text.configureProvider}</div>
              <div className="mt-1 text-amber-100/80">{text.sendingDisabled}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{text.statsSubscribers}</span>
            <Users className="h-4 w-4 text-gold" />
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">{dashboardQuery.data?.totalSubscribers ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{text.statsCampaigns}</span>
            <Mail className="h-4 w-4 text-gold" />
          </div>
          <div className="mt-3 text-3xl font-bold text-foreground">{campaigns.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-5 md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">{text.importHint}</div>
              <div className="mt-2 text-sm text-foreground">
                {fileLabel ? `${text.importReady}: ${fileLabel}` : text.noFile}
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card">
              <Upload className="h-4 w-4" />
              CSV
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          <textarea
            value={rawImportText}
            onChange={(event) => setRawImportText(event.target.value)}
            placeholder="email@example.com&#10;contact@example.com"
            className="mt-4 h-32 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
          />
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={handleImport} disabled={importMutation.isPending || !rawImportText.trim()}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {text.import}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{text.currentDraft}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentDraft ? currentDraft.subject : text.emptyDraft}
              </p>
            </div>
            {currentDraft ? (
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(currentDraft.status)}`}>
                {text.status[currentDraft.status]}
              </span>
            ) : null}
          </div>

          {currentDraft ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Subject</div>
                  <div className="mt-2 text-sm font-medium text-foreground">{currentDraft.subject}</div>
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Updated</div>
                  <div className="mt-2 text-sm font-medium text-foreground">{formatDateTime(currentDraft.updatedAt, locale)}</div>
                </div>
              </div>

              {currentDraft.lastError ? (
                <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  {currentDraft.lastError}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => generateMutation.mutate({ force: true })}
                  disabled={generateMutation.isPending || currentDraft.status === "sending"}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                  {text.refreshDraft}
                </Button>
                <Button
                  type="button"
                  onClick={() => sendMutation.mutate({ id: currentDraft.id })}
                  disabled={
                    sendMutation.isPending ||
                    currentDraft.status === "sending" ||
                    currentDraft.status === "sent" ||
                    !dashboardQuery.data?.sendConfigured
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  {currentDraft.status === "sent" ? text.sent : text.sendNow}
                </Button>
              </div>

              <div className="mt-6">
                <div className="mb-3 text-sm font-medium text-foreground">{text.preview}</div>
                <iframe
                  title="newsletter-preview"
                  srcDoc={currentDraft.htmlContent}
                  className="h-[720px] w-full rounded-2xl border border-border bg-white"
                />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">
              {text.emptyDraft}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card/60 p-5">
            <h3 className="text-lg font-semibold text-foreground">{text.latestCampaigns}</h3>
            <div className="mt-4 space-y-3">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-xl border border-border bg-background/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{campaign.subject}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(campaign.createdAt, locale)}
                        </div>
                      </div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(campaign.status)}`}>
                        {text.status[campaign.status]}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {campaign.sentCount > 0 ? `${campaign.sentCount}/${campaign.recipientCount}` : `${campaign.articleCount} articles`}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  {text.emptyCampaigns}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-5">
            <h3 className="text-lg font-semibold text-foreground">{text.recentSubscribers}</h3>
            <div className="mt-4 space-y-3">
              {(dashboardQuery.data?.subscribers ?? []).length > 0 ? (
                dashboardQuery.data?.subscribers.map((subscriber) => (
                  <div key={subscriber.id} className="rounded-xl border border-border bg-background/50 p-4">
                    <div className="text-sm font-medium text-foreground">{subscriber.email}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(subscriber.createdAt, locale)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  {text.emptySubscribers}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

