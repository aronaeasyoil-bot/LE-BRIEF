import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, Upload, Video, X } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

type UploadBucket = "images" | "documents" | "videos";
type DisplayKind = "image" | "document" | "video";

type AdminFileUploadFieldProps = {
  accept: string;
  bucket: UploadBucket;
  kind: DisplayKind;
  onChange: (url: string) => void;
  optimizePdf?: boolean;
  value: string;
};

const MAX_UPLOAD_BYTES = 18 * 1024 * 1024;
const PDF_OPTIMIZE_MAX_WIDTH = 1100;
const PDF_OPTIMIZE_JPEG_QUALITY = 0.62;

const uploadText = {
  fr: {
    selectFile: "Selectionner un fichier",
    replaceFile: "Remplacer le fichier",
    uploading: "Televersement en cours...",
    optimizing: "Optimisation du PDF...",
    optimizingPage: "Optimisation PDF page",
    currentFile: "Fichier actuel",
    remove: "Retirer",
    maxSize: "Taille maximum finale: 18 Mo",
    optimized: "PDF optimise pour une lecture plus rapide",
    sizeExceeded: "Le fichier final depasse 18 Mo. Essayez un PDF plus leger.",
    success: "Fichier televerse avec succes",
    error: "Erreur lors du televersement",
  },
  en: {
    selectFile: "Select a file",
    replaceFile: "Replace file",
    uploading: "Uploading...",
    optimizing: "Optimizing PDF...",
    optimizingPage: "Optimizing PDF page",
    currentFile: "Current file",
    remove: "Remove",
    maxSize: "Final maximum size: 18 MB",
    optimized: "PDF optimized for faster reading",
    sizeExceeded: "The final file is still larger than 18 MB. Try a lighter PDF.",
    success: "File uploaded successfully",
    error: "Upload failed",
  },
  ar: {
    selectFile: "Select a file",
    replaceFile: "Replace file",
    uploading: "Uploading...",
    optimizing: "Optimizing PDF...",
    optimizingPage: "Optimizing PDF page",
    currentFile: "Current file",
    remove: "Remove",
    maxSize: "Final maximum size: 18 MB",
    optimized: "PDF optimized for faster reading",
    sizeExceeded: "The final file is still larger than 18 MB. Try a lighter PDF.",
    success: "File uploaded successfully",
    error: "Upload failed",
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

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }

  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 1 : 2)} MB`;
}

function canvasToJpegBytes(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Unable to encode PDF page"));
          return;
        }

        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      quality,
    );
  });
}

async function optimizePdfForWeb(file: File, onProgress: (current: number, total: number) => void) {
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as any;
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useWorkerFetch: false,
  });
  const sourceDocument = await loadingTask.promise;
  const optimizedDocument = await PDFDocument.create();

  try {
    for (let pageNumber = 1; pageNumber <= sourceDocument.numPages; pageNumber += 1) {
      const page = await sourceDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const renderScale = Math.min(1, PDF_OPTIMIZE_MAX_WIDTH / viewport.width);
      const scaledViewport = page.getViewport({ scale: renderScale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: false });

      if (!context) {
        throw new Error("Unable to prepare the PDF canvas");
      }

      canvas.width = Math.max(Math.floor(scaledViewport.width), 1);
      canvas.height = Math.max(Math.floor(scaledViewport.height), 1);

      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;

      const jpegBytes = await canvasToJpegBytes(canvas, PDF_OPTIMIZE_JPEG_QUALITY);
      const jpegImage = await optimizedDocument.embedJpg(jpegBytes);
      const optimizedPage = optimizedDocument.addPage([scaledViewport.width, scaledViewport.height]);

      optimizedPage.drawImage(jpegImage, {
        x: 0,
        y: 0,
        width: scaledViewport.width,
        height: scaledViewport.height,
      });

      page.cleanup?.();
      canvas.width = 1;
      canvas.height = 1;
      onProgress(pageNumber, sourceDocument.numPages);

      if (pageNumber % 2 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    const optimizedBytes = await optimizedDocument.save({
      useObjectStreams: true,
    });
    const optimizedBlobBytes = Uint8Array.from(optimizedBytes);

    if (optimizedBytes.length >= file.size * 0.95) {
      return {
        file,
        optimized: false,
        outputBytes: file.size,
        sourceBytes: file.size,
      };
    }

    return {
      file: new File([optimizedBlobBytes], file.name, {
        lastModified: file.lastModified,
        type: "application/pdf",
      }),
      optimized: true,
      outputBytes: optimizedBytes.length,
      sourceBytes: file.size,
    };
  } finally {
    await loadingTask.destroy();
    sourceDocument.destroy?.();
  }
}

export default function AdminFileUploadField({
  accept,
  bucket,
  kind,
  onChange,
  optimizePdf = false,
  value,
}: AdminFileUploadFieldProps) {
  const { lang } = useLanguage();
  const text = uploadText[lang as keyof typeof uploadText] || uploadText.fr;
  const uploadMutation = trpc.uploads.file.useMutation();
  const [isPreparingFile, setIsPreparingFile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(kind === "image" ? value || null : null);
  const [currentFileName, setCurrentFileName] = useState(getFileNameFromUrl(value));
  const [statusMessage, setStatusMessage] = useState("");

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
      let uploadFile = file;
      const shouldOptimizePdf =
        optimizePdf && kind === "document" && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));

      if (shouldOptimizePdf) {
        setIsPreparingFile(true);
        setStatusMessage(text.optimizing);

        const optimizedResult = await optimizePdfForWeb(file, (current, total) => {
          setStatusMessage(`${text.optimizingPage} ${current}/${total}`);
        });

        uploadFile = optimizedResult.file;

        if (optimizedResult.optimized) {
          toast.success(
            `${text.optimized}: ${formatFileSize(optimizedResult.sourceBytes)} -> ${formatFileSize(optimizedResult.outputBytes)}`,
          );
        }
      }

      if (uploadFile.size > MAX_UPLOAD_BYTES) {
        throw new Error(text.sizeExceeded);
      }

      setStatusMessage(text.uploading);
      const dataUrl = await readFileAsDataUrl(uploadFile);
      const [, dataBase64 = ""] = dataUrl.split(",", 2);

      if (!dataBase64) {
        throw new Error("Invalid file data");
      }

      const uploaded = await uploadMutation.mutateAsync({
        bucket,
        fileName: uploadFile.name,
        mimeType: uploadFile.type || "application/octet-stream",
        dataBase64,
        size: uploadFile.size,
      });

      if (kind === "image") {
        setPreviewUrl(dataUrl);
      }

      setCurrentFileName(uploadFile.name);
      onChange(uploaded.url);
      toast.success(text.success);
    } catch (error: any) {
      toast.error(error?.message || text.error);
    } finally {
      setIsPreparingFile(false);
      setStatusMessage("");
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
  const isBusy = isPreparingFile || uploadMutation.isPending;

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-secondary/20 px-4 py-4 text-center transition-colors hover:border-primary hover:bg-secondary/40">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={isBusy}
        />
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span>{isBusy ? statusMessage || text.uploading : hasValue ? text.replaceFile : text.selectFile}</span>
        </div>
        <p className="text-xs text-muted-foreground">{text.maxSize}</p>
        {isBusy && statusMessage ? <p className="text-xs text-muted-foreground">{statusMessage}</p> : null}
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
