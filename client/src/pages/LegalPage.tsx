import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CONTACT_EMAIL, CONTACT_LOCATION, SITE_DESCRIPTION, getContactMailto } from "@/lib/site";

const legalContent = {
  ar: {
    body: [
      "LE BRIEF هو موقع إعلامي ومجلة رقمية متخصصة في الطاقة والاقتصاد والاستثمار.",
      "المحتويات المنشورة على الموقع مخصصة للمعلومات والتحليل ولا تشكل استشارة قانونية أو مالية أو استثمارية.",
      "لأي طلب قانوني أو تصحيح أو إزالة محتوى، يرجى التواصل معنا عبر البريد الإلكتروني الرسمي.",
    ],
    contact: "للمراسلات القانونية:",
    title: "الإشعار القانوني",
  },
  en: {
    body: [
      "LE BRIEF is a media website and digital magazine focused on energy, economy, investment, and strategic events.",
      "Content published on this website is provided for information and analysis purposes and does not constitute legal, financial, or investment advice.",
      "For legal notices, corrections, or takedown requests, please contact us through our official email address.",
    ],
    contact: "Legal correspondence:",
    title: "Legal Notice",
  },
  fr: {
    body: [
      "LE BRIEF est un site media et un magazine numerique consacre a l'energie, a l'economie, a l'investissement et aux evenements strategiques.",
      "Les contenus publies sur ce site sont fournis a titre informatif et analytique et ne constituent pas un conseil juridique, financier ou d'investissement.",
      "Pour toute demande legale, correction ou retrait de contenu, merci de nous contacter via notre adresse officielle.",
    ],
    contact: "Correspondance legale :",
    title: "Mentions legales",
  },
} as const;

export default function LegalPage() {
  const { lang, rtl } = useLanguage();
  const content = legalContent[lang];

  usePageMeta({
    description: SITE_DESCRIPTION,
    path: "/legal",
    title: content.title,
  });

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />
      <main className="container max-w-4xl pb-16 pt-[140px]">
        <h1 className="mb-6 text-4xl font-bold text-foreground">{content.title}</h1>
        <div className="space-y-4 rounded-lg border border-border bg-card p-8 text-sm leading-7 text-muted-foreground">
          {content.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div className="border-t border-border pt-4 text-foreground">
            <p className="mb-2 font-medium">{content.contact}</p>
            <a href={getContactMailto("Legal request")} className="transition-colors hover:text-gold">
              {CONTACT_EMAIL}
            </a>
            <p className="mt-2 text-sm text-muted-foreground">{CONTACT_LOCATION}</p>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
