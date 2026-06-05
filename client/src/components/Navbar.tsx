import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
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

export default function Navbar() {
  const { lang, setLang, t, rtl } = useLanguage();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: t.nav.home },
    { href: "/category/energie", label: t.nav.energy },
    { href: "/category/petrole-gaz", label: t.nav.oilGas },
    { href: "/category/renouvelables", label: t.nav.renewables },
    { href: "/category/economie", label: t.nav.economy },
    { href: "/category/investissements", label: t.nav.investments },
    { href: "/category/afrique", label: t.nav.africa },
    { href: "/category/moyen-orient", label: t.nav.middleEast },
    { href: "/category/geopolitique", label: t.nav.geopolitics },
    { href: "/category/portraits", label: t.nav.portraits },
    { href: "/category/experts", label: t.nav.experts },
    { href: "/category/chroniques", label: t.nav.columns },
    { href: "/events", label: t.nav.events },
    { href: "/about", label: t.nav.about },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="border-b border-border/50">
        <div className="container flex h-10 items-center justify-between text-xs text-muted-foreground">
          <a
            href={getContactMailto()}
            className="hidden transition-colors hover:text-foreground sm:block"
          >
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
          {navItems.slice(0, 8).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location === item.href
                  ? "bg-secondary text-gold"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="group relative">
            <button
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              type="button"
            >
              <span>+</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="invisible absolute right-0 top-full mt-1 min-w-[180px] rounded-md border border-border bg-card py-1 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
              {navItems.slice(8).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
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
            <nav className="container space-y-1 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                    location === item.href
                      ? "bg-secondary text-gold"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
