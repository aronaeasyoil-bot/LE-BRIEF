import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

type PdfDocumentHandle = {
  destroy?: () => void;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (options: { scale: number }) => { width: number; height: number };
    render: (options: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
    cleanup?: () => void;
  }>;
  numPages: number;
};

type PageStatus = "idle" | "loading" | "ready" | "error";

type PageRenderState = {
  height: number;
  src?: string;
  status: PageStatus;
};

type Props = {
  lang: string;
  lockedAfterPage?: number;
  paywallCard?: ReactNode;
  pdfUrl: string;
  reloadToken?: string;
  title: string;
};

const PRELOAD_PAGES = 3;
const OBSERVER_ROOT_MARGIN = "1200px 0px";
const PAGE_RATIO_FALLBACK = 1.414;

const textByLanguage = {
  ar: {
    error: "تعذر عرض هذه الصفحة حالياً.",
    loading: "Chargement du magazine...",
    page: "الصفحة",
  },
  en: {
    error: "This page could not be displayed right now.",
    loading: "Loading the magazine...",
    page: "Page",
  },
  fr: {
    error: "Impossible d'afficher cette page pour le moment.",
    loading: "Chargement du magazine...",
    page: "Page",
  },
} as const;

function getText(lang: string) {
  return textByLanguage[lang as keyof typeof textByLanguage] || textByLanguage.fr;
}

