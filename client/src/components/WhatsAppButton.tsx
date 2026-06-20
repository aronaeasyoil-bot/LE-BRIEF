import { useLanguage } from "@/contexts/LanguageContext";
import { getWhatsAppContactUrl } from "@/lib/site";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

const labels = {
  ar: "تواصل معنا على واتساب",
  en: "Contact us on WhatsApp",
  fr: "Contactez-nous sur WhatsApp",
} as const;

export default function WhatsAppButton() {
  const { lang, rtl } = useLanguage();
  const [pathname] = useLocation();

  if (pathname.startsWith("/magazine/")) {
    return null;
  }

  return (
    <motion.a
      href={getWhatsAppContactUrl(lang)}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 2, type: "spring" }}
      className={`group fixed bottom-6 z-50 ${rtl ? "left-6" : "right-6"}`}
      aria-label={labels[lang]}
    >
      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg transition-transform group-hover:scale-110">
          <MessageCircle className="h-7 w-7 text-white" />
        </div>
        <span className="absolute -right-1 -top-1 h-4 w-4 animate-ping rounded-full bg-accent" />
        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-accent" />
      </div>
      <div
        className={`absolute bottom-full mb-2 whitespace-nowrap rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 ${
          rtl ? "left-0" : "right-0"
        }`}
      >
        {labels[lang]}
      </div>
    </motion.a>
  );
}
