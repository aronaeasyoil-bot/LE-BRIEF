import ArticleEngagementFooter from "@/components/ArticleEngagementFooter";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AFRICAN_COVERAGE_ITEMS,
  articleMatchesCoverage,
  countArticlesByCoverage,
  COVERAGE_ROOT_ITEMS,
  filterArticlesByCoverage,
  getCoverageBySlug,
  getCoverageDescription,
  getCoverageLabel,
} from "@/lib/editorial";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowRight, Globe2, Newspaper } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "wouter";

function getLocalizedField(item: any, field: string, lang: string): string {
  const key = `${field}${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
  return item[key] || item[`${field}Fr`] || "";
}

export default function CoveragePage() {
  const { lang, rtl, t } = useLanguage();
  const params = useParams<{ slug: string }>();
  const coverage = getCoverageBySlug(params.slug);
  const { data: articles = [] } = trpc.articles.published.useQuery({});
  const { data: categories = [] } = trpc.categories.list.useQuery();

  const filteredArticles = useMemo(
    () => (coverage ? filterArticlesByCoverage(articles, coverage.slug) : []),
    [articles, coverage],
  );
  const featuredArticle = filteredArticles[0];
  const remainingArticles = filteredArticles.slice(1);

  const coverageLabel = coverage ? getCoverageLabel(coverage, lang) : params.slug;
  const coverageDescription = coverage ? getCoverageDescription(coverage, lang) : "";
  const africaLabel = getCoverageLabel(COVERAGE_ROOT_ITEMS[0], lang);
  const internationalLabel = getCoverageLabel(COVERAGE_ROOT_ITEMS[1], lang);

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />

      <main className="pb-16 pt-[140px]">
        <section className="border-b border-border bg-card/20 py-10">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  <Globe2 className="h-3.5 w-3.5" />
                  {coverage?.slug === "international" ? internationalLabel : africaLabel}
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground md:text-5xl">{coverageLabel}</h1>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                    {coverageDescription}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/#journal-quotidien"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Newspaper className="h-4 w-4" />
                    {lang === "fr" ? "Journal quotidien" : lang === "ar" ? "النشرة اليومية" : "Daily journal"}
                  </a>
                  <a
                    href="/#magazine-hebdomadaire"
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-card"
                  >
                    {lang === "fr" ? "Magazine hebdomadaire" : lang === "ar" ? "المجلة الأسبوعية" : "Weekly magazine"}
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  {lang === "fr" ? "Couverture geographique" : lang === "ar" ? "التغطية الجغرافية" : "Geographic coverage"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/coverage/afrique"
                    className={`rounded-full px-3 py-2 text-sm transition-colors ${
                      coverage?.slug === "afrique"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/70"
                    }`}
                  >
                    {africaLabel}
                  </Link>
                  {AFRICAN_COVERAGE_ITEMS.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/coverage/${item.slug}`}
                      className={`rounded-full px-3 py-2 text-sm transition-colors ${
                        coverage?.slug === item.slug
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground hover:bg-secondary/70"
                      }`}
                    >
                      {getCoverageLabel(item, lang)}
                    </Link>
                  ))}
                  <Link
                    href="/coverage/international"
                    className={`rounded-full px-3 py-2 text-sm transition-colors ${
                      coverage?.slug === "international"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/70"
                    }`}
                  >
                    {internationalLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="container">
            {!coverage ? (
              <div className="rounded-2xl border border-border bg-card/50 p-10 text-center">
                <h2 className="text-2xl font-bold text-foreground">
                  {lang === "fr" ? "Rubrique introuvable" : lang === "ar" ? "القسم غير موجود" : "Section not found"}
                </h2>
                <p className="mt-3 text-muted-foreground">{t.common.noResults}</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card/50 p-10 text-center">
                <h2 className="text-2xl font-bold text-foreground">{coverageLabel}</h2>
                <p className="mt-3 text-muted-foreground">{t.common.noResults}</p>
              </div>
            ) : (
              <div className="space-y-10">
                {featuredArticle ? (
                  <motion.article
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <div className="grid gap-0 lg:grid-cols-[1.15fr_minmax(0,1fr)]">
                      <Link href={`/article/${featuredArticle.id}`} className="block h-full">
                        <div className="h-full min-h-[260px] overflow-hidden bg-secondary">
                          <img
                            src={featuredArticle.imageUrl || "/manus-storage/journalist-studio_a6c3b8b9.jpeg"}
                            alt={getLocalizedField(featuredArticle, "title", lang)}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </Link>
                      <div className="flex flex-col p-6 md:p-8">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            {coverageLabel}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(featuredArticle.publishedAt || featuredArticle.createdAt || Date.now()).toLocaleDateString(
                              lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR",
                            )}
                          </span>
                        </div>
                        <Link href={`/article/${featuredArticle.id}`} className="mt-4">
                          <h2 className="text-2xl font-bold leading-tight text-foreground transition-colors hover:text-gold md:text-3xl">
                            {getLocalizedField(featuredArticle, "title", lang)}
                          </h2>
                        </Link>
                        <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                          {getLocalizedField(featuredArticle, "excerpt", lang)}
                        </p>
                        <div className="mt-5">
                          <ArticleEngagementFooter article={featuredArticle} lang={lang} showMetrics={false} />
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ) : null}

                {coverage.slug === "afrique" ? (
                  <div className="rounded-2xl border border-border bg-card/40 p-5 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                          {lang === "fr" ? "Pays suivis" : lang === "ar" ? "الدول المتابعة" : "Tracked countries"}
                        </p>
                        <h3 className="mt-2 text-xl font-bold text-foreground">
                          {lang === "fr"
                            ? "Afrique prioritaire: Senegal d'abord, puis les autres marches strategiques"
                            : lang === "ar"
                              ? "أفريقيا أولا: السنغال ثم بقية الأسواق الاستراتيجية"
                              : "Africa first: Senegal, then the other strategic markets"}
                        </h3>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {AFRICAN_COVERAGE_ITEMS.map((item) => {
                        const count = countArticlesByCoverage(articles, item.slug);

                        return (
                          <Link
                            key={item.slug}
                            href={`/coverage/${item.slug}`}
                            className="rounded-xl border border-border bg-background/70 p-4 transition-colors hover:border-gold hover:bg-card"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-semibold text-foreground">{getCoverageLabel(item, lang)}</span>
                              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                                {count}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {getCoverageDescription(item, lang)}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {remainingArticles.map((article, index) => {
                    const category = categories.find((item) => item.id === article.categoryId);
                    const articleCoverage = AFRICAN_COVERAGE_ITEMS.find((item) => articleMatchesCoverage(article, item.slug));

                    return (
                      <motion.article
                        key={article.id}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.04 }}
                        className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-gold"
                      >
                        <Link href={`/article/${article.id}`} className="block">
                          <div className="aspect-[16/10] overflow-hidden bg-secondary">
                            <img
                              src={article.imageUrl || "/manus-storage/journalist-studio_a6c3b8b9.jpeg"}
                              alt={getLocalizedField(article, "title", lang)}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                        </Link>
                        <div className="p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            {articleCoverage ? (
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                                {getCoverageLabel(articleCoverage, lang)}
                              </span>
                            ) : null}
                            {category ? (
                              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                {getLocalizedField(category, "name", lang)}
                              </span>
                            ) : null}
                          </div>
                          <Link href={`/article/${article.id}`}>
                            <h3 className="mt-4 text-lg font-bold leading-7 text-foreground transition-colors hover:text-gold">
                              {getLocalizedField(article, "title", lang)}
                            </h3>
                          </Link>
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {getLocalizedField(article, "excerpt", lang)}
                          </p>
                          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                            <span>
                              {new Date(article.publishedAt || article.createdAt || Date.now()).toLocaleDateString(
                                lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR",
                              )}
                            </span>
                            <Link
                              href={`/article/${article.id}`}
                              className="inline-flex items-center gap-1 font-medium text-gold transition-colors hover:text-accent"
                            >
                              {lang === "fr" ? "Lire" : lang === "ar" ? "اقرأ" : "Read"}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
