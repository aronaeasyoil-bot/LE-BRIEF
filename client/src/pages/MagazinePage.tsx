import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { shareLink, type SharePlatform } from "@/lib/share";
import { PREVIEW_IMAGE_URL, SITE_DESCRIPTION, getSiteUrl } from "@/lib/site";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Download, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

function getMagazineTitle(magazine: any, lang: string) {
  return lang === "ar"
    ? magazine.titleAr || magazine.titleFr
    : lang === "en"
      ? magazine.titleEn || magazine.titleFr
      : magazine.titleFr;
}

export default function MagazinePage() {
  const { lang, rtl } = useLanguage();
  const params = useParams<{ id: string }>();
  const magazineId = Number.parseInt(params.id || "0", 10);
  const { data: magazine, isLoading } = trpc.magazines.byId.useQuery(
    { id: magazineId },
    { enabled: Number.isInteger(magazineId) && magazineId > 0 },
  );

  const magazineTitle = magazine ? getMagazineTitle(magazine, lang) : "Kiosque";
  const magazineUrl = getSiteUrl(`/magazine/${magazineId}`);
  const magazineDescription = magazine
    ? `${
        lang === "fr"
          ? "Retrouvez la couverture et le telechargement du magazine"
          : lang === "ar"
            ? "اكتشف غلاف المجلة وتنزيلها"
            : "Discover the cover and download for"
      } ${magazineTitle}.`
    : SITE_DESCRIPTION;

  usePageMeta({
    description: magazineDescription,
    image: magazine?.coverImageUrl || PREVIEW_IMAGE_URL,
    path: `/magazine/${magazineId}`,
    title: magazineTitle,
    type: "website",
  });

  const handleShare = async (platform: SharePlatform) => {
    if (!magazine) return;

    try {
      const result = await shareLink(platform, {
        text: magazineDescription,
        title: magazineTitle,
        url: magazineUrl,
      });

      if (result === "copied") {
        toast.success(
          lang === "fr" ? "Lien du magazine copie" : lang === "ar" ? "تم نسخ رابط المجلة" : "Magazine link copied",
        );
      }
    } catch {
      toast.error(lang === "fr" ? "Le partage a echoue" : lang === "ar" ? "فشلت المشاركة" : "Share failed");
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
              {magazine.coverImageUrl ? (
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
                {lang === "fr" ? "Numero" : lang === "ar" ? "العدد" : "Issue"} {magazine.issueNumber}
                {" - "}
                {magazine.publishedAt
                  ? new Date(magazine.publishedAt).toLocaleDateString(
                      lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR",
                      { day: "numeric", month: "long", year: "numeric" },
                    )
                  : ""}
              </p>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
                {magazineDescription}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={magazine.pdfUrl}
                  download
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  {lang === "fr" ? "Telecharger le PDF" : lang === "ar" ? "تحميل PDF" : "Download PDF"}
                </a>
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
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
