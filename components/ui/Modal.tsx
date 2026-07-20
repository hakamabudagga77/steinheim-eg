"use client";

import { useEffect, type ReactNode } from "react";
import { motion, type Transition } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** The panel. Provides its own positioning + entrance animation. */
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

// The one rule these overlays kept getting wrong: never wrap a modal that
// closes via navigation in AnimatePresence with an exit animation. Selecting a
// result / following a link closes the modal in the same tick as a client-side
// navigation, and Framer Motion's exit lifecycle can be interrupted by that
// navigation, leaving an invisible but pointer-events:auto backdrop stuck over
// the whole page. Rendering nothing when closed unmounts synchronously and can
// never get stuck. Entrance animations are safe and kept; there is deliberately
// no exit. New modals should build on this component instead of re-deriving the
// pattern (which is how the bug recurred four times).
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
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape, onClose]);

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

  if (centered) return backdrop;
  return (
    <>
      {backdrop}
      {children}
    </>
  );
}
