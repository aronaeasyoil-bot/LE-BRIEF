import { CalendarDays, Eye, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatArticleMetric,
  getArticleEditionDate,
  getArticleEngagementMetrics,
  type ArticleEngagementSource,
} from "@/lib/article-engagement";

type ArticleEngagementFooterProps = {
  article: ArticleEngagementSource;
  className?: string;
  lang: string;
  showMetrics?: boolean;
  tone?: "default" | "inverse";
};

const labels = {
  ar: {
    edition: "الإصدار",
    likes: "إعجاب",
    shares: "مشاركة",
    views: "مشاهدات",
  },
  en: {
    edition: "Edition",
    likes: "Likes",
    shares: "Shares",
    views: "Views",
  },
  fr: {
    edition: "Edition",
    likes: "Aimer",
    shares: "Partages",
    views: "Vues",
  },
} as const;

export default function ArticleEngagementFooter({
  article,
  className,
  lang,
  showMetrics = true,
  tone = "default",
}: ArticleEngagementFooterProps) {
  const text = labels[lang as keyof typeof labels] || labels.fr;
  const editionDate = getArticleEditionDate(article.publishedAt, lang);
  const metrics = getArticleEngagementMetrics(article);
  const inverse = tone === "inverse";

  return (
    <div className={cn("mt-4 space-y-3", className)}>
      {editionDate ? (
        <div
          className={cn(
            "flex items-center gap-2 text-xs",
            inverse ? "text-white/75" : "text-muted-foreground",
          )}
        >
          <CalendarDays className="h-4 w-4 text-gold" />
          <span>
            {text.edition} {editionDate}
          </span>
        </div>
      ) : null}

      {showMetrics ? (
        <div
          className={cn(
            "grid grid-cols-3 gap-2 rounded-2xl border px-3 py-3",
            inverse
              ? "border-white/10 bg-black/35 backdrop-blur-sm"
              : "border-border/70 bg-card/70",
          )}
        >
          <MetricItem
            icon={<Eye className="h-4 w-4 text-blue-400" />}
            srLabel={text.views}
            tone={tone}
            value={formatArticleMetric(metrics.views)}
          />
          <MetricItem
            icon={<Share2 className="h-4 w-4 text-green-400" />}
            srLabel={text.shares}
            tone={tone}
            value={formatArticleMetric(metrics.shares)}
          />
          <MetricItem
            icon={<Heart className="h-4 w-4 text-red-400" />}
            srLabel={text.likes}
            tone={tone}
            value={formatArticleMetric(metrics.likes)}
          />
        </div>
      ) : null}
    </div>
  );
}

function MetricItem({
  icon,
  srLabel,
  tone,
  value,
}: {
  icon: React.ReactNode;
  srLabel: string;
  tone: "default" | "inverse";
  value: string;
}) {
  return (
    <div
      aria-label={srLabel}
      className="flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-1.5"
      title={srLabel}
    >
      <span className="shrink-0">{icon}</span>
      <div
        className={cn(
          "text-sm font-semibold",
          tone === "inverse" ? "text-white" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
