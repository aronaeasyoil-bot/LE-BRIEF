import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const PARTNER_ROTATION_MS = 5000;

const partnerSlides = [
  {
    alt: "Partenaire FSE - Fonds Special de Soutien au Secteur de l'Energie",
    href: "https://www.fse.sn",
    id: "fse",
    imageSrc: "/media/fse-premium-ad.jpg",
  },
];

export default function TopSponsorBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMultipleSlides = partnerSlides.length > 1;

  useEffect(() => {
    if (!hasMultipleSlides) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((previousIndex) => (previousIndex + 1) % partnerSlides.length);
    }, PARTNER_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [hasMultipleSlides]);

  const currentSlide = partnerSlides[currentIndex];

  return (
    <section className="border-b border-border bg-[#06111f] py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-6xl"
        >
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-gold">
              Partenaires
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <AnimatePresence mode="wait">
              <motion.a
                key={currentSlide.id}
                href={currentSlide.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Ouvrir la publicite partenaire ${currentSlide.id.toUpperCase()}`}
                initial={{ opacity: 0.2 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.2 }}
                transition={{ duration: 0.4 }}
                className="group block"
              >
                <div className="relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" />
                  <img
                    src={currentSlide.imageSrc}
                    alt={currentSlide.alt}
                    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.01]"
                    loading="eager"
                  />
                </div>
              </motion.a>
            </AnimatePresence>
          </div>

          {hasMultipleSlides && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {partnerSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Afficher le partenaire ${index + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex ? "w-8 bg-gold" : "w-2 bg-white/35 hover:bg-white/55"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
