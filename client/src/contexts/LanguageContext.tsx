import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, Translations, getTranslation, isRTL } from "@/lib/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  rtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("le-brief-lang") as Language;
      if (saved && ["fr", "en", "ar"].includes(saved)) return saved;
    }
    return "fr";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("le-brief-lang", newLang);
  };

  const t = getTranslation(lang);
  const rtl = isRTL(lang);

  useEffect(() => {
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, rtl]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, rtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
