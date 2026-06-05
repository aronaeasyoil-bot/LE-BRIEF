import { useMemo, useState } from "react";
import type { ComponentType, FormEvent, ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import AdminFileUploadField from "@/components/AdminFileUploadField";
import { getAdminLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  BadgeCheck,
  Calendar,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Image,
  LibraryBig,
  Megaphone,
  Newspaper,
  PenLine,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab =
  | "articles"
  | "events"
  | "ads"
  | "magazine"
  | "experts"
  | "chroniques"
  | "nos-publicites"
  | "gerer-magazine";

const tabs: { id: Tab; icon: ComponentType<{ className?: string }> }[] = [
  { id: "articles", icon: FileText },
  { id: "events", icon: Calendar },
  { id: "ads", icon: Image },
  { id: "magazine", icon: Newspaper },
  { id: "experts", icon: BadgeCheck },
  { id: "chroniques", icon: PenLine },
  { id: "nos-publicites", icon: Megaphone },
  { id: "gerer-magazine", icon: LibraryBig },
];

const adminText = {
  fr: {
    tabs: {
      articles: "Articles",
      events: "Événements",
      ads: "Publicités",
      magazine: "Magazine",
      experts: "Experts",
      chroniques: "Chroniques",
      "nos-publicites": "Nos Publicités",
      "gerer-magazine": "Gérer Magazine",
    },
    authPrompt: "Connectez-vous pour accéder au panel d'administration.",
    signIn: "Se connecter",
    adminOnly: "Accès réservé aux administrateurs.",
    synced: "Les changements enregistrés ici alimentent les mêmes données que le site public, sur mobile et ordinateur.",
    publicArticles: "Articles publics dans la rubrique",
    allArticles: "Tous les articles du site.",
    adsDescription: "Bannières, visuels et liens visibles dans les emplacements publicitaires.",
    ownAdsDescription: "Sélection et ordre des publicités publiées sur le site.",
    magazineDescription: "Aperçu de ce qui alimente le kiosque visible sur la page d'accueil.",
    manageMagazineDescription: "Ajoutez, modifiez ou supprimez les numéros du kiosque.",
    eventsDescription: "Conférences, forums et rendez-vous visibles sur la page Événements.",
    newArticle: "Nouvel article",
    editArticle: "Modifier l'article",
    newEvent: "Nouvel événement",
    editEvent: "Modifier l'événement",
    newAd: "Nouvelle publicité",
    editAd: "Modifier la publicité",
    newMagazine: "Nouveau magazine",
    editMagazine: "Modifier le magazine",
    create: "Créer",
    update: "Mettre à jour",
    cancel: "Annuler",
    published: "Publié",
    draft: "Brouillon",
    active: "Actif",
    inactive: "Inactif",
    category: "Catégorie",
    status: "Statut",
    actions: "Actions",
    title: "Titre",
    date: "Date",
    location: "Lieu",
    author: "Auteur",
    language: "Langue",
    order: "Ordre",
    issue: "Numéro",
    image: "Image",
    video: "Video",
    coverUrl: "Couverture",
    pdfUrl: "Document PDF",
    noMagazine: "Aucun magazine publié pour le moment.",
    requiredTitle: "Ajoutez au moins un titre.",
    requiredMagazineDocument: "Ajoutez le document PDF du magazine.",
    edit: "Modifier",
    delete: "Supprimer",
    confirmDelete: "Confirmer la suppression ?",
  },
  en: {
    tabs: {
      articles: "Articles",
      events: "Events",
      ads: "Ads",
      magazine: "Magazine",
      experts: "Experts",
      chroniques: "Columns",
      "nos-publicites": "Our Ads",
      "gerer-magazine": "Manage Magazine",
    },
    authPrompt: "Sign in to access the administration panel.",
    signIn: "Sign in",
    adminOnly: "Access reserved for administrators.",
    synced: "Changes saved here feed the same public site data on mobile and desktop.",
    publicArticles: "Public articles in the section",
    allArticles: "All site articles.",
    adsDescription: "Banners, visuals and links shown in advertising placements.",
    ownAdsDescription: "Selection and order of ads published on the site.",
    magazineDescription: "Preview of what powers the kiosk visible on the homepage.",
    manageMagazineDescription: "Add, edit or delete kiosk issues.",
    eventsDescription: "Conferences, forums and appointments visible on the Events page.",
    newArticle: "New article",
    editArticle: "Edit article",
    newEvent: "New event",
    editEvent: "Edit event",
    newAd: "New ad",
    editAd: "Edit ad",
    newMagazine: "New magazine",
    editMagazine: "Edit magazine",
    create: "Create",
    update: "Update",
    cancel: "Cancel",
    published: "Published",
    draft: "Draft",
    active: "Active",
    inactive: "Inactive",
    category: "Category",
    status: "Status",
    actions: "Actions",
    title: "Title",
    date: "Date",
    location: "Location",
    author: "Author",
    language: "Language",
    order: "Order",
    issue: "Issue",
    image: "Image",
    video: "Video",
    coverUrl: "Cover image",
    pdfUrl: "PDF document",
    noMagazine: "No magazine published yet.",
    requiredTitle: "Add at least one title.",
    requiredMagazineDocument: "Add the magazine PDF document.",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Confirm deletion?",
  },
  ar: {
    tabs: {
      articles: "المقالات",
      events: "الأحداث",
      ads: "الإعلانات",
      magazine: "المجلة",
      experts: "خبراء",
      chroniques: "أعمدة الرأي",
      "nos-publicites": "إعلاناتنا",
      "gerer-magazine": "إدارة المجلة",
    },
    authPrompt: "سجّل الدخول للوصول إلى لوحة الإدارة.",
    signIn: "تسجيل الدخول",
    adminOnly: "الوصول مخصص للمسؤولين فقط.",
    synced: "التغييرات المحفوظة هنا تغذي نفس بيانات الموقع العام على الهاتف والكمبيوتر.",
    publicArticles: "مقالات عامة في قسم",
    allArticles: "كل مقالات الموقع.",
    adsDescription: "لافتات وصور وروابط تظهر في مساحات الإعلانات.",
    ownAdsDescription: "اختيار وترتيب الإعلانات المنشورة على الموقع.",
    magazineDescription: "معاينة لما يغذي الكشك الظاهر في الصفحة الرئيسية.",
    manageMagazineDescription: "أضف أو عدّل أو احذف أعداد الكشك.",
    eventsDescription: "مؤتمرات ومنتديات ومواعيد ظاهرة في صفحة الأحداث.",
    newArticle: "مقال جديد",
    editArticle: "تعديل المقال",
    newEvent: "حدث جديد",
    editEvent: "تعديل الحدث",
    newAd: "إعلان جديد",
    editAd: "تعديل الإعلان",
    newMagazine: "مجلة جديدة",
    editMagazine: "تعديل المجلة",
    create: "إنشاء",
    update: "تحديث",
    cancel: "إلغاء",
    published: "منشور",
    draft: "مسودة",
    active: "نشط",
    inactive: "غير نشط",
    category: "الفئة",
    status: "الحالة",
    actions: "الإجراءات",
    title: "العنوان",
    date: "التاريخ",
    location: "المكان",
    author: "الكاتب",
    language: "اللغة",
    order: "الترتيب",
    issue: "العدد",
    image: "صورة",
    video: "فيديو",
    coverUrl: "صورة الغلاف",
    pdfUrl: "ملف PDF",
    noMagazine: "لا توجد مجلة منشورة حتى الآن.",
    requiredTitle: "أضف عنوانًا واحدًا على الأقل.",
    requiredMagazineDocument: "أضف ملف PDF الخاص بالمجلة.",
    edit: "تعديل",
    delete: "حذف",
    confirmDelete: "تأكيد الحذف؟",
  },
} as const;

const getAdminText = (lang: string) => adminText[lang as keyof typeof adminText] || adminText.fr;

const dateInputValue = (value?: Date | string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const localizedTitle = (item: any) => item?.titleFr || item?.titleEn || item?.titleAr || "Sans titre";

export default function AdminPage() {
  const { t, lang, rtl } = useLanguage();
  const admin = getAdminText(lang);
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("articles");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
        <Navbar />
        <main className="pt-[140px] container text-center py-20">
          <h1 className="text-3xl font-bold text-foreground mb-4">{t.nav.admin}</h1>
          <p className="text-muted-foreground mb-6">{admin.authPrompt}</p>
          <a href={getAdminLoginUrl()} className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium">
            {admin.signIn}
          </a>
        </main>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
        <Navbar />
        <main className="pt-[140px] container text-center py-20">
          <h1 className="text-3xl font-bold text-foreground mb-4">403</h1>
          <p className="text-muted-foreground">{admin.adminOnly}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={rtl ? "rtl" : "ltr"}>
      <Navbar />
      <main className="pt-[140px] pb-16">
        <div className="container">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gold">LE BRIEF</p>
              <h1 className="text-3xl font-bold text-foreground">{t.nav.admin}</h1>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              {admin.synced}
            </p>
          </div>

          <div className="mb-8 overflow-x-auto border-b border-border">
            <div className="flex min-w-max gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{admin.tabs[tab.id]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "articles" && <ArticlesTab title={admin.tabs.articles} />}
          {activeTab === "events" && <EventsTab />}
          {activeTab === "ads" && <AdsTab title={admin.tabs.ads} description={admin.adsDescription} />}
          {activeTab === "magazine" && <MagazineOverview />}
          {activeTab === "experts" && <ArticlesTab title={admin.tabs.experts} categorySlug="experts" />}
          {activeTab === "chroniques" && <ArticlesTab title={admin.tabs.chroniques} categorySlug="chroniques" />}
          {activeTab === "nos-publicites" && (
            <AdsTab title={admin.tabs["nos-publicites"]} description={admin.ownAdsDescription} />
          )}
          {activeTab === "gerer-magazine" && <MagazinesTab />}
        </div>
      </main>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="w-full bg-primary text-primary-foreground sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground";

function ArticlesTab({ title, categorySlug }: { title: string; categorySlug?: string }) {
  const { lang } = useLanguage();
  const admin = getAdminText(lang);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data: articles = [], refetch } = trpc.articles.all.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const lockedCategory = useMemo(() => categories.find((category) => category.slug === categorySlug), [categories, categorySlug]);
  const defaultCategoryId = lockedCategory?.id || categories[0]?.id || 1;
  const filteredArticles = lockedCategory
    ? articles.filter((article) => article.categoryId === lockedCategory.id)
    : articles;
  const [formData, setFormData] = useState({
    titleFr: "",
    titleEn: "",
    titleAr: "",
    excerptFr: "",
    excerptEn: "",
    excerptAr: "",
    contentFr: "",
    contentEn: "",
    contentAr: "",
    categoryId: 1,
    imageUrl: "",
    authorName: "",
    featured: false,
    published: true,
    language: "all" as "fr" | "en" | "ar" | "all",
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.articles.create.useMutation({
    onSuccess: async () => {
      toast.success("Article cree");
      await utils.articles.published.invalidate();
      await utils.articles.featured.invalidate();
      refetch();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });
  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: async () => {
      toast.success("Article mis a jour");
      await utils.articles.published.invalidate();
      await utils.articles.featured.invalidate();
      refetch();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: async () => {
      toast.success("Article supprime");
      await utils.articles.published.invalidate();
      await utils.articles.featured.invalidate();
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      titleFr: "",
      titleEn: "",
      titleAr: "",
      excerptFr: "",
      excerptEn: "",
      excerptAr: "",
      contentFr: "",
      contentEn: "",
      contentAr: "",
      categoryId: defaultCategoryId,
      imageUrl: "",
      authorName: "",
      featured: false,
      published: true,
      language: "all",
    });
  };

  const openCreate = () => {
    resetForm();
    setFormData((current) => ({ ...current, categoryId: defaultCategoryId }));
    setShowForm(true);
  };

  const handleEdit = (article: any) => {
    setEditingId(article.id);
    setFormData({
      titleFr: article.titleFr || "",
      titleEn: article.titleEn || "",
      titleAr: article.titleAr || "",
      excerptFr: article.excerptFr || "",
      excerptEn: article.excerptEn || "",
      excerptAr: article.excerptAr || "",
      contentFr: article.contentFr || "",
      contentEn: article.contentEn || "",
      contentAr: article.contentAr || "",
      categoryId: lockedCategory?.id || article.categoryId || defaultCategoryId,
      imageUrl: article.imageUrl || "",
      authorName: article.authorName || "",
      featured: Boolean(article.featured),
      published: Boolean(article.published),
      language: article.language || "all",
    });
    setShowForm(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...formData, categoryId: lockedCategory?.id || formData.categoryId || defaultCategoryId };
    if (!payload.titleFr && !payload.titleEn && !payload.titleAr) {
      toast.error(admin.requiredTitle);
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <>
      <SectionHeader
        title={title}
        description={lockedCategory ? `${admin.publicArticles} ${lockedCategory.nameFr}.` : admin.allArticles}
        actionLabel={admin.newArticle}
        onAction={openCreate}
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-border bg-card p-4 sm:p-6">
          <h3 className="mb-6 text-xl font-bold text-foreground">{editingId ? admin.editArticle : admin.newArticle}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Titre (FR)">
              <input className={inputClass} value={formData.titleFr} onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })} />
            </Field>
            <Field label="Title (EN)">
              <input className={inputClass} value={formData.titleEn} onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })} />
            </Field>
            <Field label="Titre (AR)">
              <input className={inputClass} value={formData.titleAr} onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })} dir="rtl" />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Extrait (FR)">
              <textarea rows={3} className={inputClass} value={formData.excerptFr} onChange={(e) => setFormData({ ...formData, excerptFr: e.target.value })} />
            </Field>
            <Field label="Excerpt (EN)">
              <textarea rows={3} className={inputClass} value={formData.excerptEn} onChange={(e) => setFormData({ ...formData, excerptEn: e.target.value })} />
            </Field>
            <Field label="Extrait (AR)">
              <textarea rows={3} className={inputClass} value={formData.excerptAr} onChange={(e) => setFormData({ ...formData, excerptAr: e.target.value })} dir="rtl" />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Contenu (FR)">
              <textarea rows={6} className={inputClass} value={formData.contentFr} onChange={(e) => setFormData({ ...formData, contentFr: e.target.value })} />
            </Field>
            <Field label="Content (EN)">
              <textarea rows={6} className={inputClass} value={formData.contentEn} onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })} />
            </Field>
            <Field label="Contenu (AR)">
              <textarea rows={6} className={inputClass} value={formData.contentAr} onChange={(e) => setFormData({ ...formData, contentAr: e.target.value })} dir="rtl" />
            </Field>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label={admin.category}>
              <select
                className={inputClass}
                value={formData.categoryId}
                disabled={Boolean(lockedCategory)}
                onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameFr}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={admin.image}>
              <AdminFileUploadField
                accept="image/*"
                bucket="images"
                kind="image"
                value={formData.imageUrl}
                onChange={(imageUrl) => setFormData({ ...formData, imageUrl })}
              />
            </Field>
            <Field label={admin.author}>
              <input className={inputClass} value={formData.authorName} onChange={(e) => setFormData({ ...formData, authorName: e.target.value })} />
            </Field>
            <Field label={admin.language}>
              <select className={inputClass} value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}>
                <option value="all">Toutes</option>
                <option value="fr">Francais</option>
                <option value="en">English</option>
                <option value="ar">Arabe</option>
              </select>
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })} />
              {admin.published}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />
              A la une
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="bg-primary text-primary-foreground" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? admin.update : admin.create}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              {admin.cancel}
            </Button>
          </div>
        </form>
      )}

      <DataTable>
        <thead className="bg-secondary">
          <tr>
            <TableHead>{admin.title}</TableHead>
            <TableHead>{admin.category}</TableHead>
            <TableHead>{admin.status}</TableHead>
            <TableHead>{admin.actions}</TableHead>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filteredArticles.map((article) => (
            <tr key={article.id} className="hover:bg-secondary/50">
              <TableCell className="max-w-[340px] truncate text-foreground">{localizedTitle(article)}</TableCell>
              <TableCell>{categories.find((category) => category.id === article.categoryId)?.nameFr || "-"}</TableCell>
              <TableCell>
                <Status published={article.published} featured={article.featured} />
              </TableCell>
              <TableCell>
                <RowActions onEdit={() => handleEdit(article)} onDelete={() => deleteMutation.mutate({ id: article.id })} />
              </TableCell>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}

function EventsTab() {
  const { lang } = useLanguage();
  const admin = getAdminText(lang);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    titleFr: "",
    titleEn: "",
    titleAr: "",
    descriptionFr: "",
    descriptionEn: "",
    descriptionAr: "",
    eventDate: "",
    location: "",
    imageUrl: "",
    published: true,
  });
  const { data: events = [], refetch } = trpc.events.all.useQuery();
  const utils = trpc.useUtils();
  const createMutation = trpc.events.create.useMutation({
    onSuccess: async () => {
      toast.success("Evenement cree");
      await utils.events.published.invalidate();
      refetch();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });
  const updateMutation = trpc.events.update.useMutation({
    onSuccess: async () => {
      toast.success("Evenement mis a jour");
      await utils.events.published.invalidate();
      refetch();
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = trpc.events.delete.useMutation({
    onSuccess: async () => {
      toast.success("Evenement supprime");
      await utils.events.published.invalidate();
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      titleFr: "",
      titleEn: "",
      titleAr: "",
      descriptionFr: "",
      descriptionEn: "",
      descriptionAr: "",
      eventDate: "",
      location: "",
      imageUrl: "",
      published: true,
    });
  };

  const handleEdit = (event: any) => {
    setEditingId(event.id);
    setFormData({
      titleFr: event.titleFr || "",
      titleEn: event.titleEn || "",
      titleAr: event.titleAr || "",
      descriptionFr: event.descriptionFr || "",
      descriptionEn: event.descriptionEn || "",
      descriptionAr: event.descriptionAr || "",
      eventDate: dateInputValue(event.eventDate),
      location: event.location || "",
      imageUrl: event.imageUrl || "",
      published: Boolean(event.published),
    });
    setShowForm(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formData.titleFr && !formData.titleEn && !formData.titleAr) {
      toast.error(admin.requiredTitle);
      return;
    }
    const payload = {
      ...formData,
      eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate(payload);
  };

  return (
    <>
      <SectionHeader title={admin.tabs.events} description={admin.eventsDescription} actionLabel={admin.newEvent} onAction={() => setShowForm(true)} />
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-border bg-card p-4 sm:p-6">
          <h3 className="mb-6 text-xl font-bold text-foreground">{editingId ? admin.editEvent : admin.newEvent}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Titre (FR)">
              <input className={inputClass} value={formData.titleFr} onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })} />
            </Field>
            <Field label="Title (EN)">
              <input className={inputClass} value={formData.titleEn} onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })} />
            </Field>
            <Field label="Titre (AR)">
              <input className={inputClass} value={formData.titleAr} onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })} dir="rtl" />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Description (FR)">
              <textarea rows={4} className={inputClass} value={formData.descriptionFr} onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })} />
            </Field>
            <Field label="Description (EN)">
              <textarea rows={4} className={inputClass} value={formData.descriptionEn} onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })} />
            </Field>
            <Field label="Description (AR)">
              <textarea rows={4} className={inputClass} value={formData.descriptionAr} onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })} dir="rtl" />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label={admin.date}>
              <input type="date" className={inputClass} value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} />
            </Field>
            <Field label={admin.location}>
              <input className={inputClass} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            </Field>
            <Field label={admin.image}>
              <AdminFileUploadField
                accept="image/*"
                bucket="images"
                kind="image"
                value={formData.imageUrl}
                onChange={(imageUrl) => setFormData({ ...formData, imageUrl })}
              />
            </Field>
          </div>
          <label className="mt-5 flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })} />
            {admin.published}
          </label>
          <FormActions editing={Boolean(editingId)} pending={createMutation.isPending || updateMutation.isPending} onCancel={resetForm} />
        </form>
      )}

      <DataTable>
        <thead className="bg-secondary">
          <tr>
            <TableHead>{admin.title}</TableHead>
            <TableHead>{admin.date}</TableHead>
            <TableHead>{admin.location}</TableHead>
            <TableHead>{admin.status}</TableHead>
            <TableHead>{admin.actions}</TableHead>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-secondary/50">
              <TableCell className="max-w-[260px] truncate text-foreground">{localizedTitle(event)}</TableCell>
              <TableCell>{event.eventDate ? new Date(event.eventDate).toLocaleDateString("fr-FR") : "-"}</TableCell>
              <TableCell className="max-w-[220px] truncate">{event.location || "-"}</TableCell>
              <TableCell>
                <Status published={event.published} />
              </TableCell>
              <TableCell>
                <RowActions onEdit={() => handleEdit(event)} onDelete={() => deleteMutation.mutate({ id: event.id })} />
              </TableCell>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}

