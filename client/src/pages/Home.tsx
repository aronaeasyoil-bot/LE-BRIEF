'use client';
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Calendar, MapPin, TrendingUp } from "lucide-react";
import CountUpStat from "@/components/CountUpStat";
import Kiosk from "@/components/Kiosk";
import AdsCarousel from "@/components/AdsCarousel";
import PriceWidget from "@/components/PriceWidget";
import TopSponsorBanner from "@/components/TopSponsorBanner";
import ArticleEngagementFooter from "@/components/ArticleEngagementFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { AFRICAN_COVERAGE_ITEMS, countArticlesByCoverage, getCoverageLabel } from "@/lib/editorial";
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

const dailyEditionLiveContent = {
  fr: {
    headline: "EN DIRECT - Moyen-Orient: des pétroliers iraniens ont franchi la zone du blocus américain",
    summary:
      "L'armée iranienne menace d'une réponse sévère après les attaques israéliennes du mardi 16 juin sur le Liban. En parallèle, un protocole d'accord entre l'Iran et les États-Unis, signé à distance le lundi 15 juin et attendu vendredi en Suisse pour officialisation, ouvre une phase de négociation. Plusieurs éléments du texte ont commencé à circuler, tandis que la levée du blocus américain sur les ports iraniens permet déjà à des pétroliers iraniens de franchir la zone.",
  },
  en: {
    headline: "LIVE - Middle East: Iranian tankers have crossed the US blockade zone",
    summary:
      "Iran's military is threatening a severe response after the Israeli attacks of Tuesday, June 16 on Lebanon. At the same time, a memorandum of understanding between Iran and the United States, signed remotely on Monday, June 15 and due to be formalized in Switzerland on Friday, has opened a new negotiation phase. Parts of the text are beginning to circulate, while the lifting of the US blockade on Iranian ports has already allowed Iranian tankers to cross the area.",
  },
  ar: {
    headline: "مباشر - الشرق الأوسط: ناقلات إيرانية عبرت منطقة الحصار الأميركي",
    summary:
      "تهدد القوات الإيرانية برد شديد بعد الهجمات الإسرائيلية يوم الثلاثاء 16 يونيو على لبنان. وفي الوقت نفسه، فتح بروتوكول تفاهم بين إيران والولايات المتحدة، وُقع عن بعد يوم الاثنين 15 يونيو ومن المنتظر إضفاء الطابع الرسمي عليه يوم الجمعة في سويسرا، مرحلة جديدة من التفاوض. وقد بدأت بعض بنود النص بالتداول، بينما سمح رفع الحصار الأميركي على الموانئ الإيرانية لناقلات إيرانية بعبور المنطقة بالفعل.",
  },
} as const;

