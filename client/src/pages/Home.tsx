'use client';
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Calendar, MapPin, Clock, TrendingUp } from "lucide-react";
import CountUpStat from "@/components/CountUpStat";
import Kiosk from "@/components/Kiosk";
import AdsCarousel from "@/components/AdsCarousel";
import PriceWidget from "@/components/PriceWidget";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMemo, useState } from "react";

function getLocalizedField(item: any, field: string, lang: string): string {
  const key = `${field}${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
  return item[key] || item[`${field}Fr`] || "";
}

const localMagazineFallback = [
  {
    id: "local-issue-71",
    titleFr: "LE BRIEF — Samedi 13 Mai 2026",
    titleEn: "LE BRIEF — Saturday May 13, 2026",
    titleAr: "LE BRIEF — السبت 13 مايو 2026",
    issueNumber: 71,
    pdfUrl: "/media/Magazine-LE-BRIEF-N71.pdf",
    coverImageUrl: "/media/whatsapp-image-2026-05-31.jpeg",
    publishedAt: "2026-05-30",
  },
];

const ARTICLE_BATCH_SIZE = 35;

export default function Home() {
  const { t, lang, rtl } = useLanguage();
  const { data: featured = [] } = trpc.articles.featured.useQuery({});
  const { data: articles = [] } = trpc.articles.published.useQuery({});
  const { data: events = [] } = trpc.events.published.useQuery();
  const { data: magazines = [] } = trpc.magazines.list.useQuery();
  const { data: ads = [] } = trpc.advertisements.active.useQuery();
  const [visibleArticlesCount, setVisibleArticlesCount] = useState(ARTICLE_BATCH_SIZE);
  const displayedMagazines = magazines.length > 0 ? magazines : localMagazineFallback;
  const visibleArticles = useMemo(
    () => articles.slice(0, visibleArticlesCount),
    [articles, visibleArticlesCount],
  );
  const hasMoreArticles = visibleArticlesCount < articles.length;
  const canCollapseArticles = visibleArticlesCount > ARTICLE_BATCH_SIZE;
  const showMoreArticlesLabel =
    lang === "fr" ? "Voir plus" : lang === "ar" ? "عرض المزيد" : "View more";
  const showLessArticlesLabel =
    lang === "fr" ? "Voir moins" : lang === "ar" ? "عرض اقل" : "Show less";

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />

      {/* Breaking News Ticker */}
      <div className="fixed top-[152px] left-0 right-0 z-40 bg-primary/90 backdrop-blur-sm">
        <div className="overflow-hidden h-8 flex items-center">
          <div className="animate-ticker whitespace-nowrap flex gap-12 text-xs font-medium text-primary-foreground">
            {articles?.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {getLocalizedField(a, "title", lang)}
              </span>
            ))}
            {articles?.map((a, i) => (
              <span key={`dup-${i}`} className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {getLocalizedField(a, "title", lang)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Kiosk - Magazine Section - NOW AT TOP */}
      <section className="relative pt-[168px] pb-12 overflow-hidden">
        <Kiosk magazines={displayedMagazines} />
      </section>

      {/* Price Widget */}
      <PriceWidget />

      {/* Editorial Header Section - Professional Introduction */}
      <section className="py-12 border-b border-border bg-gradient-to-r from-card/50 via-background to-card/50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-start gap-6">
              <div className="hidden md:block w-1 h-24 bg-gold rounded-full" />
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-foreground mb-4">
                  {lang === "fr" ? "Édition du jour" : lang === "ar" ? "الإصدار اليومي" : "Today's Edition"}
                </h2>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4">
                  {lang === "fr" ? "Découvrez nos sélections éditoriales : les actualités majeures, les analyses approfondies et les perspectives stratégiques sur l'énergie, l'économie et les investissements en Afrique et au Moyen-Orient." : lang === "ar" ? "اكتشف اختياراتنا التحريرية: الأخبار الرئيسية والتحليلات المتعمقة والآفاق الاستراتيجية حول الطاقة والاقتصاد والاستثمارات في أفريقيا والشرق الأوسط." : "Discover our editorial selections: major news, in-depth analysis, and strategic perspectives on energy, economy, and investments in Africa and the Middle East."}
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                    {lang === "fr" ? "🔴 EN DIRECT" : lang === "ar" ? "🔴 مباشر" : "🔴 LIVE"}
                  </span>
                  <span className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full">
                    {lang === "fr" ? "✓ Vérifié" : lang === "ar" ? "✓ تم التحقق" : "✓ Verified"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Articles Section - À la une (Editorial Layout) */}
      <section id="featured" className="py-12 border-b border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              {t.home.featured}
            </h2>
            <div className="w-12 h-1 bg-gold mt-3 rounded-full" />
          </motion.div>

          {featured && featured.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main featured article - Large */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="lg:col-span-2 group cursor-pointer"
              >
                <Link href={`/article/${featured[0]?.id}`}>
                  <div className="relative rounded-lg overflow-hidden bg-card border border-border hover:border-gold transition-colors h-96">
                    {featured[0]?.imageUrl && (
                      <img
                        src={featured[0].imageUrl}
                        alt={getLocalizedField(featured[0], "title", lang)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded mb-4">
                        {featured[0]?.categoryId === 1 ? t.nav.energy : featured[0]?.categoryId === 2 ? t.nav.oilGas : t.nav.economy}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
                        {getLocalizedField(featured[0], "title", lang)}
                      </h3>
                      <p className="text-gray-200 text-sm md:text-base line-clamp-2">
                        {getLocalizedField(featured[0], "excerpt", lang)}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Side featured articles - Smaller cards */}
              <div className="space-y-4">
                {featured?.slice(1, 4).map((article, i) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={`/article/${article.id}`}>
                      <div className="group p-4 border border-border rounded-lg hover:border-gold hover:bg-card/50 transition-all cursor-pointer h-full">
                        <div className="text-xs font-bold text-gold mb-2 uppercase tracking-wider">
                          {article.categoryId === 1 ? t.nav.energy : article.categoryId === 2 ? t.nav.oilGas : t.nav.economy}
                        </div>
                        <h4 className="font-bold text-foreground group-hover:text-gold transition-colors line-clamp-2 text-sm mb-2">
                          {getLocalizedField(article, "title", lang)}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {getLocalizedField(article, "excerpt", lang)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Analysis & Opinion Section - NEW PROFESSIONAL SECTION */}
      <section className="py-12 border-b border-border bg-card/20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              {lang === "fr" ? "Analyses & Perspectives" : lang === "ar" ? "التحليلات والآفاق" : "Analysis & Perspectives"}
            </h2>
            <div className="w-12 h-1 bg-accent mt-3 rounded-full" />
          </motion.div>

          {articles && articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleArticles.map((article, i) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/article/${article.id}`}>
                      <div className="group h-full border border-border rounded-lg overflow-hidden hover:border-gold transition-all cursor-pointer hover:shadow-lg hover:shadow-gold/10 flex flex-col">
                        {article.imageUrl && (
                          <div className="relative h-48 overflow-hidden bg-card">
                            <img
                              src={article.imageUrl}
                              alt={getLocalizedField(article, "title", lang)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-4 flex-1 flex flex-col">
                          <div className="text-xs font-bold text-gold mb-2 uppercase tracking-wider">
                            {article.categoryId === 1 ? t.nav.energy : article.categoryId === 2 ? t.nav.oilGas : t.nav.economy}
                          </div>
                          <h3 className="font-bold text-foreground group-hover:text-gold transition-colors line-clamp-3 mb-3 flex-1">
                            {getLocalizedField(article, "title", lang)}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {getLocalizedField(article, "excerpt", lang)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {(hasMoreArticles || canCollapseArticles) && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mt-8 flex flex-wrap items-center justify-center gap-3"
                >
                  {hasMoreArticles && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleArticlesCount((current) =>
                          Math.min(current + ARTICLE_BATCH_SIZE, articles.length),
                        )
                      }
                      className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      {showMoreArticlesLabel}
                    </button>
                  )}
                  {canCollapseArticles && (
                    <button
                      type="button"
                      onClick={() => setVisibleArticlesCount(ARTICLE_BATCH_SIZE)}
                      className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-card"
                    >
                      {showLessArticlesLabel}
                    </button>
                  )}
                </motion.div>
              )}
            </>
          ) : null}
        </div>
      </section>

      {/* Market Insights Section - NEW PROFESSIONAL SECTION */}
      <section className="py-12 border-b border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              {lang === "fr" ? "Tendances Marché" : lang === "ar" ? "اتجاهات السوق" : "Market Trends"}
            </h2>
            <div className="w-12 h-1 bg-gold mt-3 rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Featured Market Article */}
            {articles && articles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Link href={`/article/${articles[0]?.id}`}>
                  <div className="group p-6 border border-border rounded-lg hover:border-gold hover:bg-card/30 transition-all cursor-pointer">
                    <div className="flex items-start gap-3 mb-4">
                      <TrendingUp className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-gold mb-2 uppercase tracking-wider">
                          {articles[0]?.categoryId === 1 ? t.nav.energy : articles[0]?.categoryId === 2 ? t.nav.oilGas : t.nav.economy}
                        </div>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-gold transition-colors line-clamp-3">
                          {getLocalizedField(articles[0], "title", lang)}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {getLocalizedField(articles[0], "excerpt", lang)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Right Column - Statistics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <CountUpStat
                label={lang === "fr" ? "Pays couverts" : lang === "ar" ? "الدول المغطاة" : "Countries Covered"}
                value="45+"
              />
              <CountUpStat
                label={lang === "fr" ? "Articles/mois" : lang === "ar" ? "المقالات/الشهر" : "Articles/month"}
                value="150+"
              />
              <CountUpStat
                label={lang === "fr" ? "Lecteurs" : lang === "ar" ? "القراء" : "Readers"}
                value="250K"
              />
              <CountUpStat
                label={lang === "fr" ? "Années d'expertise" : lang === "ar" ? "سنوات الخبرة" : "Years Experience"}
                value="15+"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ads Carousel */}
      <AdsCarousel ads={ads || []} />

      {/* Events Section */}
      {events && events.length > 0 && (
        <section className="py-12 border-b border-border">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
                {t.sections.events}
              </h2>
              <div className="w-12 h-1 bg-gold mt-3 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 3).map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 border border-border rounded-lg hover:border-gold hover:bg-card/50 transition-all"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground text-sm">
                        {getLocalizedField(event, "title", lang)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2">
                        {event.eventDate ? new Date(event.eventDate).toLocaleDateString(lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR") : ""}
                      </p>
                    </div>
                  </div>
                  {event.location && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-10 text-center"
            >
              <Link href="/events">
                <button className="px-8 py-3 border border-gold text-gold font-medium rounded-lg hover:bg-gold/10 transition-colors inline-flex items-center gap-2">
                  {lang === "fr" ? "Voir tous les événements" : lang === "ar" ? "عرض جميع الأحداث" : "View all events"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Commodity Prices Section - MOVED TO BOTTOM */}
      <section className="relative py-12 overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="relative container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              {lang === "fr" ? "Cours des Matières Premières" : lang === "ar" ? "أسعار المواد الخام" : "Commodity Prices"}
            </h2>
            <div className="w-12 h-1 bg-accent mt-3 rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Oil Price */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {lang === "fr" ? "Pétrole Brut" : lang === "ar" ? "النفط الخام" : "Crude Oil"}
                  </h3>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-primary">$87.45</span>
                  <span className="text-sm text-green-500 font-medium">+2.3%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === "fr" ? "USD/baril" : lang === "ar" ? "دولار/برميل" : "USD/barrel"}
                </p>
              </motion.div>

              {/* Natural Gas Price */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {lang === "fr" ? "Gaz Naturel" : lang === "ar" ? "الغاز الطبيعي" : "Natural Gas"}
                  </h3>
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-accent">$3.12</span>
                  <span className="text-sm text-green-500 font-medium">+1.8%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === "fr" ? "USD/MMBtu" : lang === "ar" ? "دولار/MMBtu" : "USD/MMBtu"}
                </p>
              </motion.div>

              {/* Gold Price */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {lang === "fr" ? "Or" : lang === "ar" ? "الذهب" : "Gold"}
                  </h3>
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-yellow-500">$2,145</span>
                  <span className="text-sm text-green-500 font-medium">+0.9%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === "fr" ? "USD/oz" : lang === "ar" ? "دولار/أونصة" : "USD/oz"}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
