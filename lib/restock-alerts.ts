export interface RestockAlertSubscription {
  id: string;
  email: string;
  productSlug: string;
  finish: string;
  priceAtSubscription: number;
  createdAt: string;
  notifiedAt: string | null;
}

export interface RestockAlertSubmission {
  email: string;
  productSlug: string;
  finish: string;
}

export function sanitizeRestockAlertSubmission(value: unknown): RestockAlertSubmission | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Record<keyof RestockAlertSubmission, unknown>>;
  const email = typeof source.email === "string" ? source.email.trim().slice(0, 200) : "";
  const productSlug = typeof source.productSlug === "string" ? source.productSlug.trim().slice(0, 120) : "";
  const finish = typeof source.finish === "string" ? source.finish.trim().slice(0, 60) : "";
  if (!email || !productSlug || !finish || !/^\S+@\S+\.\S+$/.test(email)) return null;
  return { email, productSlug, finish };
}
