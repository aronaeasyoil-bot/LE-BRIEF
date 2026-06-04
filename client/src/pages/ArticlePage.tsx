import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Facebook, Twitter, Linkedin, Clock, User } from "lucide-react";
import { toast } from "sonner";

function getLocalizedField(item: any, field: string, lang: string): string {
  const key = `${field}${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
  return item[key] || item[`${field}Fr`] || "";
}

export default function ArticlePage() {
  const { t, lang, rtl } = useLanguage();
  const params = useParams<{ id: string }>();
  const articleId = parseInt(params.id || "0");
  const { data: article, isLoading } = trpc.articles.byId.useQuery({ id: articleId }, { enabled: articleId > 0 });
  const { data: related } = trpc.articles.published.useQuery({});

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = article ? getLocalizedField(article, "title", lang) : "";
    let shareUrl = "";
    switch (platform) {
      case "facebook": shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`; break;
      case "twitter": shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`; break;
      case "linkedin": shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`; break;
      default: navigator.clipboard.writeText(url); toast.success("Link copied!"); return;
    }
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
        <Navbar />
        <div className="pt-[140px] container">
          <div className="animate-pulse space-y-4 max-w-3xl mx-auto">
            <div className="h-8 bg-secondary rounded w-3/4" />
            <div className="h-64 bg-secondary rounded" />
            <div className="h-4 bg-secondary rounded w-full" />
            <div className="h-4 bg-secondary rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />
      <main className="pt-[140px] pb-16">
        <div className="container max-w-4xl mx-auto">
          {/* Back button */}
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors mb-8 text-sm">
            <ArrowLeft className="w-4 h-4" />
            {t.common.back}
          </Link>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              {getLocalizedField(article, "title", lang)}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gold" />
                <span>{article.authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" />
                <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
              </div>
            </div>

            {/* Image */}
            {article.imageUrl && (
              <div className="aspect-[16/9] rounded-lg overflow-hidden mb-8">
                <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Excerpt */}
            <p className="text-lg text-muted-foreground italic border-l-4 border-gold pl-4 mb-8">
              {getLocalizedField(article, "excerpt", lang)}
            </p>

            {/* Content */}
            <div className="prose prose-invert max-w-none text-foreground/90 leading-relaxed text-base whitespace-pre-line mb-10">
              {getLocalizedField(article, "content", lang)}
            </div>

            {/* Share */}
            <div className="border-t border-border pt-6">
              <h4 className="text-sm font-semibold text-foreground mb-3 font-sans">{t.article.share}</h4>
              <div className="flex gap-3">
                <button onClick={() => handleShare("facebook")} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-blue-500 transition-colors">
                  <Facebook className="w-4 h-4" />
                </button>
                <button onClick={() => handleShare("twitter")} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-sky-400 transition-colors">
                  <Twitter className="w-4 h-4" />
                </button>
                <button onClick={() => handleShare("linkedin")} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-blue-600 transition-colors">
                  <Linkedin className="w-4 h-4" />
                </button>
                <button onClick={() => handleShare("copy")} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-gold transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.article>

          {/* Related Articles */}
          {related && related.length > 0 && (
            <section className="mt-16 pt-10 border-t border-border">
              <h3 className="text-2xl font-bold text-foreground mb-8">{t.article.related}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.filter(a => a.id !== article.id).slice(0, 3).map((rel) => (
                  <Link key={rel.id} href={`/article/${rel.id}`} className="group">
                    <div className="aspect-[16/10] rounded-lg overflow-hidden mb-3">
                      <img src={rel.imageUrl || "/manus-storage/journalist-studio_a6c3b8b9.jpeg"} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-2">
                      {getLocalizedField(rel, "title", lang)}
                    </h4>
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
