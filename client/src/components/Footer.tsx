import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Linkedin, Instagram, Send } from "lucide-react";

export default function Footer() {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      toast.success(t.newsletter.success);
      setEmail("");
    },
    onError: () => {
      toast.error(t.common.error);
    },
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      subscribeMutation.mutate({ email, language: lang });
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <span className="text-3xl font-bold font-sans tracking-tight">
                <span className="text-foreground">LE </span>
                <span className="text-primary">BRIEF</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-md">
              {t.footer.aboutText}
            </p>
            {/* Newsletter */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 font-sans uppercase tracking-wider">
                {t.newsletter.title}
              </h4>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.newsletter.placeholder}
                  className="flex-1 px-4 py-2.5 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
                <button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4 font-sans uppercase tracking-wider">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-gold transition-colors">{t.nav.about}</Link></li>
              <li><Link href="/events" className="text-sm text-muted-foreground hover:text-gold transition-colors">{t.nav.events}</Link></li>
              <li><Link href="/category/energie" className="text-sm text-muted-foreground hover:text-gold transition-colors">{t.nav.energy}</Link></li>
              <li><Link href="/category/portraits" className="text-sm text-muted-foreground hover:text-gold transition-colors">{t.nav.portraits}</Link></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-gold transition-colors">{t.footer.legal}</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-gold transition-colors">{t.footer.privacy}</a></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4 font-sans uppercase tracking-wider">
              {t.footer.contact}
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground mb-6">
              <li>magazine.lebrief@gmail.com</li>
              <li>+971 55 442 0793</li>
              <li>Dubai - Sénégal</li>
            </ul>
            <h4 className="text-sm font-semibold text-foreground mb-3 font-sans uppercase tracking-wider">
              {t.footer.followUs}
            </h4>
            <div className="flex gap-3">
              <a
                href="https://www.linkedin.com/company/magazinelebrief/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-secondary/80 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/mag_lebrief"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-secondary/80 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} LE BRIEF. {t.footer.rights}.</span>
          <span>{t.footer.madeBy}</span>
        </div>
      </div>
    </footer>
  );
}
