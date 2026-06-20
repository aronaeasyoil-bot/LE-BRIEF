import type { Language } from "@/lib/i18n";

type LocalizedLabel = {
  ar: string;
  en: string;
  fr: string;
};

export type CoverageItem = {
  description: LocalizedLabel;
  keywords: string[];
  label: LocalizedLabel;
  slug: string;
};

type ArticleCoverageCandidate = {
  authorName?: string | null;
  contentAr?: string | null;
  contentEn?: string | null;
  contentFr?: string | null;
  excerptAr?: string | null;
  excerptEn?: string | null;
  excerptFr?: string | null;
  sourceName?: string | null;
  tags?: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
  titleFr?: string | null;
};

const AFRICA_GENERIC_KEYWORDS = [
  "afrique",
  "africa",
  "africain",
  "africaine",
  "african",
  "afrique de l'ouest",
  "west africa",
  "afrique centrale",
  "central africa",
];

export const AFRICAN_COVERAGE_ITEMS: CoverageItem[] = [
  {
    slug: "senegal",
    label: {
      fr: "Senegal",
      en: "Senegal",
      ar: "السنغال",
    },
    description: {
      fr: "Dakar, SENELEC, PETROSEN, GTA et les projets energetiques du Senegal.",
      en: "Dakar, SENELEC, PETROSEN, GTA and Senegal's energy projects.",
      ar: "داكار وسينيليك وبتروسن ومشاريع الطاقة في السنغال.",
    },
    keywords: ["senegal", "dakar", "senelec", "petrosen", "sangomar", "gta", "yakaar", "teranga"],
  },
  {
    slug: "cote-divoire",
    label: {
      fr: "Cote d'Ivoire",
      en: "Cote d'Ivoire",
      ar: "ساحل العاج",
    },
    description: {
      fr: "Abidjan, PETROCI et les grands projets energetiques ivoiriens.",
      en: "Abidjan, PETROCI and major Ivorian energy projects.",
      ar: "أبيدجان وبيتروسي والمشاريع الطاقية في ساحل العاج.",
    },
    keywords: ["cote d'ivoire", "cote d ivoire", "ivory coast", "abidjan", "petroci", "ivoir"],
  },
  {
    slug: "nigeria",
    label: {
      fr: "Nigeria",
      en: "Nigeria",
      ar: "نيجيريا",
    },
    description: {
      fr: "NNPC, Dangote, Abuja, Lagos et le marche nigerian.",
      en: "NNPC, Dangote, Abuja, Lagos and the Nigerian market.",
      ar: "إن إن بي سي ودانغوتي وأبوجا ولاغوس والسوق النيجيرية.",
    },
    keywords: ["nigeria", "abuja", "lagos", "nnpc", "dangote", "naira"],
  },
  {
    slug: "mauritanie",
    label: {
      fr: "Mauritanie",
      en: "Mauritania",
      ar: "موريتانيا",
    },
    description: {
      fr: "Nouakchott, GTA, Tortue Ahmeyim et les projets mauritaniens.",
      en: "Nouakchott, GTA, Tortue Ahmeyim and Mauritanian projects.",
      ar: "نواكشوط وغتا وتورتي أحميم والمشاريع الموريتانية.",
    },
    keywords: ["mauritanie", "mauritania", "nouakchott", "tortue ahmeyim", "gta", "birallah"],
  },
  {
    slug: "guinee",
    label: {
      fr: "Guinee",
      en: "Guinea",
      ar: "غينيا",
    },
    description: {
      fr: "Conakry, Simandou et les projets mineraux et energetiques de Guinee.",
      en: "Conakry, Simandou and Guinea's mining and energy projects.",
      ar: "كوناكري وسيماندو ومشاريع الطاقة والموارد في غينيا.",
    },
    keywords: ["guinee", "guinea", "conakry", "simandou"],
  },
  {
    slug: "mali",
    label: {
      fr: "Mali",
      en: "Mali",
      ar: "مالي",
    },
    description: {
      fr: "Bamako et les dossiers energie, mines et infrastructures du Mali.",
      en: "Bamako and Mali's energy, mining and infrastructure stories.",
      ar: "باماكو وملفات الطاقة والمناجم والبنى التحتية في مالي.",
    },
    keywords: ["mali", "bamako", "edm sa"],
  },
  {
    slug: "niger",
    label: {
      fr: "Niger",
      en: "Niger",
      ar: "النيجر",
    },
    description: {
      fr: "Niamey, petrole, pipeline et transitions energetiques au Niger.",
      en: "Niamey, oil, pipeline and energy transitions in Niger.",
      ar: "نيامي والنفط وخطوط الأنابيب والتحول الطاقي في النيجر.",
    },
    keywords: ["niger", "niamey", "cnpc niger", "agadem"],
  },
  {
    slug: "ghana",
    label: {
      fr: "Ghana",
      en: "Ghana",
      ar: "غانا",
    },
    description: {
      fr: "Accra, GNPC et les signaux du marche ghanéen.",
      en: "Accra, GNPC and signals from the Ghanaian market.",
      ar: "أكرا وGNPC وإشارات السوق الغانية.",
    },
    keywords: ["ghana", "accra", "gnpc", "tema"],
  },
  {
    slug: "cameroun",
    label: {
      fr: "Cameroun",
      en: "Cameroon",
      ar: "الكاميرون",
    },
    description: {
      fr: "Yaounde, Douala, SONARA et les projets camerounais.",
      en: "Yaounde, Douala, SONARA and Cameroonian projects.",
      ar: "ياوندي ودوالا وسونارا والمشاريع الكاميرونية.",
    },
    keywords: ["cameroun", "cameroon", "yaounde", "douala", "sonara"],
  },
  {
    slug: "rdc",
    label: {
      fr: "RDC",
      en: "DRC",
      ar: "الكونغو الديمقراطية",
    },
    description: {
      fr: "Kinshasa, cuivre, cobalt et energie en Republique democratique du Congo.",
      en: "Kinshasa, copper, cobalt and energy in the Democratic Republic of Congo.",
      ar: "كينشاسا والنحاس والكوبالت والطاقة في جمهورية الكونغو الديمقراطية.",
    },
    keywords: ["rdc", "drc", "kinshasa", "republique democratique du congo", "democratic republic of congo", "cobalt", "cuivre congo"],
  },
  {
    slug: "maroc",
    label: {
      fr: "Maroc",
      en: "Morocco",
      ar: "المغرب",
    },
    description: {
      fr: "Rabat, Casablanca et les projets industriels et energetiques du Maroc.",
      en: "Rabat, Casablanca and Morocco's industrial and energy projects.",
      ar: "الرباط والدار البيضاء والمشاريع الصناعية والطاقية في المغرب.",
    },
    keywords: ["maroc", "morocco", "rabat", "casablanca", "onhym"],
  },
  {
    slug: "algerie",
    label: {
      fr: "Algerie",
      en: "Algeria",
      ar: "الجزائر",
    },
    description: {
      fr: "Alger, Sonatrach et les grands mouvements du marche algerien.",
      en: "Algiers, Sonatrach and key moves in the Algerian market.",
      ar: "الجزائر العاصمة وسوناطراك والتحركات الكبرى في السوق الجزائرية.",
    },
    keywords: ["algerie", "algeria", "alger", "sonatrach"],
  },
  {
    slug: "egypte",
    label: {
      fr: "Egypte",
      en: "Egypt",
      ar: "مصر",
    },
    description: {
      fr: "Le Caire, GNL, gaz et electricite en Egypte.",
      en: "Cairo, LNG, gas and power in Egypt.",
      ar: "القاهرة والغاز الطبيعي المسال والغاز والكهرباء في مصر.",
    },
    keywords: ["egypte", "egypt", "caire", "cairo", "suez"],
  },
];