export default function MagazineMobilePdfViewer({
  lang,
  lockedAfterPage,
  paywallCard,
  pdfUrl,
  reloadToken,
  title,
}: Props) {
  const text = getText(lang);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageNodesRef = useRef<Record<number, HTMLDivElement | null>>({});
  const pageUrlsRef = useRef<Record<number, string>>({});
  const pageStatesRef = useRef<Record<number, PageRenderState>>({});
  const renderQueueRef = useRef<number[]>([]);
  const queueSetRef = useRef<Set<number>>(new Set());
  const isRenderingRef = useRef(false);
  const renderGenerationRef = useRef(0);

  const [containerWidth, setContainerWidth] = useState(0);
  const [isDocumentLoading, setIsDocumentLoading] = useState(true);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageStates, setPageStates] = useState<Record<number, PageRenderState>>({});
  const [pdfDocument, setPdfDocument] = useState<PdfDocumentHandle | null>(null);
  const readyPageCount = useMemo(
    () => Object.values(pageStates).filter((pageState) => pageState.status === "ready" && pageState.src).length,
    [pageStates],
  );

  const estimatedHeight = useMemo(() => {
    if (!containerWidth) {
      return 420;
    }

    return Math.max(Math.round(containerWidth * PAGE_RATIO_FALLBACK), 420);
  }, [containerWidth]);

  useEffect(() => {
    pageStatesRef.current = pageStates;
  }, [pageStates]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const syncWidth = () => {
      setContainerWidth(container.clientWidth);
    };

    syncWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncWidth);
      return () => window.removeEventListener("resize", syncWidth);
    }

    const observer = new ResizeObserver(syncWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const previousPageStates = pageStatesRef.current;
    const nextGeneration = renderGenerationRef.current + 1;
    renderGenerationRef.current = nextGeneration;
    renderQueueRef.current = [];
    queueSetRef.current.clear();
    isRenderingRef.current = false;
    setPdfDocument(null);
    setDocumentError(null);
    setIsDocumentLoading(true);

    const loadDocument = async () => {
      try {
        const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as any;
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        const task = pdfjs.getDocument({
          disableAutoFetch: true,
          disableStream: false,
          rangeChunkSize: 262144,
          url: pdfUrl,
          useSystemFonts: true,
          withCredentials: false,
        });
        const documentHandle = (await task.promise) as PdfDocumentHandle;

        if (isCancelled || renderGenerationRef.current !== nextGeneration) {
          documentHandle.destroy?.();
          return;
        }

        const initialStates: Record<number, PageRenderState> = {};
        for (let pageNumber = 1; pageNumber <= documentHandle.numPages; pageNumber += 1) {
          const previous = previousPageStates[pageNumber];
          initialStates[pageNumber] = {
            height: previous?.height || estimatedHeight,
            src: previous?.src,
            status: previous?.status === "ready" && previous?.src ? "ready" : "idle",
          };
        }

        setPdfDocument(documentHandle);
        setPageCount(documentHandle.numPages);
        setPageStates(initialStates);
      } catch (error) {
        console.error("[MagazineMobilePdfViewer] Failed to load PDF:", error);
        if (!isCancelled) {
          setDocumentError(text.error);
        }
      } finally {
        if (!isCancelled) {
          setIsDocumentLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [estimatedHeight, pdfUrl, reloadToken, text.error]);

  useEffect(() => {
    return () => {
      Object.values(pageUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      pageUrlsRef.current = {};
      pdfDocument?.destroy?.();
    };
  }, [pdfDocument]);

  useEffect(() => {
    if (!pageCount || !containerWidth) {
      return;
    }

    setPageStates((current) => {
      const next = { ...current };
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const previous = current[pageNumber];
        next[pageNumber] = {
          height: previous?.height || estimatedHeight,
          src: previous?.src,
          status: previous?.status || "idle",
        };
      }
      return next;
    });
  }, [containerWidth, estimatedHeight, pageCount]);

  useEffect(() => {
    if (!pdfDocument || !pageCount || !containerWidth) {
      return;
    }

    const enqueuePage = (pageNumber: number) => {
      const pageState = pageStatesRef.current[pageNumber];
      if (!pageState || pageState.status === "ready" || pageState.status === "loading") {
        return;
      }

      if (!queueSetRef.current.has(pageNumber)) {
        queueSetRef.current.add(pageNumber);
        renderQueueRef.current.push(pageNumber);
      }

      if (!isRenderingRef.current) {
        void drainQueue();
      }
    };

    const drainQueue = async () => {
      if (isRenderingRef.current) {
        return;
      }

      isRenderingRef.current = true;
      const activeGeneration = renderGenerationRef.current;

      while (renderQueueRef.current.length > 0) {
        const pageNumber = renderQueueRef.current.shift();
        if (!pageNumber) {
          continue;
        }

        queueSetRef.current.delete(pageNumber);

        try {
          setPageStates((current) => {
            const pageState = current[pageNumber];
            if (!pageState || pageState.status === "ready") {
              return current;
            }

            return {
              ...current,
              [pageNumber]: {
                ...pageState,
                status: "loading",
              },
            };
          });

          const page = await pdfDocument.getPage(pageNumber);
          if (renderGenerationRef.current !== activeGeneration) {
            page.cleanup?.();
            continue;
          }

          const baseViewport = page.getViewport({ scale: 1 });
          const scale = Math.max(Math.min(containerWidth / baseViewport.width, 2), 0.1);
          const viewport = page.getViewport({ scale });
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Canvas context unavailable");
          }

          canvas.width = Math.floor(viewport.width * pixelRatio);
          canvas.height = Math.floor(viewport.height * pixelRatio);
          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          if (renderGenerationRef.current !== activeGeneration) {
            page.cleanup?.();
            continue;
          }

          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", 0.92);
          });

          if (!blob) {
            throw new Error("Unable to encode page");
          }

          const nextUrl = URL.createObjectURL(blob);
          const previousUrl = pageUrlsRef.current[pageNumber];
          if (previousUrl) {
            URL.revokeObjectURL(previousUrl);
          }
          pageUrlsRef.current[pageNumber] = nextUrl;

          setPageStates((current) => ({
            ...current,
            [pageNumber]: {
              height: Math.round(viewport.height),
              src: nextUrl,
              status: "ready",
            },
          }));

          page.cleanup?.();
        } catch (error) {
          console.error(`[MagazineMobilePdfViewer] Failed to render page ${pageNumber}:`, error);
          setPageStates((current) => ({
            ...current,
            [pageNumber]: {
              height: current[pageNumber]?.height || estimatedHeight,
              src: current[pageNumber]?.src,
              status: "error",
            },
          }));
        }
      }

      isRenderingRef.current = false;
    };

    let eagerPageCount = 0;
    for (let pageNumber = 1; pageNumber <= pageCount && eagerPageCount < PRELOAD_PAGES; pageNumber += 1) {
      const pageState = pageStatesRef.current[pageNumber];
      if (pageState?.status === "ready") {
        continue;
      }

      enqueuePage(pageNumber);
      eagerPageCount += 1;
    }

    if (typeof IntersectionObserver === "undefined") {
      for (let pageNumber = PRELOAD_PAGES + 1; pageNumber <= pageCount; pageNumber += 1) {
        enqueuePage(pageNumber);
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const pageNumber = Number((entry.target as HTMLElement).dataset.pageNumber || "0");
          if (pageNumber > 0) {
            enqueuePage(pageNumber);
          }
        });
      },
      {
        root: null,
        rootMargin: OBSERVER_ROOT_MARGIN,
        threshold: 0.01,
      },
    );

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const node = pageNodesRef.current[pageNumber];
      if (node) {
        observer.observe(node);
      }
    }

    return () => observer.disconnect();
  }, [containerWidth, estimatedHeight, pageCount, pdfDocument]);

  return (
    <div ref={containerRef} className="w-full">
      {isDocumentLoading ? (
        readyPageCount > 0 ? (
          <div className="mb-4 flex items-center rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {text.loading}
          </div>
        ) : (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border bg-background px-6 py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {text.loading}
          </div>
        )
      ) : null}

      {documentError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-6 text-sm text-destructive">
          {documentError}
        </div>
      ) : null}

      {!isDocumentLoading && !documentError && pageCount > 0 ? (
        <div className="space-y-4">
          {Array.from({ length: pageCount }, (_, index) => {
            const pageNumber = index + 1;
            const pageState = pageStates[pageNumber];
            const pageHeight = pageState?.height || estimatedHeight;
            const pageLabel = `${text.page} ${pageNumber}`;
            const shouldRenderPaywallAfterPage =
              Boolean(paywallCard) &&
              typeof lockedAfterPage === "number" &&
              pageNumber === Math.min(pageCount, Math.max(lockedAfterPage, 1));

            return (
              <div key={pageNumber} className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <span>{pageLabel}</span>
                    <span>{title}</span>
                  </div>
                  <div
                    ref={(node) => {
                      pageNodesRef.current[pageNumber] = node;
                    }}
                    data-page-number={pageNumber}
                    className="relative w-full bg-white"
                    style={{ minHeight: `${pageHeight}px` }}
                  >
                    {pageState?.src ? (
                      <img
                        src={pageState.src}
                        alt={`${title} - ${pageLabel}`}
                        className="block h-auto w-full"
                        loading={pageNumber <= PRELOAD_PAGES ? "eager" : "lazy"}
                      />
                    ) : pageState?.status === "error" ? (
                      <div className="flex min-h-[240px] items-center justify-center px-6 py-12 text-center text-sm text-muted-foreground">
                        {text.error}
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[240px] items-center justify-center px-6 py-12 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {text.loading}
                      </div>
                    )}
                  </div>
                </div>
                {shouldRenderPaywallAfterPage ? paywallCard : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
