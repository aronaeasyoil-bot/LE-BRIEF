import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CONTACT_EMAIL, SITE_DESCRIPTION, getContactMailto } from "@/lib/site";

const privacyContent = {
  ar: {
    body: [
      "قد يجمع LE BRIEF المعلومات التي ترسلونها طوعا عبر النشرة البريدية او نماذج الاتصال او التفاعل مع المحتوى.",
      "تستخدم هذه البيانات فقط للتواصل معكم، ارسال التحديثات التحريرية، وتحسين تجربة الاستخدام على الموقع.",
      "لن يتم بيع بياناتكم الشخصية. يمكنكم طلب الوصول اليها او تصحيحها او حذفها عبر بريدنا الرسمي.",
    ],
    contact: "لطلب متعلق بالخصوصية:",
    title: "سياسة الخصوصية",
  },
  en: {
    body: [
      "LE BRIEF may collect information you voluntarily submit through newsletter subscriptions, contact requests, or interactions with our content.",
      "This information is used only to communicate with you, send editorial updates, and improve the website experience.",
      "Your personal data is not sold. You may request access, correction, or deletion by contacting our official email address.",
    ],
    contact: "Privacy request:",
    title: "Privacy Policy",
  },
  fr: {
    body: [
      "LE BRIEF peut collecter les informations que vous transmettez volontairement via la newsletter, les demandes de contact ou vos interactions avec le contenu.",
      "Ces donnees sont utilisees uniquement pour vous recontacter, vous envoyer les mises a jour editoriales et ameliorer l'experience du site.",
      "Vos donnees personnelles ne sont pas vendues. Vous pouvez demander leur acces, correction ou suppression via notre adresse officielle.",
    ],
    contact: "Demande relative a la confidentialite :",
    title: "Politique de confidentialite",
  },
} as const;

export default function PrivacyPage() {
  const { lang, rtl } = useLanguage();
  const content = privacyContent[lang];

  usePageMeta({
    description: SITE_DESCRIPTION,
    path: "/privacy",
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
            <a href={getContactMailto("Privacy request")} className="transition-colors hover:text-gold">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