export const COVERAGE_ROOT_ITEMS: CoverageItem[] = [
  {
    slug: "afrique",
    label: {
      fr: "Afrique",
      en: "Africa",
      ar: "أفريقيا",
    },
    description: {
      fr: "Toute l'actualite energetique africaine, avec un accent prioritaire sur le Senegal.",
      en: "African energy coverage, with a priority focus on Senegal.",
      ar: "كل التغطية الطاقية الإفريقية مع أولوية واضحة للسنغال.",
    },
    keywords: AFRICA_GENERIC_KEYWORDS,
  },
  {
    slug: "international",
    label: {
      fr: "International",
      en: "International",
      ar: "الدولي",
    },
    description: {
      fr: "Moyen-Orient, Europe, Ameriques, Asie et les grands dossiers mondiaux.",
      en: "Middle East, Europe, the Americas, Asia and major global developments.",
      ar: "الشرق الأوسط وأوروبا والأميركيتان وآسيا والملفات العالمية الكبرى.",
    },
    keywords: ["international", "global", "worldwide", "middle east", "europe", "asia", "usa"],
  },
];

export const COVERAGE_ITEMS: CoverageItem[] = [
  COVERAGE_ROOT_ITEMS[0],
  ...AFRICAN_COVERAGE_ITEMS,
  COVERAGE_ROOT_ITEMS[1],
];

