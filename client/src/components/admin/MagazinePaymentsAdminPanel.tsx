import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Mail, MessageSquare, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const textByLanguage = {
  ar: {
    approve: "اعتماد",
    approved: "معتمد",
    empty: "لا توجد طلبات فتح حالياً.",
    issue: "العدد",
    notes: "ملاحظات المسؤول",
    openProof: "فتح الإثبات",
    pending: "قيد الانتظار",
    rejected: "مرفوض",
    reject: "رفض",
    requests: "طلبات فتح المجلة",
    sendHint: "بعد الاعتماد، يتم إرسال رابط الفتح إلى البريد الإلكتروني إن كانت خدمة الإرسال مفعلة.",
    status: "الحالة",
  },
  en: {
    approve: "Approve",
    approved: "Approved",
    empty: "No unlock requests yet.",
    issue: "Issue",
    notes: "Admin notes",
    openProof: "Open proof",
    pending: "Pending",
    rejected: "Rejected",
    reject: "Reject",
    requests: "Magazine unlock requests",
    sendHint: "After approval, the unlock link is emailed if sending is configured.",
    status: "Status",
  },
  fr: {
    approve: "Approuver",
    approved: "Approuve",
    empty: "Aucune demande de deblocage pour le moment.",
    issue: "Numero",
    notes: "Notes admin",
    openProof: "Ouvrir la preuve",
    pending: "En attente",
    rejected: "Refuse",
    reject: "Refuser",
    requests: "Demandes de deblocage magazine",
    sendHint: "Apres approbation, le lien de deblocage est envoye par email si l'envoi est configure.",
    status: "Statut",
  },
} as const;

const inputClass = "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground";

function getStatusLabel(lang: string, status: string) {
  const text = textByLanguage[lang as keyof typeof textByLanguage] || textByLanguage.fr;
  if (status === "approved") return text.approved;
  if (status === "rejected") return text.rejected;
  return text.pending;
}

export default function MagazinePaymentsAdminPanel() {
  const { lang } = useLanguage();
  const text = textByLanguage[lang as keyof typeof textByLanguage] || textByLanguage.fr;
  const [notesById, setNotesById] = useState<Record<number, string>>({});
  const utils = trpc.useUtils();
  const requestsQuery = trpc.magazinePayments.adminList.useQuery();
  const approveMutation = trpc.magazinePayments.approve.useMutation({
    onSuccess: async (result) => {
      toast.success(result.emailSent ? "Acces approuve et email envoye" : "Acces approuve");
      await utils.magazinePayments.adminList.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const rejectMutation = trpc.magazinePayments.reject.useMutation({
    onSuccess: async () => {
      toast.success("Demande refusee");
      await utils.magazinePayments.adminList.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const requests = requestsQuery.data ?? [];
  const pendingCount = useMemo(() => requests.filter((request) => request.status === "pending").length, [requests]);

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">{text.requests}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{text.sendHint}</p>
        </div>
        <div className="text-sm text-muted-foreground">{pendingCount} en attente</div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground">{text.empty}</div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const pending = approveMutation.isPending || rejectMutation.isPending;
            return (
              <div key={request.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                        {text.issue} {request.magazine?.issueNumber || request.magazineId}
                      </span>
                      <span className="text-xs text-muted-foreground">{getStatusLabel(lang, request.status)}</span>
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {request.magazine?.titleFr || `Magazine ${request.magazineId}`}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {request.email}
                      </span>
                      {request.whatsappNumber ? (
                        <span className="inline-flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          {request.whatsappNumber}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm text-muted-foreground">{request.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {request.createdAt ? new Date(request.createdAt).toLocaleString("fr-FR") : "-"}
                    </div>
                    {request.proofUrl ? (
                      <a
                        href={request.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {text.openProof}
                      </a>
                    ) : null}
                  </div>

                  <div className="w-full max-w-md space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-foreground">{text.notes}</span>
                      <textarea
                        rows={3}
                        className={inputClass}
                        value={notesById[request.id] ?? request.adminNotes ?? ""}
                        onChange={(event) => setNotesById((current) => ({ ...current, [request.id]: event.target.value }))}
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        className="bg-primary text-primary-foreground"
                        disabled={pending}
                        onClick={() =>
                          approveMutation.mutate({
                            adminNotes: notesById[request.id] ?? request.adminNotes ?? "",
                            id: request.id,
                          })
                        }
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {text.approve}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          rejectMutation.mutate({
                            adminNotes: notesById[request.id] ?? request.adminNotes ?? "",
                            id: request.id,
                          })
                        }
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {text.reject}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
