const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "steinheim.myshopify.com";
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET ?? "";
const API_VERSION = "2026-04";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const res = await fetch(`https://${STORE_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) throw new Error(`Shopify token exchange failed: ${res.status}`);

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };
  return cachedToken.token;
}

async function adminFetch<T>(endpoint: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/${endpoint}`,
    { headers: { "X-Shopify-Access-Token": token }, next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`Shopify API ${endpoint}: ${res.status}`);
  return res.json();
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  inventory_quantity: number;
  option1: string | null;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  tags: string;
  product_type: string;
  variants: ShopifyVariant[];
}

export async function fetchAllProducts(): Promise<ShopifyProduct[]> {
  const data = await adminFetch<{ products: ShopifyProduct[] }>(
    "products.json?limit=250&fields=id,title,handle,tags,product_type,variants"
  );
  return data.products;
}

export function buildCheckoutUrl(items: Array<{ variantId: number; quantity: number }>): string {
  const lines = items.map((i) => `${i.variantId}:${i.quantity}`).join(",");
  return `https://${STORE_DOMAIN}/cart/${lines}`;
}

export { STORE_DOMAIN };
