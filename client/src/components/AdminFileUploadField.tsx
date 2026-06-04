import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, Upload, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

type UploadBucket = "images" | "documents" | "videos";
type DisplayKind = "image" | "document" | "video";

type AdminFileUploadFieldProps = {
  accept: string;
  bucket: UploadBucket;
  kind: DisplayKind;
  onChange: (url: string) => void;
  value: string;
};

const uploadText = {
  fr: {
    selectFile: "Selectionner un fichier",
    replaceFile: "Remplacer le fichier",
    uploading: "Televersement en cours...",
    currentFile: "Fichier actuel",
    remove: "Retirer",
    maxSize: "Taille maximum: 18 Mo",
    success: "Fichier televerse avec succes",
    error: "Erreur lors du televersement",
  },
  en: {
    selectFile: "Select a file",
    replaceFile: "Replace file",
    uploading: "Uploading...",
    currentFile: "Current file",
    remove: "Remove",
    maxSize: "Maximum size: 18 MB",
    success: "File uploaded successfully",
    error: "Upload failed",
  },
  ar: {
    selectFile: "اختر ملفا",
    replaceFile: "استبدال الملف",
    uploading: "جار رفع الملف...",
    currentFile: "الملف الحالي",
    remove: "حذف",
    maxSize: "الحد الاقصى: 18 ميغابايت",
    success: "تم رفع الملف بنجاح",
    error: "فشل رفع الملف",
  },
} as const;

function getFileNameFromUrl(url: string) {
  if (!url) return "";
  const lastSegment = url.split("/").pop() || url;
  return decodeURIComponent(lastSegment);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("File reading failed"));
    reader.readAsDataURL(file);
  });
}

export default function AdminFileUploadField({
  accept,
  bucket,
  kind,
  onChange,
  value,
}: AdminFileUploadFieldProps) {
  const { lang } = useLanguage();
  const text = uploadText[lang as keyof typeof uploadText] || uploadText.fr;
  const uploadMutation = trpc.uploads.file.useMutation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(kind === "image" ? value || null : null);
  const [currentFileName, setCurrentFileName] = useState(getFileNameFromUrl(value));

  useEffect(() => {
    setCurrentFileName(getFileNameFromUrl(value));
    if (kind === "image") {
      setPreviewUrl(value || null);
    }
  }, [kind, value]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const [, dataBase64 = ""] = dataUrl.split(",", 2);

      if (!dataBase64) {
        throw new Error("Invalid file data");
      }

      const uploaded = await uploadMutation.mutateAsync({
        bucket,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataBase64,
        size: file.size,
      });

      if (kind === "image") {
        setPreviewUrl(dataUrl);
      }

      setCurrentFileName(file.name);
      onChange(uploaded.url);
      toast.success(text.success);
    } catch (error: any) {
      toast.error(error?.message || text.error);
    } finally {
      event.target.value = "";
    }
  };

  const handleClear = () => {
    onChange("");
    setCurrentFileName("");
    setPreviewUrl(null);
  };

  const icon =
    kind === "image" ? <ImageIcon className="h-4 w-4" /> : kind === "video" ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  const hasValue = Boolean(value);

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-secondary/20 px-4 py-4 text-center transition-colors hover:border-primary hover:bg-secondary/40">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={uploadMutation.isPending}
        />
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span>{uploadMutation.isPending ? text.uploading : hasValue ? text.replaceFile : text.selectFile}</span>
        </div>
        <p className="text-xs text-muted-foreground">{text.maxSize}</p>
      </label>

      {kind === "image" && previewUrl ? (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <img src={previewUrl} alt={currentFileName || "Uploaded preview"} className="h-48 w-full object-cover" />
        </div>
      ) : null}

      {hasValue ? (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-primary">{icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{text.currentFile}</p>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                {currentFileName || value}
              </a>
            </div>
          </div>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={handleClear}>
              <X className="h-4 w-4" />
              {text.remove}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
