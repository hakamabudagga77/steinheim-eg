"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, type Transition } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** The panel. Provides its own positioning + entrance animation, and should
   *  carry role="dialog" aria-modal + an accessible name (aria-label /
   *  aria-labelledby). */
  children: ReactNode;
  /** Full className for the backdrop element (position, colour, blur, z-index). */
  backdropClassName: string;
  /** Backdrop entrance timing. Entrance only — see the note below on the missing exit. */
  backdropTransition?: Transition;
  /**
   * true  → the backdrop is the centring container and `children` render inside it.
   * false → backdrop and `children` render as siblings; the caller positions the panel itself.
   */
  centered?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The one rule these overlays kept getting wrong: never wrap a modal that
// closes via navigation in AnimatePresence with an exit animation. Selecting a
// result / following a link closes the modal in the same tick as a client-side
// navigation, and Framer Motion's exit lifecycle can be interrupted by that
// navigation, leaving an invisible but pointer-events:auto backdrop stuck over
// the whole page. Rendering nothing when closed unmounts synchronously and can
// never get stuck. Entrance animations are safe and kept; there is deliberately
// no exit. New modals should build on this component instead of re-deriving the
// pattern (which is how the bug recurred four times).
//
// Accessibility is handled here so every adopter gets it for free: focus moves
// into the modal on open, Tab/Shift+Tab are trapped within it, Escape closes,
// and focus returns to whatever was focused before it opened. The rendered
// subtree is wrapped in a display:contents element (zero layout impact) purely
// to give the focus trap a root to scope its queries to.
export default function Modal({
  open,
  onClose,
  children,
  backdropClassName,
  backdropTransition = { duration: 0.25 },
  centered = false,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Read the latest close config through refs so the focus lifecycle below can
  // depend on `open` alone. Callers frequently pass an inline onClose (a fresh
  // reference each render); keying the effect off it would re-run focus-in /
  // focus-restore on every render and thrash focus instead of settling it.
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);
  useEffect(() => {
    onCloseRef.current = onClose;
    closeOnEscapeRef.current = closeOnEscape;
  });

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    // Synchronous initial focus: this effect runs after the DOM commit, so the
    // panel and its focusables already exist. Deliberately not deferred via
    // requestAnimationFrame — rAF only fires on painted frames, so in a
    // backgrounded/occluded tab (or a headless test) the focus would silently
    // never happen.
    {
      const root = rootRef.current;
      if (root) {
        const focusables = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        (focusables[0] ?? root).focus();
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (closeOnEscapeRef.current) onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const root = rootRef.current;
      if (!root) return;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !root.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const backdrop = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={backdropTransition}
      className={backdropClassName}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      {centered ? children : null}
    </motion.div>
  );

  return (
    <div ref={rootRef} style={{ display: "contents" }}>
      {centered ? (
        backdrop
      ) : (
        <>
          {backdrop}
          {children}
        </>
      )}
    </div>
  );
}
