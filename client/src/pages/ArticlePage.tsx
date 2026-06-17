import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ArticleEngagementFooter from "@/components/ArticleEngagementFooter";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Facebook, Twitter, Linkedin, Clock, User, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { shareLink, type SharePlatform } from "@/lib/share";
import { PREVIEW_IMAGE_URL, SITE_DESCRIPTION, getSiteUrl } from "@/lib/site";
import { usePageMeta } from "@/hooks/usePageMeta";

function getLocalizedField(item: any, field: string, lang: string): string {
  const key = `${field}${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
  return item[key] || item[`${field}Fr`] || "";
}

function parseTags(value?: string | null) {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function ArticlePage() {
  const { t, lang, rtl } = useLanguage();
  const params = useParams<{ id: string }>();
  const articleId = parseInt(params.id || "0", 10);
  const { data: article, isLoading } = trpc.articles.byId.useQuery({ id: articleId }, { enabled: articleId > 0 });
  const { data: related } = trpc.articles.published.useQuery({});

  const articleTitle = article ? getLocalizedField(article, "title", lang) : "";
  const articleExcerpt = article ? getLocalizedField(article, "excerpt", lang) : "";
  const articleTags = parseTags(article?.tags);
  const articleUrl = article ? getSiteUrl(`/article/${article.id}`) : getSiteUrl(`/article/${articleId || ""}`);

  usePageMeta({
    description: article?.metaDescription || articleExcerpt || SITE_DESCRIPTION,
    image: article?.imageUrl || PREVIEW_IMAGE_URL,
    path: article ? `/article/${article.id}` : `/article/${articleId}`,
    title: articleTitle || t.article.readMore,
    type: "article",
  });

  const handleShare = async (platform: SharePlatform) => {
    try {
      const result = await shareLink(platform, {
        text: articleExcerpt || SITE_DESCRIPTION,
        title: articleTitle,
        url: articleUrl,
      });

      if (result === "copied") {
        toast.success(lang === "fr" ? "Lien copie" : lang === "ar" ? "تم نسخ الرابط" : "Link copied");
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
          <div className="mx-auto max-w-3xl animate-pulse space-y-4">
            <div className="h-8 w-3/4 rounded bg-secondary" />
            <div className="h-64 rounded bg-secondary" />
            <div className="h-4 w-full rounded bg-secondary" />
            <div className="h-4 w-5/6 rounded bg-secondary" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />
      <main className="pb-16 pt-[140px]">
        <div className="container mx-auto max-w-4xl">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold">
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </Link>

          <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="mb-6 text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
              {articleTitle}
            </h1>

            <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gold" />
                <span>{article.authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold" />
                <span>
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString(
                        lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR",
                        { day: "numeric", month: "long", year: "numeric" }
                      )
                    : ""}
                </span>
              </div>
            </div>

            {article.imageUrl && (
              <div className="mb-8 aspect-[16/9] overflow-hidden rounded-lg">
                <img src={article.imageUrl} alt={articleTitle} className="h-full w-full object-cover" />
              </div>
            )}

            <p className="mb-8 border-l-4 border-gold pl-4 text-lg italic text-muted-foreground">
              {articleExcerpt}
            </p>

            {(article.sourceName || article.sourceUrl) && (
              <div className="mb-8 rounded-lg border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Source initiale :</span>{" "}
                  {article.sourceUrl ? (
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-gold hover:underline"
                    >
                      {article.sourceName || article.sourceUrl}
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">{article.sourceName}</span>
                  )}
                </p>
              </div>
            )}

            <div className="prose prose-invert mb-10 max-w-none whitespace-pre-line text-base leading-relaxed text-foreground/90">
              {getLocalizedField(article, "content", lang)}
            </div>

            {articleTags.length > 0 && (
              <div className="mb-10 flex flex-wrap gap-2">
                {articleTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mb-10 rounded-3xl border border-border bg-card/60 p-6">
              <ArticleEngagementFooter article={article} lang={lang} />
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="mb-3 font-sans text-sm font-semibold text-foreground">{t.article.share}</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleShare("native")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-gold"
                  title={t.article.share}
                  aria-label={t.article.share}
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShare("facebook")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-blue-500"
                  title="Facebook"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShare("twitter")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-sky-400"
                  title="X"
                  aria-label="X"
                >
                  <Twitter className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShare("linkedin")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-blue-600"
                  title="LinkedIn"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShare("whatsapp")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-green-500"
                  title="WhatsApp"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShare("copy")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-gold"
                  title={lang === "fr" ? "Copier le lien" : lang === "ar" ? "نسخ الرابط" : "Copy link"}
                  aria-label={lang === "fr" ? "Copier le lien" : lang === "ar" ? "نسخ الرابط" : "Copy link"}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.article>

          {related && related.length > 0 && (
            <section className="mt-16 border-t border-border pt-10">
              <h3 className="mb-8 text-2xl font-bold text-foreground">{t.article.related}</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {related
                  .filter((item) => item.id !== article.id)
                  .slice(0, 3)
                  .map((item) => (
                    <Link key={item.id} href={`/article/${item.id}`} className="group">
                      <div className="mb-3 aspect-[16/10] overflow-hidden rounded-lg">
                        <img
                          src={item.imageUrl || "/manus-storage/journalist-studio_a6c3b8b9.jpeg"}
                          alt={getLocalizedField(item, "title", lang)}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <h4 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-gold">
                        {getLocalizedField(item, "title", lang)}
                      </h4>
                      <ArticleEngagementFooter article={item} className="mt-3" lang={lang} />
                    </Link>
                  ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
