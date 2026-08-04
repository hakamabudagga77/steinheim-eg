/**
 * Single escaping helper shared by every server-side email builder. Before
 * this existed, trade-lead-email.ts, contact-lead-email.ts and
 * restock-alert-email.ts each carried their own copy, and the daily-digest
 * builder interpolated user fields unescaped entirely. One definition keeps
 * the behavior identical everywhere and closes that gap.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
