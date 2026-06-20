import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { X, Mail, Newspaper, TrendingUp, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  markNewsletterPopupDismissed,
  markNewsletterPopupSubscribed,
  shouldSuppressNewsletterPopup,
} from "@/lib/newsletter-popup";

const OPEN_DELAY_MS = 4000;
const AUTO_CLOSE_MS = 14000;

const popupText = {
  fr: {
    badge: "Newsletter quotidienne",
    title: "Recevez chaque jour l'actualite energetique africaine",
    subtitle:
      "Inscrivez-vous pour recevoir automatiquement dans votre boite mail les grands titres, analyses et opportunites de LE BRIEF.",
    emailLabel: "Votre e-mail",
    helper:
      "La fenetre se ferme seule si elle est ignoree. Vous pouvez aussi la fermer maintenant et elle ne reviendra pas tout de suite.",
    subscribe: "S'abonner gratuitement",
    benefits: [
      "Actualites energie et marches chaque jour",
      "Analyses LE BRIEF et signaux business",
      "Desinscription possible a tout moment",
    ],
    success: "Inscription reussie. La newsletter quotidienne LE BRIEF vous sera envoyee automatiquement.",
  },
  en: {
    badge: "Daily newsletter",
    title: "Receive African energy news every day",
    subtitle:
      "Subscribe to receive LE BRIEF headlines, analysis, and opportunities in your inbox automatically every day.",
    emailLabel: "Your email",
    helper:
      "This window closes automatically if ignored. You can also close it now and it will stay quiet for a while.",
    subscribe: "Subscribe for free",
    benefits: [
      "Daily energy and market headlines",
      "LE BRIEF analysis and business signals",
      "Unsubscribe at any time",
    ],
    success: "Subscription successful. The daily LE BRIEF newsletter will now be sent automatically.",
  },
  ar: {
    badge: "نشرة يومية",
    title: "استقبل اخبار الطاقة الافريقية كل يوم",
    subtitle:
      "اشترك ليصلك تلقائيا في بريدك الالكتروني ابرز عناوين LE BRIEF والتحليلات والفرص بشكل يومي.",
    emailLabel: "بريدك الالكتروني",
    helper:
      "ستغلق هذه النافذة تلقائيا اذا تم تجاهلها. ويمكنك ايضا اغلاقها الان ولن تعود مباشرة.",
    subscribe: "اشترك مجانا",
    benefits: [
      "اخر اخبار الطاقة والاسواق يوميا",
      "تحليلات LE BRIEF وفرص الاعمال",
      "امكانية الغاء الاشتراك في اي وقت",
    ],
    success: "تم الاشتراك بنجاح. ستصلك النشرة اليومية من LE BRIEF تلقائيا.",
  },
} as const;

function shouldHidePopupOnPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/magazine/") ||
    pathname === "/legal" ||
    pathname === "/privacy" ||
    pathname === "/404"
  );
}

function hasForcedPopupSearchParam() {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("newsletter") === "force";
}

