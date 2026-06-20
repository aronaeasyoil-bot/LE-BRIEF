import { useLanguage } from "@/contexts/LanguageContext";
import { shareLink } from "@/lib/share";
import { getMagazineSiteUrl } from "@/lib/site";
import { motion } from "framer-motion";
import { BookOpen, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

interface KioskProps {
  magazines: any[];
}

const ARCHIVE_BATCH_SIZE = 6;

function getMagazineOrderTimestamp(magazine: any) {
  return Date.parse(magazine?.createdAt || "") || Date.parse(magazine?.publishedAt || "") || 0;
}

function sortMagazinesForKiosk(magazines: any[]) {
  return [...magazines].sort((left, right) => {
    const timeDelta = getMagazineOrderTimestamp(right) - getMagazineOrderTimestamp(left);
    if (timeDelta !== 0) {
      return timeDelta;
    }

    const issueDelta = Number(right?.issueNumber || 0) - Number(left?.issueNumber || 0);
    if (issueDelta !== 0) {
      return issueDelta;
    }

    return Number(right?.id || 0) - Number(left?.id || 0);
  });
}

function getMagazineTitle(magazine: any, lang: string) {
  return lang === "ar"
    ? magazine.titleAr || magazine.titleFr
    : lang === "en"
      ? magazine.titleEn || magazine.titleFr
      : magazine.titleFr;
}

function getMagazineHref(magazine: any, options?: { reader?: boolean }) {
  const magazineId = Number(magazine?.id || 0);
  if (!Number.isInteger(magazineId) || magazineId <= 0) {
    return "/";
  }

  return options?.reader && magazine?.pdfUrl ? `/magazine/${magazineId}#reader` : `/magazine/${magazineId}`;
}

export default function Kiosk({ magazines }: KioskProps) {
  const { lang } = useLanguage();
  const [visibleArchiveCount, setVisibleArchiveCount] = useState(ARCHIVE_BATCH_SIZE);

  if (!magazines || magazines.length === 0) {
    return null;
  }

  const sortedMagazines = sortMagazinesForKiosk(magazines);
  const latestMagazine = sortedMagazines[0];
  const archiveMagazines = sortedMagazines.slice(1);
  const visibleArchiveMagazines = archiveMagazines.slice(0, visibleArchiveCount);
  const hasMoreArchiveMagazines = visibleArchiveCount < archiveMagazines.length;
  const canCollapseArchive = visibleArchiveCount > ARCHIVE_BATCH_SIZE;

  const readLabel =
    lang === "fr" ? "Lire le magazine" : lang === "ar" ? "قراءة المجلة" : "Read magazine";
  const shareLabel = lang === "fr" ? "Partager" : lang === "ar" ? "مشاركة" : "Share";
  const archiveLabel = lang === "fr" ? "Archives" : lang === "ar" ? "الأرشيف" : "Archive";
  const previousIssuesLabel =
    lang === "fr" ? "Numeros precedents" : lang === "ar" ? "الأعداد السابقة" : "Previous issues";
  const issueLabel = lang === "fr" ? "NUMERO" : lang === "ar" ? "العدد" : "ISSUE";
  const showMoreArchiveLabel =
    lang === "fr" ? "Voir toutes les archives" : lang === "ar" ? "عرض كل الأرشيف" : "View all archive";
  const showLessArchiveLabel =
    lang === "fr" ? "Masquer les archives" : lang === "ar" ? "اخفاء الأرشيف" : "Hide archive";
  const weeklyLabel =
    lang === "fr" ? "Magazine hebdomadaire" : lang === "ar" ? "المجلة الأسبوعية" : "Weekly magazine";
  const weeklySummary =
    lang === "fr"
      ? "Chaque samedi, LE BRIEF publie son edition magazine dans le kiosque."
      : lang === "ar"
        ? "كل سبت ينشر LE BRIEF عدده الأسبوعي داخل الكشك."
        : "Every Saturday, LE BRIEF publishes its weekly magazine edition in the kiosk.";

  const handleShare = async () => {
    const magazineUrl = getMagazineSiteUrl(latestMagazine.id, { reader: Boolean(latestMagazine?.pdfUrl) });
    const result = await shareLink("native", {
      title: getMagazineTitle(latestMagazine, lang),
      url: magazineUrl,
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
          <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {weeklyLabel}
          </div>
          <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">Kiosque</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{weeklySummary}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 items-center gap-8 md:grid-cols-3"
        >
          <div className="md:col-span-1">
            <Link href={getMagazineHref(latestMagazine, { reader: true })} className="group relative block cursor-pointer">
              {latestMagazine.coverImageUrl ? (
                <img
                  src={latestMagazine.coverImageUrl}
                  alt={getMagazineTitle(latestMagazine, lang)}
                  className="w-full rounded-lg shadow-xl transition-all group-hover:shadow-2xl group-hover:shadow-gold/20"
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-gradient-to-br from-gold to-primary shadow-xl">
                  <span className="text-xl font-bold text-white">LE BRIEF</span>
                </div>
              )}
              <div className="absolute inset-0 rounded-lg bg-black/0 transition-colors group-hover:bg-black/20" />
            </Link>
          </div>

          <div className="space-y-6 md:col-span-2">
            <div>
              <p className="mb-2 text-sm font-bold text-gold">
                {issueLabel} {latestMagazine.issueNumber}
              </p>
              <Link href={getMagazineHref(latestMagazine, { reader: true })}>
                <h3 className="mb-3 font-serif text-2xl font-bold text-foreground transition-colors hover:text-gold md:text-3xl">
                  {getMagazineTitle(latestMagazine, lang)}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground">
                {new Date(latestMagazine.publishedAt).toLocaleDateString(
                  lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR",
                  { year: "numeric", month: "long", day: "numeric" },
                )}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={getMagazineHref(latestMagazine, { reader: true })}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <BookOpen className="h-4 w-4" />
                {readLabel}
              </Link>
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
                    <motion.div
                      key={magazine.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <Link href={getMagazineHref(magazine, { reader: true })} className="block space-y-2">
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
                      </Link>
                    </motion.div>
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
