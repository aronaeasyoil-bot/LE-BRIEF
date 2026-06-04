import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { motion } from "framer-motion";
import { Target, Eye, Users, Globe, Award, Zap, MessageCircle, Mail, Phone, MapPin } from "lucide-react";

const aboutContent = {
  fr: {
    title: "À propos de LE BRIEF",
    intro: "LE BRIEF est une plateforme médiatique spécialisée et une institution de presse de premier plan dédiée à la diffusion d'intelligence stratégique dans le secteur énergétique, les ressources naturelles et les dynamiques économiques mondiales. Opérant à la fois comme un magazine analytique hebdomadaire et un média d'information en temps réel, LE BRIEF produit et diffuse une information fiable, pertinente et à haute valeur ajoutée destinée aux décideurs.",
    missionTitle: "Notre Mission",
    missionText: "Délivrer une intelligence stratégique, fiable et en temps réel sur l'ensemble du secteur énergétique, permettant aux décideurs, investisseurs et institutions de prendre des décisions éclairées et d'acquérir une compréhension approfondie des dynamiques de marché.",
    visionTitle: "Notre Vision",
    visionText: "Devenir une plateforme de référence en Afrique et au Moyen-Orient, combinant médias et événements, avec la capacité de connecter les acteurs clés de l'énergie, de débloquer des opportunités d'investissement et de façonner les dynamiques du secteur.",
    numbersTitle: "LE BRIEF en chiffres",
    audienceTitle: "Notre Audience",
    audienceText: "Décideurs, cadres dirigeants, ministères, entreprises énergétiques et investisseurs à travers l'Afrique de l'Ouest, l'Afrique centrale, le Moyen-Orient (Dubaï) et l'Europe.",
    contentTitle: "Nos Contenus",
    contents: [
      "Actualités quotidiennes (veille stratégique, breaking news, analyses rapides)",
      "Éditions hebdomadaires approfondies",
      "Profils de dirigeants (Portrait Eco)",
      "Analyses sectorielles approfondies",
      "Vitrines d'entreprises",
      "Forums de haut niveau, conférences et rassemblements stratégiques",
    ],
    ceoQuote: "Dans l'énergie comme dans l'information, ceux qui anticipent éclairent le monde — les autres ne font que suivre.",
    ceoName: "Arona FALL",
    ceoRole: "Fondateur & CEO",
    contactTitle: "Contact",
  },
  en: {
    title: "About LE BRIEF",
    intro: "LE BRIEF is a specialized media platform and a leading press institution dedicated to delivering strategic intelligence across the energy sector, natural resources, and global economic dynamics. Operating both as a weekly analytical magazine and a real-time news outlet, LE BRIEF produces and disseminates reliable, relevant, and high-value information tailored to decision-makers.",
    missionTitle: "Our Mission",
    missionText: "To deliver strategic, reliable, and real-time intelligence across the entire energy sector, empowering decision-makers, investors, and institutions to make informed decisions and gain a deeper understanding of market dynamics.",
    visionTitle: "Our Vision",
    visionText: "To become a leading platform across Africa and the Middle East, seamlessly combining media and events, with the ability to connect key energy stakeholders, unlock investment opportunities, and shape the dynamics of the sector.",
    numbersTitle: "LE BRIEF in Numbers",
    audienceTitle: "Our Audience",
    audienceText: "Decision-makers, senior executives, government ministries, energy companies, and investors across West Africa, Central Africa, the Middle East (Dubai), and Europe.",
    contentTitle: "Our Content",
    contents: [
      "Daily news (strategic monitoring, breaking news, rapid analysis)",
      "Weekly in-depth editions",
      "Executive profiles (Portrait Eco)",
      "In-depth sector analyses",
      "Company showcases",
      "High-level forums, conferences, and strategic gatherings",
    ],
    ceoQuote: "In both energy and information, those who anticipate illuminate the world — others simply follow.",
    ceoName: "Arona FALL",
    ceoRole: "Founder & CEO",
    contactTitle: "Contact",
  },
  ar: {
    title: "عن لو بريف",
    intro: "لو بريف هي منصة إعلامية متخصصة ومؤسسة صحفية رائدة مكرسة لتقديم الذكاء الاستراتيجي في قطاع الطاقة والموارد الطبيعية والديناميكيات الاقتصادية العالمية. تعمل كمجلة تحليلية أسبوعية ومنصة أخبار فورية، وتنتج وتنشر معلومات موثوقة وذات قيمة عالية موجهة لصناع القرار.",
    missionTitle: "مهمتنا",
    missionText: "تقديم معلومات استراتيجية موثوقة وفورية عبر قطاع الطاقة بأكمله، لتمكين صناع القرار والمستثمرين والمؤسسات من اتخاذ قرارات مستنيرة وفهم أعمق لديناميكيات السوق.",
    visionTitle: "رؤيتنا",
    visionText: "أن نصبح منصة رائدة في أفريقيا والشرق الأوسط، تجمع بسلاسة بين الإعلام والفعاليات، مع القدرة على ربط أصحاب المصلحة الرئيسيين في مجال الطاقة وفتح فرص الاستثمار وتشكيل ديناميكيات القطاع.",
    numbersTitle: "لو بريف بالأرقام",
    audienceTitle: "جمهورنا",
    audienceText: "صناع القرار، كبار المديرين التنفيذيين، الوزارات الحكومية، شركات الطاقة والمستثمرون عبر غرب أفريقيا ووسط أفريقيا والشرق الأوسط (دبي) وأوروبا.",
    contentTitle: "محتوياتنا",
    contents: [
      "أخبار يومية (مراقبة استراتيجية، أخبار عاجلة، تحليلات سريعة)",
      "إصدارات أسبوعية معمقة",
      "ملفات تعريف المديرين التنفيذيين (بورتريه إيكو)",
      "تحليلات قطاعية معمقة",
      "واجهات الشركات",
      "منتديات رفيعة المستوى، مؤتمرات وتجمعات استراتيجية",
    ],
    ceoQuote: "في الطاقة كما في المعلومات، من يستبق ينير العالم — والآخرون يتبعون فحسب.",
    ceoName: "أرونا فال",
    ceoRole: "المؤسس والرئيس التنفيذي",
    contactTitle: "اتصل بنا",
  },
};

