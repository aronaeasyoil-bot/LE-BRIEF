import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { AFRICAN_COVERAGE_ITEMS, getCoverageLabel } from "@/lib/editorial";
import { Language } from "@/lib/i18n";
import { CONTACT_EMAIL, CONTACT_LOCATION, getContactMailto } from "@/lib/site";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "./SearchBar";

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "fr", label: "Francais", flag: "FR" },
  { code: "en", label: "English", flag: "EN" },
  { code: "ar", label: "العربية", flag: "AR" },
];

function isPathActive(location: string, href: string) {
  if (href === "/") {
    return location === "/";
  }

  return location === href || location.startsWith(`${href}/`);
}

export default function Navbar() {
  const { lang, setLang, t, rtl } = useLanguage();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [location] = useLocation();

  const journalLabel =
    lang === "fr" ? "Journal quotidien" : lang === "ar" ? "الصحيفة اليومية" : "Daily journal";
  const magazineLabel =
    lang === "fr" ? "Magazine hebdomadaire" : lang === "ar" ? "المجلة الأسبوعية" : "Weekly magazine";
  const internationalLabel =
    lang === "fr" ? "International" : lang === "ar" ? "الدولي" : "International";
  const sectorsLabel =
    lang === "fr" ? "Rubriques" : lang === "ar" ? "القطاعات" : "Sectors";
  const africaCountriesLabel =
    lang === "fr" ? "Pays suivis" : lang === "ar" ? "الدول المتابعة" : "Tracked countries";
  const exploreAfricaLabel =
    lang === "fr" ? "Toute l'Afrique" : lang === "ar" ? "كل أفريقيا" : "All Africa";
  const editionsLabel =
    lang === "fr" ? "Editions" : lang === "ar" ? "الإصدارات" : "Editions";

  const thematicLinks = [
    { href: "/category/energie", label: t.nav.energy },
    { href: "/category/petrole-gaz", label: t.nav.oilGas },
    { href: "/category/renouvelables", label: t.nav.renewables },
    { href: "/category/economie", label: t.nav.economy },
    { href: "/category/investissements", label: t.nav.investments },
    { href: "/category/experts", label: t.nav.experts },
    { href: "/category/chroniques", label: t.nav.columns },
    { href: "/category/portraits", label: t.nav.portraits },
  ];

  const africaLinks = [
    { href: "/coverage/afrique", label: exploreAfricaLabel },
    ...AFRICAN_COVERAGE_ITEMS.map((item) => ({
      href: `/coverage/${item.slug}`,
      label: getCoverageLabel(item, lang),
    })),
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="border-b border-border/50">
        <div className="container flex h-10 items-center justify-between text-xs text-muted-foreground">
          <a href={getContactMailto()} className="hidden transition-colors hover:text-foreground sm:block">
            {CONTACT_LOCATION} | {CONTACT_EMAIL}
          </a>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 transition-colors hover:text-foreground"
                type="button"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{languages.find((item) => item.code === lang)?.flag}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`absolute top-full mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-card shadow-lg ${
                      rtl ? "left-0" : "right-0"
                    }`}
                  >
                    {languages.map((item) => (
                      <button
                        key={item.code}
                        onClick={() => {
                          setLang(item.code);
                          setLangOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left transition-colors hover:bg-secondary ${
                          lang === item.code ? "bg-secondary text-gold" : ""
                        }`}
                        type="button"
                      >
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {user?.role === "admin" && (
              <Link href="/admin" className="text-gold transition-colors hover:text-accent">
                {t.nav.admin}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <span className="font-sans text-2xl font-bold tracking-tight">
            <span className="text-foreground">LE </span>
            <span className="text-primary">BRIEF</span>
          </span>
        </Link>

        <div className="hidden max-w-xs flex-1 md:flex">
          <SearchBar />
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            href="/"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              location === "/" ? "bg-secondary text-gold" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            {t.nav.home}
          </Link>
          <a
            href="/#journal-quotidien"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              location === "/" ? "text-foreground hover:bg-secondary/50" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            {journalLabel}
          </a>
          <a
            href="/#magazine-hebdomadaire"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              location === "/" ? "text-foreground hover:bg-secondary/50" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            {magazineLabel}
          </a>

          <div className="group relative">
            <button
              className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.startsWith("/coverage/") && !location.startsWith("/coverage/international")
                  ? "bg-secondary text-gold"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
              type="button"
            >
              <span>{t.nav.africa}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="invisible absolute left-0 top-full mt-1 min-w-[360px] rounded-xl border border-border bg-card p-4 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{africaCountriesLabel}</p>
              <div className="grid grid-cols-2 gap-2">
                {africaLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/coverage/international"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isPathActive(location, "/coverage/international")
                ? "bg-secondary text-gold"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            {internationalLabel}
          </Link>

          <div className="group relative">
            <button
              className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.startsWith("/category/")
                  ? "bg-secondary text-gold"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
              type="button"
            >
              <span>{sectorsLabel}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="invisible absolute right-0 top-full mt-1 min-w-[240px] rounded-xl border border-border bg-card py-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
              {thematicLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/events"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isPathActive(location, "/events")
                ? "bg-secondary text-gold"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            {t.nav.events}
          </Link>
          <Link
            href="/about"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isPathActive(location, "/about")
                ? "bg-secondary text-gold"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            {t.nav.about}
          </Link>
        </nav>

        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="rounded-md p-2 transition-colors hover:bg-secondary md:hidden"
          type="button"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 transition-colors hover:bg-secondary lg:hidden"
          type="button"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-card/50 px-4 py-3 md:hidden"
          >
            <SearchBar />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background lg:hidden"
          >
            <nav className="container space-y-5 py-4">
              <div className="space-y-1">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                    location === "/" ? "bg-secondary text-gold" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {t.nav.home}
                </Link>
              </div>

              <div>
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">{editionsLabel}</p>
                <div className="space-y-1">
                  <a
                    href="/#journal-quotidien"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                  >
                    {journalLabel}
                  </a>
                  <a
                    href="/#magazine-hebdomadaire"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                  >
                    {magazineLabel}
                  </a>
                </div>
              </div>

              <div>
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">{t.nav.africa}</p>
                <div className="space-y-1">
                  {africaLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                        isPathActive(location, item.href)
                          ? "bg-secondary text-gold"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">{internationalLabel}</p>
                <div className="space-y-1">
                  <Link
                    href="/coverage/international"
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                      isPathActive(location, "/coverage/international")
                        ? "bg-secondary text-gold"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    {internationalLabel}
                  </Link>
                </div>
              </div>

              <div>
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold">{sectorsLabel}</p>
                <div className="space-y-1">
                  {thematicLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                        isPathActive(location, item.href)
                          ? "bg-secondary text-gold"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/events"
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                      isPathActive(location, "/events")
                        ? "bg-secondary text-gold"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    {t.nav.events}
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                      isPathActive(location, "/about")
                        ? "bg-secondary text-gold"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    {t.nav.about}
                  </Link>
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
