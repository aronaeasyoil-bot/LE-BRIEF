import Footer from "@/components/Footer";
import MagazineMobilePdfViewer from "@/components/MagazineMobilePdfViewer";
import MagazineUnlockCard from "@/components/MagazineUnlockCard";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PREVIEW_IMAGE_URL, SITE_DESCRIPTION, getMagazineSiteUrl } from "@/lib/site";
import { shareLink, type SharePlatform } from "@/lib/share";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Copy, Download, Lock, MessageCircle, Share2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";

const MAGAZINE_READER_ID = "reader";

function getMagazineTitle(magazine: any, lang: string) {
  return lang === "ar"
    ? magazine.titleAr || magazine.titleFr
    : lang === "en"
      ? magazine.titleEn || magazine.titleFr
      : magazine.titleFr;
}

function getMagazineDocumentProxyUrl(magazineId: number, accessMode: "full" | "preview") {
  return `/api/magazine-file/${magazineId}?access=${accessMode}`;
}

function getMagazinePageHref(magazineId: number, options?: { reader?: boolean }) {
  return options?.reader ? `/magazine/${magazineId}#reader` : `/magazine/${magazineId}`;
}

export default function MagazinePage() {
  const { lang, rtl } = useLanguage();
  const params = useParams<{ id: string }>();
  const magazineId = Number.parseInt(params.id || "0", 10);
  const { data: magazine, isLoading } = trpc.magazines.byId.useQuery(
    { id: magazineId },
    { enabled: Number.isInteger(magazineId) && magazineId > 0 },
  );
  const { data: paywallStatus } = trpc.magazinePayments.status.useQuery(
    { magazineId },
    { enabled: Number.isInteger(magazineId) && magazineId > 0 },
  );

  const magazineTitle = magazine ? getMagazineTitle(magazine, lang) : "Kiosque";
  const magazineUrl = getMagazineSiteUrl(magazineId, { reader: Boolean(magazine?.pdfUrl) });
  const pageLead = magazine
    ? `${
        lang === "fr"
          ? "Consultez la couverture et lisez ce numero directement sur LE BRIEF."
          : lang === "ar"
            ? "اطلع على الغلاف واقرأ هذا العدد مباشرة على LE BRIEF."
            : "See the cover and read this issue directly on LE BRIEF."
      }`
    : SITE_DESCRIPTION;
  const canEmbedDocument = Boolean(magazine?.pdfUrl);
  const isPremiumMagazine = Boolean(paywallStatus?.isPremium);
  const isUnlocked = Boolean(paywallStatus?.isUnlocked || !paywallStatus?.isPremium);
  const canDownload = Boolean(paywallStatus?.canDownload || !paywallStatus?.isPremium);
  const previewPageCount = paywallStatus?.previewPageCount || 3;
  const priceFcfa = paywallStatus?.priceFcfa || 1000;
  const accessMode: "full" | "preview" = isUnlocked ? "full" : "preview";
  const embeddedDocumentUrl = magazine?.pdfUrl ? getMagazineDocumentProxyUrl(magazineId, accessMode) : "";
  const downloadUrl = `/api/magazine-file/${magazineId}?download=1`;

  useEffect(() => {
    if (!canEmbedDocument || typeof window === "undefined" || window.location.hash !== `#${MAGAZINE_READER_ID}`) {
      return;
    }

    const timer = window.setTimeout(() => {
      const readerSection = document.getElementById(MAGAZINE_READER_ID);
      if (!readerSection) {
        return;
      }

      const top = readerSection.getBoundingClientRect().top + window.scrollY - 150;
      window.scrollTo({
        top: Math.max(top, 0),
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [canEmbedDocument, magazineId]);

  usePageMeta({
    appendSiteName: false,
    description: "",
    image: magazine?.coverImageUrl || PREVIEW_IMAGE_URL,
    path: `/magazine/${magazineId}`,
    title: magazineTitle,
    type: "website",
  });

  const handleShare = async (platform: SharePlatform) => {
    if (!magazine) return;

    try {
      const result = await shareLink(platform, {
        title: magazineTitle,
        url: magazineUrl,
      });

      if (result === "copied") {
        toast.success(
          lang === "fr" ? "Lien du magazine copie" : lang === "ar" ? "تم نسخ رابط المجلة" : "Magazine link copied",
        );
      }
    } catch {
      toast.error(lang === "fr" ? "Le partage a echoue" : lang === "ar" ? "فشل المشاركة" : "Share failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
        <Navbar />
        <div className="container pt-[140px]">
          <div className="grid animate-pulse gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="aspect-[3/4] rounded-xl bg-secondary" />
            <div className="space-y-4">
              <div className="h-6 w-32 rounded bg-secondary" />
              <div className="h-12 w-3/4 rounded bg-secondary" />
              <div className="h-4 w-1/2 rounded bg-secondary" />
              <div className="h-24 w-full rounded bg-secondary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!magazine) {
    return null;
  }

  const issueLabel = lang === "fr" ? "Numero" : lang === "ar" ? "العدد" : "Issue";
  const readLabel = lang === "fr" ? "Lire le magazine" : lang === "ar" ? "قراءة المجلة" : "Read magazine";
  const downloadLabel = lang === "fr" ? "Telecharger le PDF" : lang === "ar" ? "تحميل PDF" : "Download PDF";
  const unlockLabel =
    lang === "fr" ? `Debloquer ${priceFcfa} FCFA` : lang === "ar" ? `افتح مقابل ${priceFcfa} FCFA` : `Unlock for ${priceFcfa} FCFA`;

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />
      <main className="pb-16 pt-[140px]">
        <div className="container mx-auto max-w-6xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "fr" ? "Retour au site" : lang === "ar" ? "العودة إلى الموقع" : "Back to site"}
          </Link>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)]"
          >
            <div>
              {canEmbedDocument ? (
                <a href={`#${MAGAZINE_READER_ID}`} className="group block">
                  {magazine.coverImageUrl ? (
                    <img
                      src={magazine.coverImageUrl}
                      alt={magazineTitle}
                      className="w-full rounded-2xl border border-border object-cover shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl border border-border bg-card text-2xl font-bold text-foreground">
                      LE BRIEF
                    </div>
                  )}
                </a>
              ) : magazine.coverImageUrl ? (
                <img
                  src={magazine.coverImageUrl}
                  alt={magazineTitle}
                  className="w-full rounded-2xl border border-border object-cover shadow-2xl"
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl border border-border bg-card text-2xl font-bold text-foreground">
                  LE BRIEF
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-gold">
                {lang === "fr" ? "Kiosque" : lang === "ar" ? "الكشك" : "Kiosk"}
              </p>
              <h1 className="max-w-4xl font-serif text-3xl font-bold text-foreground md:text-5xl">
                {magazineTitle}
              </h1>
              <p className="mt-4 text-sm text-muted-foreground">
                {issueLabel} {magazine.issueNumber}
                {" - "}
                {magazine.publishedAt
                  ? new Date(magazine.publishedAt).toLocaleDateString(
                      lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR",
                      { day: "numeric", month: "long", year: "numeric" },
                    )
                  : ""}
              </p>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
                {pageLead}
              </p>
              {isPremiumMagazine && !isUnlocked ? (
                <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
                  {lang === "fr"
                    ? `Lecture libre sur les ${previewPageCount} premieres pages. Le reste du numero se debloque apres validation du paiement Wave.`
                    : lang === "ar"
                      ? `القراءة متاحة لأول ${previewPageCount} صفحات. بقية العدد تُفتح بعد التحقق من دفع Wave.`
                      : `Free reading on the first ${previewPageCount} pages. The rest unlocks after Wave payment validation.`}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                {canEmbedDocument ? (
                  <a
                    href={`#${MAGAZINE_READER_ID}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <BookOpen className="h-4 w-4" />
                    {readLabel}
                  </a>
                ) : (
                  <a
                    href={getMagazinePageHref(magazineId)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <BookOpen className="h-4 w-4" />
                    {readLabel}
                  </a>
                )}
                {embeddedDocumentUrl && canDownload ? (
                  <a
                    href={downloadUrl}
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <Download className="h-4 w-4" />
                    {downloadLabel}
                  </a>
                ) : null}
                {isPremiumMagazine && !isUnlocked ? (
                  <a
                    href={`#${MAGAZINE_READER_ID}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-gold px-6 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
                  >
                    <Lock className="h-4 w-4" />
                    {unlockLabel}
                  </a>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="border-gold text-gold hover:bg-gold/10 hover:text-gold"
                  onClick={() => handleShare("native")}
                >
                  <Share2 className="h-4 w-4" />
                  {lang === "fr" ? "Partager" : lang === "ar" ? "مشاركة" : "Share"}
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleShare("whatsapp")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-green-500"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShare("copy")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-gold"
                  aria-label={lang === "fr" ? "Copier le lien" : lang === "ar" ? "نسخ الرابط" : "Copy link"}
                  title={lang === "fr" ? "Copier le lien" : lang === "ar" ? "نسخ الرابط" : "Copy link"}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.section>

          {canEmbedDocument ? (
            <motion.section
              id={MAGAZINE_READER_ID}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 scroll-mt-[150px] rounded-3xl border border-border bg-card/70 p-4 shadow-sm md:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                    {lang === "fr" ? "Lecture sur LE BRIEF" : lang === "ar" ? "القراءة على LE BRIEF" : "Read on LE BRIEF"}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">{magazineTitle}</h2>
                </div>
                {embeddedDocumentUrl && canDownload ? (
                  <a
                    href={downloadUrl}
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <Download className="h-4 w-4" />
                    {downloadLabel}
                  </a>
                ) : null}
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-background p-2">
                <MagazineMobilePdfViewer
                  lang={lang}
                  lockedAfterPage={isPremiumMagazine && !isUnlocked ? previewPageCount : undefined}
                  paywallCard={
                    isPremiumMagazine && !isUnlocked && paywallStatus ? (
                      <MagazineUnlockCard
                        magazineId={magazineId}
                        previewPageCount={previewPageCount}
                        priceFcfa={priceFcfa}
                        waveNumber={paywallStatus.waveNumber}
                        waveQrImageUrl={paywallStatus.waveQrImageUrl}
                      />
                    ) : undefined
                  }
                  pdfUrl={embeddedDocumentUrl}
                  reloadToken={accessMode}
                  title={magazineTitle}
                />
              </div>
            </motion.section>
          ) : null}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
