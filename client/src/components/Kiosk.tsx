import { useLanguage } from "@/contexts/LanguageContext";
import { shareLink } from "@/lib/share";
import { getSiteUrl } from "@/lib/site";
import { motion } from "framer-motion";
import { Download, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface KioskProps {
  magazines: any[];
}

const ARCHIVE_BATCH_SIZE = 6;

function getMagazineTitle(magazine: any, lang: string) {
  return lang === "ar"
    ? magazine.titleAr || magazine.titleFr
    : lang === "en"
      ? magazine.titleEn || magazine.titleFr
      : magazine.titleFr;
}

export default function Kiosk({ magazines }: KioskProps) {
  const { lang } = useLanguage();
  const [visibleArchiveCount, setVisibleArchiveCount] = useState(ARCHIVE_BATCH_SIZE);

  if (!magazines || magazines.length === 0) {
    return null;
  }

  const latestMagazine = magazines[0];
  const archiveMagazines = magazines.slice(1);
  const visibleArchiveMagazines = archiveMagazines.slice(0, visibleArchiveCount);
  const hasMoreArchiveMagazines = visibleArchiveCount < archiveMagazines.length;
  const canCollapseArchive = visibleArchiveCount > ARCHIVE_BATCH_SIZE;

  const downloadLabel =
    lang === "fr" ? "Telecharger PDF" : lang === "ar" ? "تحميل PDF" : "Download PDF";
  const shareLabel = lang === "fr" ? "Partager" : lang === "ar" ? "مشاركة" : "Share";
  const archiveLabel = lang === "fr" ? "Archives" : lang === "ar" ? "الأرشيف" : "Archive";
  const previousIssuesLabel =
    lang === "fr" ? "Numeros precedents" : lang === "ar" ? "الاعداد السابقة" : "Previous issues";
  const issueLabel = lang === "fr" ? "NUMERO" : lang === "ar" ? "العدد" : "ISSUE";
  const showMoreArchiveLabel =
    lang === "fr" ? "Voir toutes les archives" : lang === "ar" ? "عرض كل الأرشيف" : "View all archive";
  const showLessArchiveLabel =
    lang === "fr" ? "Masquer les archives" : lang === "ar" ? "اخفاء الأرشيف" : "Hide archive";

  const handleShare = async () => {
    const result = await shareLink("native", {
      text: latestMagazine.titleFr || latestMagazine.titleEn || latestMagazine.titleAr,
      title: getMagazineTitle(latestMagazine, lang),
      url: getSiteUrl(latestMagazine.pdfUrl),
    });

    if (result === "copied") {
      toast.success(
        lang === "fr"
          ? "Lien du magazine copie"
          : lang === "ar"
            ? "تم نسخ رابط المجلة"
            : "Magazine link copied",
      );
    }
  };

  return (
    <section className="border-b border-border py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="font-serif text-2xl font-bold md:text-3xl">Kiosque</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 items-center gap-8 md:grid-cols-3"
        >
          <div className="md:col-span-1">
            <div className="group relative cursor-pointer">
              {latestMagazine.coverImageUrl ? (
                <img
                  src={latestMagazine.coverImageUrl}
                  alt="Magazine Cover"
                  className="w-full rounded-lg shadow-xl transition-all group-hover:shadow-2xl group-hover:shadow-gold/20"
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-gradient-to-br from-gold to-primary shadow-xl">
                  <span className="text-xl font-bold text-white">LE BRIEF</span>
                </div>
              )}
              <div className="absolute inset-0 rounded-lg bg-black/0 transition-colors group-hover:bg-black/20" />
            </div>
          </div>

          <div className="space-y-6 md:col-span-2">
            <div>
              <p className="mb-2 text-sm font-bold text-gold">
                {issueLabel} {latestMagazine.issueNumber}
              </p>
              <h3 className="mb-3 font-serif text-2xl font-bold text-foreground md:text-3xl">
                {getMagazineTitle(latestMagazine, lang)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {new Date(latestMagazine.publishedAt).toLocaleDateString(
                  lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR",
                  { year: "numeric", month: "long", day: "numeric" },
                )}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={latestMagazine.pdfUrl}
                download
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                {downloadLabel}
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-lg border border-gold px-6 py-3 font-medium text-gold transition-colors hover:bg-gold/10"
              >
                <Share2 className="h-4 w-4" />
                {shareLabel}
              </button>
            </div>

            {archiveMagazines.length > 0 && (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{archiveLabel}</p>
                    <p className="text-xs text-muted-foreground">{previousIssuesLabel}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
                  {visibleArchiveMagazines.map((magazine, index) => (
                    <motion.a
                      key={magazine.id}
                      href={magazine.pdfUrl}
                      download
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <div className="space-y-2">
                        <div className="relative overflow-hidden rounded-lg border border-border transition-colors group-hover:border-gold">
                          {magazine.coverImageUrl ? (
                            <img
                              src={magazine.coverImageUrl}
                              alt={`Issue ${magazine.issueNumber}`}
                              className="aspect-[3/4] w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-gold/50 to-primary/50 text-xs font-bold text-white">
                              N{magazine.issueNumber}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                            {issueLabel} {magazine.issueNumber}
                          </p>
                          <p className="line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-gold">
                            {getMagazineTitle(magazine, lang)}
                          </p>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>

                {(hasMoreArchiveMagazines || canCollapseArchive) && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {hasMoreArchiveMagazines && (
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleArchiveCount((current) =>
                            Math.min(current + ARCHIVE_BATCH_SIZE, archiveMagazines.length),
                          )
                        }
                        className="rounded-lg border border-gold px-5 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
                      >
                        {showMoreArchiveLabel}
                      </button>
                    )}
                    {canCollapseArchive && (
                      <button
                        type="button"
                        onClick={() => setVisibleArchiveCount(ARCHIVE_BATCH_SIZE)}
                        className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card"
                      >
                        {showLessArchiveLabel}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