export default function Home() {
  const { t, lang, rtl } = useLanguage();
  const { data: featured = [] } = trpc.articles.featured.useQuery({});
  const { data: articles = [] } = trpc.articles.published.useQuery({});
  const { data: events = [] } = trpc.events.published.useQuery();
  const magazinesQuery = trpc.magazines.list.useQuery();
  const magazines = magazinesQuery.data ?? [];
  const { data: ads = [] } = trpc.advertisements.active.useQuery();
  const [visibleArticlesCount, setVisibleArticlesCount] = useState(ARTICLE_BATCH_SIZE);
  const isLoadingMagazines = magazinesQuery.status === "pending";
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

  const journalLabel =
    lang === "fr" ? "Journal quotidien" : lang === "ar" ? "الصحيفة اليومية" : "Daily journal";
  const weeklyMagazineLabel =
    lang === "fr" ? "Magazine hebdomadaire" : lang === "ar" ? "المجلة الأسبوعية" : "Weekly magazine";
  const geographyLabel =
    lang === "fr" ? "Couverture geographique" : lang === "ar" ? "التغطية الجغرافية" : "Geographic coverage";
  const editorialRhythmLabel =
    lang === "fr" ? "Deux rythmes editoriaux" : lang === "ar" ? "إيقاعان تحريريان" : "Two editorial rhythms";
  const dailyEditionContent = dailyEditionLiveContent[lang as keyof typeof dailyEditionLiveContent] || dailyEditionLiveContent.fr;
  const priorityCountries = useMemo(
    () =>
      AFRICAN_COVERAGE_ITEMS.map((item) => ({
        count: countArticlesByCoverage(articles, item.slug),
        item,
      }))
        .filter((entry) => entry.count > 0)
        .sort((left, right) => right.count - left.count)
        .slice(0, 8),
    [articles],
  );

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
      <section id="magazine-hebdomadaire" className="relative pt-[168px] pb-12 overflow-hidden">
        {magazines.length > 0 ? (
          <Kiosk magazines={magazines} />
        ) : isLoadingMagazines ? (
          <div className="container">
            <div className="animate-pulse rounded-2xl border border-border/60 bg-card/30 p-6 md:p-8">
              <div className="mb-6 h-8 w-28 rounded bg-muted/40" />
              <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
                <div className="aspect-[3/4] rounded-xl bg-muted/40" />
                <div className="space-y-4 md:col-span-2">
                  <div className="h-4 w-24 rounded bg-muted/40" />
                  <div className="h-10 w-full max-w-2xl rounded bg-muted/40" />
                  <div className="h-4 w-48 rounded bg-muted/40" />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="h-12 w-full rounded bg-muted/40 sm:w-44" />
                    <div className="h-12 w-full rounded bg-muted/40 sm:w-36" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <TopSponsorBanner />

      {/* Price Widget */}
      <PriceWidget />

      <section className="border-b border-border py-10">
        <div className="container grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card/40 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{editorialRhythmLabel}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <a
                href="/#journal-quotidien"
                className="rounded-2xl border border-border bg-background/80 p-5 transition-colors hover:border-gold hover:bg-card"
              >
                <div className="inline-flex rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {journalLabel}
                </div>
                <h3 className="mt-4 text-xl font-bold text-foreground">
                  {lang === "fr" ? "Flux quotidien des articles" : lang === "ar" ? "تدفق يومي للمقالات" : "Daily article stream"}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {lang === "fr"
                    ? "Le site actualise les informations tous les jours avec les analyses, les alertes marche et les sujets prioritaires."
                    : lang === "ar"
                      ? "يتم تحديث الموقع يوميا بالتحليلات والتنبيهات السوقية والملفات ذات الأولوية."
                      : "The site updates every day with analysis, market alerts and priority stories."}
                </p>
              </a>

              <a
                href="/#magazine-hebdomadaire"
                className="rounded-2xl border border-border bg-background/80 p-5 transition-colors hover:border-gold hover:bg-card"
              >
                <div className="inline-flex rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {weeklyMagazineLabel}
                </div>
                <h3 className="mt-4 text-xl font-bold text-foreground">
                  {lang === "fr" ? "Edition premium du samedi" : lang === "ar" ? "العدد المميز ليوم السبت" : "Saturday premium edition"}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {lang === "fr"
                    ? "Le magazine regroupe chaque samedi les dossiers, entretiens et couvertures longues dans le kiosque."
                    : lang === "ar"
                      ? "تجمع المجلة كل سبت الملفات والتحقيقات والمقابلات والتغطيات الطويلة داخل الكشك."
                      : "The magazine gathers each Saturday's deep dives, interviews and long-form coverage in the kiosk."}
                </p>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card/40 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{geographyLabel}</p>
            <div className="mt-4 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold text-foreground">{t.nav.africa}</h3>
                  <Link href="/coverage/afrique" className="text-sm font-medium text-gold transition-colors hover:text-accent">
                    {lang === "fr" ? "Voir l'Afrique" : lang === "ar" ? "عرض أفريقيا" : "View Africa"}
                  </Link>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {lang === "fr"
                    ? "Senegal en priorite, puis les autres pays africains que LE BRIEF suit le plus regulierement."
                    : lang === "ar"
                      ? "السنغال أولا ثم بقية الدول الأفريقية التي يتابعها LE BRIEF باستمرار."
                      : "Senegal first, then the other African countries most consistently covered by LE BRIEF."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {priorityCountries.map(({ item, count }) => (
                    <Link
                      key={item.slug}
                      href={`/coverage/${item.slug}`}
                      className="rounded-full bg-secondary px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary/70"
                    >
                      {getCoverageLabel(item, lang)} <span className="text-muted-foreground">({count})</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-foreground">
                    {lang === "fr" ? "International" : lang === "ar" ? "الدولي" : "International"}
                  </h3>
                  <Link href="/coverage/international" className="text-sm font-medium text-gold transition-colors hover:text-accent">
                    {lang === "fr" ? "Voir l'international" : lang === "ar" ? "عرض الدولي" : "View international"}
                  </Link>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {lang === "fr"
                    ? "Les marches mondiaux, le Moyen-Orient, l'Europe, l'Asie et les Ameriques restent accessibles a part."
                    : lang === "ar"
                      ? "الأسواق العالمية والشرق الأوسط وأوروبا وآسيا والأميركيتان متاحة في قسم منفصل."
                      : "Global markets, the Middle East, Europe, Asia and the Americas remain available in a separate section."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

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
                <div className="space-y-3 mb-4">
                  <p className="text-base md:text-xl font-semibold text-foreground leading-snug">
                    {dailyEditionContent.headline}
                  </p>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    {dailyEditionContent.summary}
                  </p>
                </div>
                <p className="hidden">
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
                  <div className="overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-gold">
                    <div className="relative aspect-[16/10] min-h-[280px] overflow-hidden bg-card">
                      {featured[0]?.imageUrl && (
                        <img
                          src={featured[0].imageUrl}
                          alt={getLocalizedField(featured[0], "title", lang)}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute left-5 top-5 inline-block rounded bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg">
                        {featured[0]?.categoryId === 1 ? t.nav.energy : featured[0]?.categoryId === 2 ? t.nav.oilGas : t.nav.economy}
                      </div>
                    </div>
                    <div className="bg-[#05070c] p-6 md:p-7">
                      <h3 className="max-w-4xl text-2xl font-bold leading-tight text-white md:text-3xl">
                        {getLocalizedField(featured[0], "title", lang)}
                      </h3>
                      <p className="mt-3 max-w-3xl text-sm text-gray-300 md:text-base line-clamp-2">
                        {getLocalizedField(featured[0], "excerpt", lang)}
                      </p>
                      <ArticleEngagementFooter
                        article={featured[0]}
                        className="mt-4"
                        lang={lang}
                        showMetrics={false}
                        tone="inverse"
                      />
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
                        <ArticleEngagementFooter article={article} className="mt-4" lang={lang} showMetrics={false} />
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
      <section id="journal-quotidien" className="py-12 border-b border-border bg-card/20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {journalLabel}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
              {lang === "fr" ? "Analyses & Perspectives" : lang === "ar" ? "التحليلات والآفاق" : "Analysis & Perspectives"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              {lang === "fr"
                ? "Le journal quotidien du site est mis a jour tous les jours avec les analyses, le suivi marche et les nouveaux articles."
                : lang === "ar"
                  ? "يتم تحديث الصحيفة اليومية للموقع كل يوم بالتحليلات ومتابعة السوق والمقالات الجديدة."
                  : "The site's daily journal is updated every day with analysis, market tracking and fresh reporting."}
            </p>
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
                          <ArticleEngagementFooter article={article} className="mt-4" lang={lang} />
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
                    <ArticleEngagementFooter article={articles[0]} className="mt-4" lang={lang} showMetrics={false} />
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
