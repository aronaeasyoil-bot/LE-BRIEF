import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const { t, rtl } = useLanguage();

  return (
    <motion.a
      href="https://whatsapp.com/channel/0029VaXXXXX"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 2, type: "spring" }}
      className={`fixed bottom-6 ${rtl ? 'left-6' : 'right-6'} z-50 group`}
    >
      <div className="relative">
        <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full" />
      </div>
      <div className={`absolute bottom-full ${rtl ? 'left-0' : 'right-0'} mb-2 px-3 py-1.5 bg-card border border-border rounded-md text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg`}>
        {t.whatsapp.join}
      </div>
    </motion.a>
  );
}
