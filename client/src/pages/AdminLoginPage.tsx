import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const adminLoginText = {
  fr: {
    eyebrow: "Acces prive",
    title: "Connexion administrateur",
    subtitle: "Seul le proprietaire du site peut acceder a la gestion editoriale.",
    email: "Email administrateur",
    password: "Mot de passe",
    submit: "Ouvrir l'administration",
    loading: "Connexion...",
    invalid: "Email ou mot de passe incorrect.",
  },
  en: {
    eyebrow: "Private access",
    title: "Administrator login",
    subtitle: "Only the site owner can access the editorial dashboard.",
    email: "Administrator email",
    password: "Password",
    submit: "Open admin dashboard",
    loading: "Signing in...",
    invalid: "Incorrect email or password.",
  },
  ar: {
    eyebrow: "وصول خاص",
    title: "دخول المسؤول",
    subtitle: "فقط مالك الموقع يمكنه الوصول إلى لوحة الإدارة.",
    email: "بريد المسؤول",
    password: "كلمة المرور",
    submit: "فتح لوحة الإدارة",
    loading: "جار تسجيل الدخول...",
    invalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  },
} as const;

export default function AdminLoginPage() {
  const { lang, rtl } = useLanguage();
  const text = adminLoginText[lang as keyof typeof adminLoginText] || adminLoginText.fr;
  const { user, refresh } = useAuth();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      await refresh();
      setLocation("/admin");
    },
    onError: () => {
      toast.error(text.invalid);
    },
  });

  useEffect(() => {
    if (user?.role === "admin") {
      setLocation("/admin");
    }
  }, [setLocation, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loginMutation.mutateAsync({
      email,
      password,
    });
  };

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />
      <main className="pt-[140px] pb-16">
        <div className="container max-w-lg">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
            <div className="border-b border-border bg-secondary/40 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{text.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">{text.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{text.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="admin-email">
                  {text.email}
                </label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="admin-password">
                  {text.password}
                </label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? text.loading : text.submit}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
