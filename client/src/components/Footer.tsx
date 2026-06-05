import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CONTACT_EMAIL,
  CONTACT_LOCATION,
  CONTACT_PHONE_DISPLAY,
  INSTAGRAM_URL,
  LINKEDIN_URL,
  getContactMailto,
} from "@/lib/site";
import { Linkedin, Instagram, Send } from "lucide-react";

export default function Footer() {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onError: () => {
      toast.error(t.common.error);
    },
    onSuccess: () => {
      toast.success(t.newsletter.success);
      setEmail("");
    },
  });

  const handleSubscribe = (event: React.FormEvent) => {
    event.preventDefault();

    if (email) {
      subscribeMutation.mutate({ email, language: lang });
    }
  };

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <span className="font-sans text-3xl font-bold tracking-tight">
                <span className="text-foreground">LE </span>
                <span className="text-primary">BRIEF</span>
              </span>
            </div>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t.footer.aboutText}
            </p>
            <div>
              <h4 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-foreground">
                {t.newsletter.title}
              </h4>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t.newsletter.placeholder}
                  className="flex-1 rounded-md border border-border bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
                <button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  aria-label={t.newsletter.subscribe}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wider text-foreground">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-gold">{t.nav.about}</Link></li>
              <li><Link href="/events" className="text-sm text-muted-foreground transition-colors hover:text-gold">{t.nav.events}</Link></li>
              <li><Link href="/category/energie" className="text-sm text-muted-foreground transition-colors hover:text-gold">{t.nav.energy}</Link></li>
              <li><Link href="/category/portraits" className="text-sm text-muted-foreground transition-colors hover:text-gold">{t.nav.portraits}</Link></li>
              <li><Link href="/legal" className="text-sm text-muted-foreground transition-colors hover:text-gold">{t.footer.legal}</Link></li>
              <li><Link href="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-gold">{t.footer.privacy}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wider text-foreground">
              {t.footer.contact}
            </h4>
            <ul className="mb-6 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href={getContactMailto()} className="transition-colors hover:text-gold">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>{CONTACT_PHONE_DISPLAY}</li>
              <li>{CONTACT_LOCATION}</li>
            </ul>
            <h4 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-foreground">
              {t.footer.followUs}
            </h4>
            <div className="flex gap-3">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-gold"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-gold"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <span>&copy; {new Date().getFullYear()} LE BRIEF. {t.footer.rights}.</span>
          <span>{t.footer.madeBy}</span>
        </div>
      </div>
    </footer>
  );
}
