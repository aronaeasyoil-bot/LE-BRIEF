import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";

function getLocalizedField(item: any, field: string, lang: string): string {
  const key = `${field}${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
  return item[key] || item[`${field}Fr`] || "";
}

export default function EventsPage() {
  const { t, lang, rtl } = useLanguage();
  const { data: events, isLoading } = trpc.events.published.useQuery();

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />
      <main className="pt-[140px] pb-16">
        <div className="container">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t.event.upcoming}</h1>
            <div className="h-1 w-20 bg-primary rounded" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-card rounded-lg p-6">
                  <div className="h-48 bg-secondary rounded mb-4" />
                  <div className="h-6 bg-secondary rounded w-3/4 mb-2" />
                  <div className="h-4 bg-secondary rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-lg overflow-hidden group hover:border-gold transition-colors"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={event.imageUrl || "/manus-storage/journalist-conference_cf757215.jpeg"}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {getLocalizedField(event, "title", lang)}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {getLocalizedField(event, "description", lang)}
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gold" />
                        <span>{event.eventDate ? new Date(event.eventDate).toLocaleDateString(lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gold" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">{t.common.noResults}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
