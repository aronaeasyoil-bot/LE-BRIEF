import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Language } from "@/lib/i18n";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "./SearchBar";

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "FR" },
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      {/* Top bar */}
      <div className="border-b border-border/50">
        <div className="container flex items-center justify-between h-10 text-xs text-muted-foreground">
          <span className="hidden sm:block">Dubai - Sénégal | magazine.lebrief@gmail.com</span>
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{languages.find(l => l.code === lang)?.flag}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`absolute top-full mt-1 ${rtl ? 'left-0' : 'right-0'} bg-card border border-border rounded-md shadow-lg overflow-hidden min-w-[120px]`}
                  >
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code); setLangOpen(false); }}
                        className={`w-full px-3 py-2 text-left hover:bg-secondary transition-colors ${lang === l.code ? 'text-gold bg-secondary' : ''}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {user?.role === "admin" && (
              <Link href="/admin" className="text-gold hover:text-accent transition-colors">
                {t.nav.admin}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container flex items-center justify-between h-16 gap-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl font-bold font-sans tracking-tight">
            <span className="text-foreground">LE </span>
            <span className="text-primary">BRIEF</span>
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-xs">
          <SearchBar />
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.slice(0, 8).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                location === item.href
                  ? "text-gold bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {/* More dropdown for remaining items */}
          <div className="relative group">
            <button className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors flex items-center gap-1">
              <span>+</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[180px] py-1">
              {navItems.slice(8).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Mobile search button */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="md:hidden p-2 hover:bg-secondary rounded-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 hover:bg-secondary rounded-md transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile search */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-card/50 px-4 py-3"
          >
            <SearchBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-border bg-background overflow-hidden"
          >
            <nav className="container py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    location === item.href
                      ? "text-gold bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
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
