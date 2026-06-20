import { useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Lock, Smartphone, Upload } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ProofPayload = {
  dataBase64: string;
  fileName: string;
  mimeType: string;
  size: number;
};

type Props = {
  magazineId: number;
  previewPageCount: number;
  priceFcfa: number;
  waveNumber: string;
  waveQrImageUrl: string;
};

const cardText = {
  ar: {
    accepted: "تم إرسال طلبك. ستتلقى رابط فتح المجلة بعد التحقق من الدفع.",
    button: "ارسال اثبات الدفع",
    email: "البريد الإلكتروني",
    file: "إثبات الدفع",
    helper: "بعد الصفحة الثالثة، يتم فتح بقية المجلة بعد دفع 1000 FCFA عبر Wave ثم التحقق اليدوي.",
    name: "الاسم الكامل",
    phone: "رقم واتساب",
    price: "سعر فتح المجلة",
    stepsTitle: "خطوات سريعة",
    step1: "امسح رمز QR أو ادفع مباشرة على رقم Wave أدناه.",
    step2: "التقط صورة أو لقطة شاشة لإثبات الدفع.",
    step3: "أرسل البيانات لتلقي رابط الفتح عبر البريد الإلكتروني.",
    subtitle: "اقرأ العدد الكامل بعد التحقق من الدفع.",
    title: "فتح المجلة الكاملة",
    uploadPlaceholder: "أضف لقطة شاشة أو صورة لإثبات الدفع",
    waveNumber: "رقم Wave",
  },
  en: {
    accepted: "Your request has been sent. You will receive the unlock link after payment validation.",
    button: "Send payment proof",
    email: "Email address",
    file: "Payment proof",
    helper: "After page three, the rest of the magazine is unlocked after a 1000 FCFA Wave payment and manual validation.",
    name: "Full name",
    phone: "WhatsApp number",
    price: "Unlock price",
    stepsTitle: "Quick steps",
    step1: "Scan the QR code or pay directly to the Wave number below.",
    step2: "Take a screenshot or photo of the payment proof.",
    step3: "Send your details to receive the unlock link by email.",
    subtitle: "Read the full issue after payment validation.",
    title: "Unlock the full magazine",
    uploadPlaceholder: "Add a screenshot or photo of the payment proof",
    waveNumber: "Wave number",
  },
  fr: {
    accepted: "Votre demande a été envoyée. Vous recevrez le lien de déblocage après validation du paiement.",
    button: "Envoyer la preuve de paiement",
    email: "Adresse email",
    file: "Preuve de paiement",
    helper: "Après la troisième page, le reste du magazine se débloque après un paiement Wave de 1000 FCFA puis une validation manuelle.",
    name: "Nom complet",
    phone: "Numéro WhatsApp",
    price: "Prix du déblocage",
    stepsTitle: "Étapes rapides",
    step1: "Scannez le QR code ou payez directement sur le numéro Wave ci-dessous.",
    step2: "Prenez une capture d'écran ou une photo de la preuve de paiement.",
    step3: "Envoyez vos informations pour recevoir le lien de déblocage par email.",
    subtitle: "Lisez l'intégralité du numéro après validation du paiement.",
    title: "Débloquer le magazine complet",
    uploadPlaceholder: "Ajoutez une capture d'écran ou une photo de votre preuve",
    waveNumber: "Numéro Wave",
  },
} as const;

async function fileToProofPayload(file: File): Promise<ProofPayload> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

  return {
    dataBase64: dataUrl.split(",")[1] || "",
    fileName: file.name,
    mimeType: file.type || "image/jpeg",
    size: file.size,
  };
}

export default function MagazineUnlockCard({
  magazineId,
  previewPageCount,
  priceFcfa,
  waveNumber,
  waveQrImageUrl,
}: Props) {
  const { lang } = useLanguage();
  const text = cardText[lang as keyof typeof cardText] || cardText.fr;
  const requestMutation = trpc.magazinePayments.requestAccess.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success(text.accepted);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [proof, setProof] = useState<ProofPayload | null>(null);
  const [proofName, setProofName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR").format(priceFcfa);
  }, [lang, priceFcfa]);

  const handleProofChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProof(null);
      setProofName("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(lang === "fr" ? "Ajoutez une image de preuve." : lang === "ar" ? "أضف صورة لإثبات الدفع." : "Upload an image proof.");
      return;
    }

    const nextProof = await fileToProofPayload(file);
    setProof(nextProof);
    setProofName(file.name);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!proof) {
      toast.error(lang === "fr" ? "Ajoutez la preuve de paiement." : lang === "ar" ? "أضف إثبات الدفع." : "Add the payment proof.");
      return;
    }

    await requestMutation.mutateAsync({
      email,
      fullName,
      magazineId,
      proofFile: proof,
      whatsappNumber,
    });
  };

  return (
    <section className="rounded-2xl border border-gold/30 bg-card p-5 shadow-sm md:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-full bg-gold/15 p-2 text-gold">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">{text.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {previewPageCount} pages visibles gratuitement. {text.helper}
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5 text-sm text-foreground">
          <div className="mb-2 flex items-center gap-2 font-semibold text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span>{text.accepted}</span>
          </div>
          <p className="text-muted-foreground">
            {lang === "fr"
              ? "Le déblocage n'est pas automatique : un administrateur valide votre paiement puis vous envoie un lien sécurisé."
              : lang === "ar"
                ? "الفتح ليس آلياً: يقوم المسؤول بالتحقق من الدفع ثم يرسل لك رابطاً آمناً."
                : "Unlocking is not automatic: an administrator validates your payment and then sends you a secure link."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-white p-3">
              <img src={waveQrImageUrl} alt="Wave QR" className="mx-auto w-full max-w-[220px]" />
            </div>
            <div className="rounded-xl border border-border bg-background p-4 text-sm">
              <div className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <CreditCard className="h-4 w-4 text-gold" />
                <span>{text.price}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formattedPrice} FCFA</p>
              <div className="mt-4 flex items-center gap-2 font-semibold text-foreground">
                <Smartphone className="h-4 w-4 text-gold" />
                <span>{text.waveNumber}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{waveNumber}</p>
            </div>
          </div>

          <div>
            <div className="mb-5 rounded-xl border border-border bg-background p-4 text-sm">
              <p className="mb-3 font-semibold text-foreground">{text.stepsTitle}</p>
              <ol className="space-y-2 text-muted-foreground">
                <li>1. {text.step1}</li>
                <li>2. {text.step2}</li>
                <li>3. {text.step3}</li>
              </ol>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-foreground">{text.name}</span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-foreground">{text.email}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-foreground">{text.phone}</span>
                <input
                  value={whatsappNumber}
                  onChange={(event) => setWhatsappNumber(event.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-foreground">{text.file}</span>
                <div className="rounded-xl border border-dashed border-border bg-background p-4">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
                    <Upload className="h-4 w-4 text-gold" />
                    <span>{proofName || text.uploadPlaceholder}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleProofChange} />
                  </label>
                </div>
              </label>

              <Button type="submit" className="bg-primary text-primary-foreground" disabled={requestMutation.isPending}>
                {requestMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {text.button}
              </Button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
