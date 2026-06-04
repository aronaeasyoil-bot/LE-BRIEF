import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdsCarouselProps {
  ads: any[];
}

export default function AdsCarousel({ ads }: AdsCarouselProps) {
  const { lang } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (ads.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (!ads || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  return (
    <section className="py-8 border-b border-border bg-card/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-lg overflow-hidden group"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAd.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative w-full aspect-video bg-card flex items-center justify-center"
            >
              {currentAd.imageUrl && (
                <img
                  src={currentAd.imageUrl}
                  alt="Advertisement"
                  className="w-full h-full object-cover"
                />
              )}
              {currentAd.videoUrl && (
                <video
                  src={currentAd.videoUrl}
                  autoPlay
                  muted
                  loop
                  className="w-full h-full object-cover"
                />
              )}

              {/* Overlay with title */}
              {(currentAd.titleFr || currentAd.titleEn || currentAd.titleAr) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <h3 className="text-white font-bold text-lg">
                    {lang === "ar"
                      ? currentAd.titleAr
                      : lang === "en"
                        ? currentAd.titleEn
                        : currentAd.titleFr}
                  </h3>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? "bg-gold w-6" : "bg-white/50 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
