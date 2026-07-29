"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import HTMLFlipBook from "react-pageflip";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";

const PAGES_BASE = "/catalogues/pages/steinheim-2026";
const PDF_HREF = "/catalogues/steinheim-catalogue-2026.pdf";
const LOAD_MARGIN = 2;

type Manifest = { pageCount: number; width: number; height: number };

function pageSrc(index: number) {
  const num = String(index + 1).padStart(3, "0");
  return `${PAGES_BASE}/page-${num}.webp`;
}

export default function CatalogueFlipbookModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("catalogue3d");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([0, 1, 2]));

  useEffect(() => {
    let cancelled = false;
    fetch(`${PAGES_BASE}/manifest.json`)
      .then((res) => res.json())
      .then((data: Manifest) => {
        if (!cancelled) setManifest(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function expandWindow(page: number) {
    setLoadedPages((prev) => {
      const next = new Set(prev);
      for (let i = page - LOAD_MARGIN; i <= page + LOAD_MARGIN; i++) next.add(i);
      return next;
    });
  }

  function handleFlip(event: { data: number }) {
    setCurrentPage(event.data);
    expandWindow(event.data);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      centered
      backdropClassName="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 px-2 py-4 sm:px-6 sm:py-8"
    >
      <div
        style={{ perspective: 1600 }}
        className="relative flex h-[92svh] w-full max-w-[1400px] items-center justify-center"
      >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalogue-flipbook-title"
        initial={{ opacity: 0, scale: 0.85, y: 40, rotateX: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="relative flex h-full w-full flex-col items-center justify-center"
        onClick={(event) => event.stopPropagation()}
        data-lenis-prevent
      >
        <h2 id="catalogue-flipbook-title" className="sr-only">
          {t("headline")}
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeLabel")}
          className="absolute end-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition hover:bg-white hover:text-black sm:end-0 sm:-top-2"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>

        {!manifest ? (
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/50">{t("loading")}</p>
        ) : (
          <>
            <div className="flex w-full flex-1 items-center justify-center overflow-hidden">
              <HTMLFlipBook
                className=""
                style={{}}
                startPage={0}
                size="stretch"
                width={manifest.width}
                height={manifest.height}
                minWidth={280}
                maxWidth={1400}
                minHeight={198}
                maxHeight={992}
                drawShadow
                flippingTime={500}
                usePortrait
                startZIndex={0}
                autoSize
                maxShadowOpacity={0.5}
                showCover={false}
                mobileScrollSupport={false}
                clickEventForward
                useMouseEvents
                swipeDistance={30}
                showPageCorners
                disableFlipByClick={false}
                onFlip={handleFlip}
              >
                {Array.from({ length: manifest.pageCount }, (_, index) => (
                  <div key={index} className="bg-[#0a0a0a]">
                    {loadedPages.has(index) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pageSrc(index)}
                        alt=""
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                    ) : (
                      <div className="h-full w-full bg-[#141414]" />
                    )}
                  </div>
                ))}
              </HTMLFlipBook>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-white/45">
              <span>{t("pageOf", { current: currentPage + 1, total: manifest.pageCount })}</span>
              <a href={PDF_HREF} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-white">
                {t("downloadPdf")}
              </a>
            </div>
          </>
        )}
      </motion.div>
      </div>
    </Modal>
  );
}