export default function NewsletterPopup() {
  const { lang, rtl } = useLanguage();
  const [pathname] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const openTimerRef = useRef<number | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);
  const interactedRef = useRef(false);
  const text = popupText[lang as keyof typeof popupText] || popupText.fr;

  const clearOpenTimer = () => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };

  const clearAutoCloseTimer = () => {
    if (autoCloseTimerRef.current !== null) {
      window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  };

  const closePopup = (reason: "auto" | "manual" | "subscribed") => {
    clearOpenTimer();
    clearAutoCloseTimer();
    interactedRef.current = false;
    setIsOpen(false);

    if (reason === "subscribed") {
      markNewsletterPopupSubscribed();
    } else {
      markNewsletterPopupDismissed(reason);
    }
  };

  const markInteracted = () => {
    interactedRef.current = true;
    clearAutoCloseTimer();
  };

  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onError: () => {
      toast.error(lang === "fr" ? "Impossible de finaliser l'inscription." : lang === "ar" ? "تعذر اتمام الاشتراك." : "Unable to complete the subscription.");
    },
    onSuccess: () => {
      toast.success(text.success);
      setEmail("");
      closePopup("subscribed");
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    clearOpenTimer();
    clearAutoCloseTimer();
    setIsOpen(false);
    interactedRef.current = false;

    const forcePopup = hasForcedPopupSearchParam();

    if (shouldHidePopupOnPath(pathname) || (!forcePopup && shouldSuppressNewsletterPopup())) {
      return;
    }

    openTimerRef.current = window.setTimeout(() => {
      setIsOpen(true);
      autoCloseTimerRef.current = window.setTimeout(() => {
        if (!interactedRef.current) {
          closePopup("auto");
        }
      }, AUTO_CLOSE_MS);
    }, forcePopup ? 500 : OPEN_DELAY_MS);

    return () => {
      clearOpenTimer();
      clearAutoCloseTimer();
    };
  }, [pathname]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    markInteracted();
    if (!email.trim()) {
      return;
    }

    subscribeMutation.mutate({
      email: email.trim(),
      language: lang,
    });
  };

  const benefitsMarkup = (
    <div className="grid gap-3">
      {text.benefits.map((benefit, index) => {
        const Icon = index === 0 ? Newspaper : index === 1 ? TrendingUp : Clock3;
        return (
          <div
            key={benefit}
            className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
          >
            <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm leading-6 text-gray-200">{benefit}</p>
          </div>
        );
      })}
    </div>
  );

  const renderForm = (inputId: string) => (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-white" htmlFor={inputId}>
          {text.emailLabel}
        </label>
        <input
          id={inputId}
          type="email"
          value={email}
          onChange={(event) => {
            markInteracted();
            setEmail(event.target.value);
          }}
          placeholder="contact@lebrief.energy"
          required
          disabled={subscribeMutation.isPending}
          className="h-14 w-full rounded-xl border border-white/12 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition-colors focus:border-primary"
        />
        <button
          type="submit"
          disabled={subscribeMutation.isPending}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition-transform hover:translate-y-[-1px] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {text.subscribe}
        </button>
      </form>
      <p className="mt-4 text-xs leading-5 text-gray-400">{text.helper}</p>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePopup("manual");
            }
          }}
        >
          <motion.section
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.22 }}
            dir={rtl ? "rtl" : "ltr"}
            onMouseEnter={markInteracted}
            onFocusCapture={markInteracted}
            onPointerDown={markInteracted}
            className="relative grid max-h-[92vh] w-full max-w-6xl overflow-y-auto overflow-x-hidden rounded-[22px] border border-white/10 bg-[#05070c] shadow-[0_30px_80px_rgba(0,0,0,0.45)] lg:max-h-[90vh] lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]"
          >
            <button
              type="button"
              onClick={() => closePopup("manual")}
              className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75 sm:right-4 sm:top-4 sm:h-11 sm:w-11"
              aria-label="Close newsletter popup"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative flex items-center justify-center bg-white p-3 sm:p-5 lg:min-h-[260px] lg:p-8">
              <img
                src="/media/newsletter-popup-lebrief.jpg"
                alt="LE BRIEF newsletter promotion"
                className="w-full rounded-xl object-contain max-h-[34vh] sm:max-h-[40vh] lg:max-h-[72vh]"
              />
            </div>

            <div className="flex flex-col justify-between bg-[#05070c] p-5 sm:p-6 lg:p-10">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  <Mail className="h-3.5 w-3.5" />
                  {text.badge}
                </div>

                <h2 className="mt-4 text-[2rem] font-bold leading-tight text-white sm:mt-5 sm:text-3xl lg:text-4xl">
                  {text.title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-gray-300 sm:mt-4 sm:text-base">
                  {text.subtitle}
                </p>

                <div className="mt-5 lg:hidden">
                  {renderForm("newsletter-popup-email-mobile")}
                </div>

                <div className="mt-5 lg:mt-6">
                  {benefitsMarkup}
                </div>
              </div>

              <div className="mt-8 hidden lg:block">
                {renderForm("newsletter-popup-email-desktop")}
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
