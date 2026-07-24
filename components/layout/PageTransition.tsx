import type { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  // Do not hide server-rendered page content behind a hydration-dependent
  // opacity animation. It delays the first visible paint and can turn an H1
  // into the LCP element several seconds after the HTML is already available.
  // Individual sections retain their own in-view motion treatments.
  return children;
}