export default function AboutPage() {
  const { lang, rtl } = useLanguage();
  const content = aboutContent[lang];

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />
      <main className="pt-[140px] pb-16">
        <div className="container max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{content.title}</h1>
            <div className="h-1 w-20 bg-primary rounded mx-auto mb-8" />
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">{content.intro}</p>
          </motion.div>

          {/* CEO Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-gold/30 rounded-lg p-8 mb-16 text-center"
          >
            <blockquote className="text-xl md:text-2xl italic text-gold font-serif mb-4">
              "{content.ceoQuote}"
            </blockquote>
            <p className="text-foreground font-bold">{content.ceoName}</p>
            <p className="text-sm text-muted-foreground">{content.ceoRole}</p>
          </motion.div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-lg p-8"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">{content.missionTitle}</h2>
              <p className="text-muted-foreground leading-relaxed">{content.missionText}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-lg p-8"
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-gold" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">{content.visionTitle}</h2>
              <p className="text-muted-foreground leading-relaxed">{content.visionText}</p>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-lg p-10 mb-16"
          >
            <h2 className="text-2xl font-bold text-foreground text-center mb-10">{content.numbersTitle}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { icon: <Users className="w-5 h-5" />, value: "+22K", label: lang === "fr" ? "Lecteurs qualifiés" : lang === "en" ? "Qualified Readers" : "قارئ مؤهل" },
                { icon: <Award className="w-5 h-5" />, value: "80%", label: lang === "fr" ? "Audience professionnelle" : lang === "en" ? "Professional Audience" : "جمهور مهني" },
                { icon: <Globe className="w-5 h-5" />, value: "+15", label: lang === "fr" ? "Pays couverts" : lang === "en" ? "Countries" : "دولة" },
                { icon: <Zap className="w-5 h-5" />, value: "75%", label: lang === "fr" ? "Taux de couverture" : lang === "en" ? "Coverage Rate" : "معدل التغطية" },
                { icon: <MessageCircle className="w-5 h-5" />, value: "+1,500", label: lang === "fr" ? "Abonnés WhatsApp" : lang === "en" ? "WhatsApp Subscribers" : "مشترك واتساب" },
                { icon: <Eye className="w-5 h-5" />, value: "15K", label: lang === "fr" ? "Vues/jour" : lang === "en" ? "Daily Views" : "مشاهدة/يوم" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2 text-gold">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gold mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Audience */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">{content.audienceTitle}</h2>
            <p className="text-muted-foreground leading-relaxed">{content.audienceText}</p>
          </motion.div>

          {/* Content Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">{content.contentTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.contents.map((item, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 hover:border-gold transition-colors">
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Office Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-lg overflow-hidden border border-border mb-16"
          >
            <img
              src="/manus-storage/office-reception_c87f87db.jpeg"
              alt="Le Brief Office"
              className="w-full h-64 md:h-96 object-cover"
            />
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-lg p-8"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">{content.contactTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="text-foreground text-sm">+971 55 442 0793</p>
                  <p className="text-foreground text-sm">054 333 8520</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="text-foreground text-sm">magazine.lebrief@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold mt-0.5" />
                <div>
                  <p className="text-foreground text-sm">Dubai - Sénégal</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
