import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";

function getLocalizedField(item: any, field: string, lang: string): string {
  const key = `${field}${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
  return item[key] || item[`${field}Fr`] || "";
}

export default function CategoryPage() {
  const { t, lang, rtl } = useLanguage();
  const params = useParams<{ slug: string }>();
  const { data: categories } = trpc.categories.list.useQuery();
  const category = categories?.find(c => c.slug === params.slug);
  const { data: articles } = trpc.articles.byCategory.useQuery(
    { categoryId: category?.id || 0 },
    { enabled: !!category }
  );

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />
      <main className="pt-[140px] pb-16">
        <div className="container">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {category ? getLocalizedField(category, "name", lang) : params.slug}
            </h1>
            <div className="h-1 w-20 bg-primary rounded" />
          </div>

          {/* Articles Grid */}
          {articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, i) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                  <Link href={`/article/${article.id}`} className="block">
                    <div className="aspect-[16/10] rounded-lg overflow-hidden mb-4 border border-border">
                      <img
                        src={article.imageUrl || "/manus-storage/journalist-studio_a6c3b8b9.jpeg"}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-gold transition-colors line-clamp-2 mb-2">
                      {getLocalizedField(article, "title", lang)}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {getLocalizedField(article, "excerpt", lang)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-gold">{article.authorName}</span>
                      <span>•</span>
                      <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR") : ""}</span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">{t.common.noResults}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
