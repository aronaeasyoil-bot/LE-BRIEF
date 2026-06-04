import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Download, Share2 } from "lucide-react";

interface KioskProps {
  magazines: any[];
}

export default function Kiosk({ magazines }: KioskProps) {
  const { t, lang } = useLanguage();

  if (!magazines || magazines.length === 0) {
    return null;
  }

  const latestMagazine = magazines[0];

  return (
    <section className="py-8 border-b border-border">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="text-2xl md:text-3xl font-bold font-serif">Kiosque</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center"
        >
          {/* Magazine Cover */}
          <div className="md:col-span-1">
            <div className="relative group cursor-pointer">
              {latestMagazine.coverImageUrl ? (
                <img
                  src={latestMagazine.coverImageUrl}
                  alt="Magazine Cover"
                  className="w-full rounded-lg shadow-xl group-hover:shadow-2xl group-hover:shadow-gold/20 transition-all"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-gradient-to-br from-gold to-primary rounded-lg shadow-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">LE BRIEF</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
            </div>
          </div>

          {/* Magazine Info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <p className="text-gold text-sm font-bold mb-2">NUMÉRO {latestMagazine.issueNumber}</p>
              <h3 className="text-2xl md:text-3xl font-bold font-serif text-foreground mb-3">
                {lang === "ar"
                  ? latestMagazine.titleAr
                  : lang === "en"
                    ? latestMagazine.titleEn
                    : latestMagazine.titleFr}
              </h3>
              <p className="text-muted-foreground text-sm">
                {new Date(latestMagazine.publishedAt).toLocaleDateString(
                  lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={latestMagazine.pdfUrl}
                download
                className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 justify-center"
              >
                <Download className="w-4 h-4" />
                Télécharger PDF
              </a>
              <button className="px-6 py-3 border border-gold text-gold font-medium rounded-lg hover:bg-gold/10 transition-colors flex items-center gap-2 justify-center">
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            </div>

            {/* Other Issues */}
            {magazines.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Numéros précédents</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {magazines.slice(1, 5).map((mag, i) => (
                    <motion.a
                      key={mag.id}
                      href={mag.pdfUrl}
                      download
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="group"
                    >
                      <div className="relative rounded-lg overflow-hidden border border-border group-hover:border-gold transition-colors">
                        {mag.coverImageUrl ? (
                          <img
                            src={mag.coverImageUrl}
                            alt={`Issue ${mag.issueNumber}`}
                            className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full aspect-[3/4] bg-gradient-to-br from-gold/50 to-primary/50 flex items-center justify-center text-xs font-bold text-white">
                            N°{mag.issueNumber}
                          </div>
                        )}
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
