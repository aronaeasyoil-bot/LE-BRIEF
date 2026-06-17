import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import ArticleEngagementFooter from "@/components/ArticleEngagementFooter";
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
  const category = categories?.find((c) => c.slug === params.slug);
  const { data: articles } = trpc.articles.byCategory.useQuery(
    { categoryId: category?.id || 0 },
    { enabled: !!category },
  );

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />
      <main className="pb-16 pt-[140px]">
        <div className="container">
          <div className="mb-12">
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              {category ? getLocalizedField(category, "name", lang) : params.slug}
            </h1>
            <div className="h-1 w-20 rounded bg-primary" />
          </div>

          {articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                    <div className="mb-4 aspect-[16/10] overflow-hidden rounded-lg border border-border">
                      <img
                        src={article.imageUrl || "/manus-storage/journalist-studio_a6c3b8b9.jpeg"}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="mb-2 line-clamp-2 text-lg font-bold text-foreground transition-colors group-hover:text-gold">
                      {getLocalizedField(article, "title", lang)}
                    </h3>
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                      {getLocalizedField(article, "excerpt", lang)}
                    </p>
                    <ArticleEngagementFooter article={article} lang={lang} />
                  </Link>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">{t.common.noResults}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