function getLocalizedValue(value: LocalizedLabel, lang: Language) {
  return value[lang] || value.fr;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildCoverageSearchText(article: ArticleCoverageCandidate) {
  const fields = [
    article.titleFr,
    article.titleEn,
    article.titleAr,
    article.excerptFr,
    article.excerptEn,
    article.excerptAr,
    article.contentFr,
    article.contentEn,
    article.contentAr,
    article.tags,
    article.sourceName,
    article.authorName,
  ];

  return normalizeText(
    fields
      .filter((field): field is string => typeof field === "string" && field.trim().length > 0)
      .join(" "),
  );
}

export function getCoverageBySlug(slug?: string | null) {
  return COVERAGE_ITEMS.find((item) => item.slug === slug) || null;
}

export function getCoverageLabel(item: CoverageItem, lang: Language) {
  return getLocalizedValue(item.label, lang);
}

export function getCoverageDescription(item: CoverageItem, lang: Language) {
  return getLocalizedValue(item.description, lang);
}

export function getArticleCoverageMatches(article: ArticleCoverageCandidate) {
  const searchText = buildCoverageSearchText(article);
  if (!searchText) {
    return ["international"];
  }

  const countryMatches = AFRICAN_COVERAGE_ITEMS.filter((item) =>
    item.keywords.some((keyword) => searchText.includes(normalizeText(keyword))),
  ).map((item) => item.slug);

  if (countryMatches.length > 0) {
    return Array.from(new Set(countryMatches));
  }

  const isAfricaWide = AFRICA_GENERIC_KEYWORDS.some((keyword) => searchText.includes(normalizeText(keyword)));
  if (isAfricaWide) {
    return ["afrique"];
  }

  return ["international"];
}

export function articleMatchesCoverage(article: ArticleCoverageCandidate, slug: string) {
  const matches = getArticleCoverageMatches(article);

  if (slug === "afrique") {
    return matches.some((match) => match !== "international");
  }

  if (slug === "international") {
    return matches.length === 1 && matches[0] === "international";
  }

  return matches.includes(slug);
}

export function filterArticlesByCoverage<TArticle extends ArticleCoverageCandidate>(articles: TArticle[], slug: string) {
  return articles.filter((article) => articleMatchesCoverage(article, slug));
}

export function countArticlesByCoverage<TArticle extends ArticleCoverageCandidate>(articles: TArticle[], slug: string) {
  return filterArticlesByCoverage(articles, slug).length;
}
