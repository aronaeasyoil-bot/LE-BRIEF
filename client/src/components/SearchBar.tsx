import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Link } from "wouter";
import type { InferSelectModel } from "drizzle-orm";
import type { articles } from "../../../drizzle/schema";

type Article = InferSelectModel<typeof articles>;

function getLocalizedField(item: any, field: string, lang: string): string {
  const key = `${field}${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
  return item[key] || item[`${field}Fr`] || "";
}

export default function SearchBar() {
  const { lang, rtl } = useLanguage();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: results } = trpc.articles.search.useQuery(
    { query },
    { enabled: query.length > 2 }
  );

  return (
    <div className="relative w-full max-w-md" dir={rtl ? "rtl" : "ltr"}>
      <div className="relative">
        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${rtl ? "right-3" : "left-3"}`} />
        <input
          type="text"
          placeholder={lang === "fr" ? "Rechercher..." : lang === "en" ? "Search..." : "بحث..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`w-full bg-secondary border border-border rounded-lg py-2 ${rtl ? "pr-10 pl-3" : "pl-10 pr-3"} text-sm placeholder-muted-foreground focus:outline-none focus:border-gold transition-colors`}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className={`absolute top-1/2 -translate-y-1/2 ${rtl ? "left-3" : "right-3"}`}
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.length > 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
                {results && results.length > 0 ? (
              <div className="divide-y divide-border">
                {results.map((article: Article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.id}`}
                    onClick={() => {
                      setQuery("");
                      setIsOpen(false);
                    }}
                    className="block p-3 hover:bg-secondary/50 transition-colors"
                  >
                    <h4 className="font-medium text-sm text-foreground line-clamp-1">
                      {getLocalizedField(article as any, "title", lang)}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {getLocalizedField(article as any, "excerpt", lang)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {lang === "fr" ? "Aucun résultat" : lang === "en" ? "No results" : "لا توجد نتائج"}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