function AdsTab({ title, description }: { title: string; description: string }) {
  const { lang } = useLanguage();
  const admin = getAdminText(lang);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    titleFr: "",
    titleEn: "",
    titleAr: "",
    descriptionFr: "",
    descriptionEn: "",
    descriptionAr: "",
    imageUrl: "",
    videoUrl: "",
    linkUrl: "",
    sortOrder: 0,
    active: true,
  });
  const { data: ads = [] } = trpc.advertisements.all.useQuery();
  const utils = trpc.useUtils();
  const createMutation = trpc.advertisements.create.useMutation();
  const updateMutation = trpc.advertisements.update.useMutation();
  const deleteMutation = trpc.advertisements.delete.useMutation();

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      titleFr: "",
      titleEn: "",
      titleAr: "",
      descriptionFr: "",
      descriptionEn: "",
      descriptionAr: "",
      imageUrl: "",
      videoUrl: "",
      linkUrl: "",
      sortOrder: 0,
      active: true,
    });
  };

  const refreshAds = async () => {
    await utils.advertisements.all.invalidate();
    await utils.advertisements.active.invalidate();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (editingId) await updateMutation.mutateAsync({ id: editingId, ...formData });
      else await createMutation.mutateAsync(formData);
      toast.success("Publicite enregistree");
      await refreshAds();
      resetForm();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (ad: any) => {
    setEditingId(ad.id);
    setFormData({
      titleFr: ad.titleFr || "",
      titleEn: ad.titleEn || "",
      titleAr: ad.titleAr || "",
      descriptionFr: ad.descriptionFr || "",
      descriptionEn: ad.descriptionEn || "",
      descriptionAr: ad.descriptionAr || "",
      imageUrl: ad.imageUrl || "",
      videoUrl: ad.videoUrl || "",
      linkUrl: ad.linkUrl || "",
      sortOrder: ad.sortOrder || 0,
      active: ad.active ?? true,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    toast.success("Publicite supprimee");
    await refreshAds();
  };

  return (
    <>
      <SectionHeader title={title} description={description} actionLabel={admin.newAd} onAction={() => setShowForm(true)} />
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-border bg-card p-4 sm:p-6">
          <h3 className="mb-6 text-xl font-bold text-foreground">{editingId ? admin.editAd : admin.newAd}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Titre (FR)">
              <input className={inputClass} value={formData.titleFr} onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })} />
            </Field>
            <Field label="Title (EN)">
              <input className={inputClass} value={formData.titleEn} onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })} />
            </Field>
            <Field label="Titre (AR)">
              <input className={inputClass} value={formData.titleAr} onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })} dir="rtl" />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Description (FR)">
              <textarea rows={3} className={inputClass} value={formData.descriptionFr} onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })} />
            </Field>
            <Field label="Description (EN)">
              <textarea rows={3} className={inputClass} value={formData.descriptionEn} onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })} />
            </Field>
            <Field label="Description (AR)">
              <textarea rows={3} className={inputClass} value={formData.descriptionAr} onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })} dir="rtl" />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label={admin.image}>
              <AdminFileUploadField
                accept="image/*"
                bucket="images"
                kind="image"
                value={formData.imageUrl}
                onChange={(imageUrl) => setFormData({ ...formData, imageUrl })}
              />
            </Field>
            <Field label={admin.video}>
              <AdminFileUploadField
                accept="video/*"
                bucket="videos"
                kind="video"
                value={formData.videoUrl}
                onChange={(videoUrl) => setFormData({ ...formData, videoUrl })}
              />
            </Field>
            <Field label="Lien">
              <input className={inputClass} value={formData.linkUrl} onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })} placeholder="https://..." />
            </Field>
            <Field label={admin.order}>
              <input type="number" className={inputClass} value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          <label className="mt-5 flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
            {admin.active}
          </label>
          <FormActions editing={Boolean(editingId)} pending={createMutation.isPending || updateMutation.isPending} onCancel={resetForm} />
        </form>
      )}

      <DataTable>
        <thead className="bg-secondary">
          <tr>
            <TableHead>{admin.title}</TableHead>
            <TableHead>{admin.order}</TableHead>
            <TableHead>{admin.status}</TableHead>
            <TableHead>{admin.actions}</TableHead>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ads.map((ad: any) => (
            <tr key={ad.id} className="hover:bg-secondary/50">
              <TableCell className="max-w-[340px] truncate text-foreground">{localizedTitle(ad)}</TableCell>
              <TableCell>{ad.sortOrder || 0}</TableCell>
              <TableCell>
                <Status published={ad.active} labelPublished={admin.active} labelDraft={admin.inactive} />
              </TableCell>
              <TableCell>
                <RowActions onEdit={() => handleEdit(ad)} onDelete={() => handleDelete(ad.id)} />
              </TableCell>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}

function MagazineOverview() {
  const { lang } = useLanguage();
  const admin = getAdminText(lang);
  const { data: magazines = [] } = trpc.magazines.all.useQuery();
  const latest = magazines[0];
  return (
    <>
      <SectionHeader title={admin.tabs.magazine} description={admin.magazineDescription} />
      {!latest ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">{admin.noMagazine}</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {latest.coverImageUrl ? (
              <img src={latest.coverImageUrl} alt={latest.titleFr} className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center bg-secondary text-xl font-bold text-foreground">LE BRIEF</div>
            )}
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm font-bold text-gold">{admin.issue} {latest.issueNumber}</p>
            <h3 className="mt-2 text-2xl font-bold text-foreground">{latest.titleFr}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{new Date(latest.publishedAt).toLocaleDateString("fr-FR")}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={latest.pdfUrl} className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Ouvrir le PDF
              </a>
              <a href={latest.coverImageUrl || latest.pdfUrl} className="inline-flex justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground">
                Voir la couverture
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MagazinesTab() {
  const { lang } = useLanguage();
  const admin = getAdminText(lang);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    titleFr: "",
    titleEn: "",
    titleAr: "",
    coverImageUrl: "",
    pdfUrl: "",
    issueNumber: 1,
    publishedAt: dateInputValue(new Date()),
  });
  const { data: magazines = [] } = trpc.magazines.all.useQuery();
  const utils = trpc.useUtils();
  const createMutation = trpc.magazines.create.useMutation();
  const updateMutation = trpc.magazines.update.useMutation();
  const deleteMutation = trpc.magazines.delete.useMutation();

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      titleFr: "",
      titleEn: "",
      titleAr: "",
      coverImageUrl: "",
      pdfUrl: "",
      issueNumber: 1,
      publishedAt: dateInputValue(new Date()),
    });
  };

  const refreshMagazines = async () => {
    await utils.magazines.all.invalidate();
    await utils.magazines.list.invalidate();
  };

  const handleEdit = (magazine: any) => {
    setEditingId(magazine.id);
    setFormData({
      titleFr: magazine.titleFr || "",
      titleEn: magazine.titleEn || "",
      titleAr: magazine.titleAr || "",
      coverImageUrl: magazine.coverImageUrl || "",
      pdfUrl: magazine.pdfUrl || "",
      issueNumber: magazine.issueNumber || 1,
      publishedAt: dateInputValue(magazine.publishedAt),
    });
    setShowForm(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const hasTitle = Boolean(formData.titleFr || formData.titleEn || formData.titleAr);

    if (!hasTitle) {
      toast.error(admin.requiredTitle);
      return;
    }

    if (!formData.pdfUrl) {
      toast.error(admin.requiredMagazineDocument);
      return;
    }
    const payload = {
      ...formData,
      issueNumber: Number(formData.issueNumber) || 1,
      publishedAt: formData.publishedAt ? new Date(formData.publishedAt) : new Date(),
    };
    try {
      if (editingId) await updateMutation.mutateAsync({ id: editingId, ...payload });
      else await createMutation.mutateAsync(payload);
      toast.success("Magazine enregistre");
      await refreshMagazines();
      resetForm();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    toast.success("Magazine supprime");
    await refreshMagazines();
  };

  return (
    <>
      <SectionHeader title={admin.tabs["gerer-magazine"]} description={admin.manageMagazineDescription} actionLabel={admin.newMagazine} onAction={() => setShowForm(true)} />
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-border bg-card p-4 sm:p-6">
          <h3 className="mb-6 text-xl font-bold text-foreground">{editingId ? admin.editMagazine : admin.newMagazine}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Titre (FR)">
              <input className={inputClass} value={formData.titleFr} onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })} />
            </Field>
            <Field label="Title (EN)">
              <input className={inputClass} value={formData.titleEn} onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })} />
            </Field>
            <Field label="Titre (AR)">
              <input className={inputClass} value={formData.titleAr} onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })} dir="rtl" />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label={admin.issue}>
              <input type="number" className={inputClass} value={formData.issueNumber} onChange={(e) => setFormData({ ...formData, issueNumber: Number(e.target.value) || 1 })} />
            </Field>
            <Field label={admin.date}>
              <input type="date" className={inputClass} value={formData.publishedAt} onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })} />
            </Field>
            <Field label={admin.coverUrl}>
              <AdminFileUploadField
                accept="image/*"
                bucket="images"
                kind="image"
                value={formData.coverImageUrl}
                onChange={(coverImageUrl) => setFormData({ ...formData, coverImageUrl })}
              />
            </Field>
            <Field label={admin.pdfUrl}>
              <AdminFileUploadField
                accept=".pdf,application/pdf"
                bucket="documents"
                kind="document"
                value={formData.pdfUrl}
                onChange={(pdfUrl) => setFormData({ ...formData, pdfUrl })}
              />
            </Field>
          </div>
          <FormActions editing={Boolean(editingId)} pending={createMutation.isPending || updateMutation.isPending} onCancel={resetForm} />
        </form>
      )}

      <DataTable>
        <thead className="bg-secondary">
          <tr>
            <TableHead>{admin.title}</TableHead>
            <TableHead>{admin.issue}</TableHead>
            <TableHead>{admin.date}</TableHead>
            <TableHead>{admin.actions}</TableHead>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {magazines.map((magazine) => (
            <tr key={magazine.id} className="hover:bg-secondary/50">
              <TableCell className="max-w-[340px] truncate text-foreground">{localizedTitle(magazine)}</TableCell>
              <TableCell>{magazine.issueNumber}</TableCell>
              <TableCell>{magazine.publishedAt ? new Date(magazine.publishedAt).toLocaleDateString("fr-FR") : "-"}</TableCell>
              <TableCell>
                <RowActions onEdit={() => handleEdit(magazine)} onDelete={() => handleDelete(magazine.id)} />
              </TableCell>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </>
  );
}

function FormActions({ editing, pending, onCancel }: { editing: boolean; pending: boolean; onCancel: () => void }) {
  const { lang } = useLanguage();
  const admin = getAdminText(lang);
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <Button type="submit" className="bg-primary text-primary-foreground" disabled={pending}>
        {editing ? admin.update : admin.create}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        {admin.cancel}
      </Button>
    </div>
  );
}

function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">{children}</table>
      </div>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 text-left font-medium text-foreground">{children}</th>;
}

function TableCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-muted-foreground ${className}`}>{children}</td>;
}

function Status({
  published,
  featured,
  labelPublished,
  labelDraft,
}: {
  published?: boolean;
  featured?: boolean;
  labelPublished?: string;
  labelDraft?: string;
}) {
  const { lang } = useLanguage();
  const admin = getAdminText(lang);
  const publishedLabel = labelPublished || admin.published;
  const draftLabel = labelDraft || admin.draft;
  return (
    <div className="flex items-center gap-2">
      {published ? (
        <span className="inline-flex items-center gap-1 text-xs text-green-400">
          <Eye className="h-3 w-3" />
          {publishedLabel}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <EyeOff className="h-3 w-3" />
          {draftLabel}
        </span>
      )}
      {featured && <Star className="h-3 w-3 text-gold" />}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { lang } = useLanguage();
  const admin = getAdminText(lang);
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onEdit} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-gold" title={admin.edit}>
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirm(admin.confirmDelete)) onDelete();
        }}
        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-red-500"
        title={admin.delete}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
