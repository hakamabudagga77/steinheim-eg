import { unstable_cache } from "next/cache";

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

async function adminFetch<T>(endpoint: string, revalidate = 300): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/${endpoint}`,
    { headers: { "X-Shopify-Access-Token": token }, next: { revalidate } }
  );
  if (!res.ok) throw new Error(`Shopify API ${endpoint}: ${res.status}`);
  return res.json();
}

async function adminWrite<T>(endpoint: string, method: "POST" | "PUT", body: unknown): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`https://${STORE_DOMAIN}/admin/api/${API_VERSION}/${endpoint}`, {
    method,
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shopify API ${method} ${endpoint}: ${res.status} ${text}`);
  }
  return res.json();
}

async function adminGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  revalidate = 600
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Shopify GraphQL: ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(`Shopify GraphQL: ${JSON.stringify(data.errors)}`);
  return data.data as T;
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  inventory_item_id: number;
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
  status: string;
  image: { src: string } | null;
  variants: ShopifyVariant[];
}

const cachedFetchAllProducts = unstable_cache(
  async () => {
    const data = await adminFetch<{ products: ShopifyProduct[] }>(
      "products.json?limit=250&fields=id,title,handle,tags,product_type,status,image,variants"
    );
    return data.products;
  },
  ["shopify-products"],
  { revalidate: 300 }
);

export async function fetchAllProducts(): Promise<ShopifyProduct[]> {
  return cachedFetchAllProducts();
}

export async function updateProductStatus(productId: number, status: "active" | "draft"): Promise<ShopifyProduct> {
  const data = await adminWrite<{ product: ShopifyProduct }>(`products/${productId}.json`, "PUT", {
    product: { id: productId, status },
  });
  return data.product;
}

export async function updateVariantPrice(variantId: number, price: string): Promise<ShopifyVariant> {
  const data = await adminWrite<{ variant: ShopifyVariant }>(`variants/${variantId}.json`, "PUT", {
    variant: { id: variantId, price },
  });
  return data.variant;
}

export interface ShopifyLocation {
  id: number;
  name: string;
}

export async function fetchLocations(): Promise<ShopifyLocation[]> {
  const data = await adminFetch<{ locations: ShopifyLocation[] }>("locations.json", 3600);
  return data.locations;
}

export async function setInventoryLevel(
  inventoryItemId: number,
  locationId: number,
  available: number
): Promise<void> {
  await adminWrite("inventory_levels/set.json", "POST", {
    location_id: locationId,
    inventory_item_id: inventoryItemId,
    available,
  });
}

export function buildCheckoutUrl(items: Array<{ variantId: number; quantity: number }>): string {
  const lines = items.map((i) => `${i.variantId}:${i.quantity}`).join(",");
  return `https://${STORE_DOMAIN}/cart/${lines}`;
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string;
  email: string | null;
  created_at: string;
  currency: string;
  total_price: string;
  financial_status: string | null;
  fulfillment_status: string | null;
  customer: { id: number; first_name: string | null; last_name: string | null; email: string | null } | null;
  line_items: Array<{ title: string; quantity: number }>;
}

export interface ShopifyCustomer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  orders_count: number;
  total_spent: string;
  created_at: string;
  note: string | null;
}

const cachedFetchOrders = unstable_cache(
  async (limit: number) => {
    const data = await adminFetch<{ orders: ShopifyOrder[] }>(
      `orders.json?status=any&limit=${limit}&fields=id,order_number,name,email,created_at,currency,total_price,financial_status,fulfillment_status,customer,line_items`,
      60
    );
    return data.orders;
  },
  ["shopify-orders"],
  { revalidate: 60 }
);

export async function fetchOrders(limit = 250): Promise<ShopifyOrder[]> {
  return cachedFetchOrders(limit);
}

const cachedFetchCustomers = unstable_cache(
  async (limit: number) => {
    const data = await adminFetch<{ customers: ShopifyCustomer[] }>(
      `customers.json?limit=${limit}&fields=id,first_name,last_name,email,phone,orders_count,total_spent,created_at,note`,
      60
    );
    return data.customers;
  },
  ["shopify-customers"],
  { revalidate: 60 }
);

export async function fetchCustomers(limit = 50): Promise<ShopifyCustomer[]> {
  return cachedFetchCustomers(limit);
}

export async function updateCustomer(
  customerId: number,
  updates: { phone?: string; email?: string; note?: string }
): Promise<ShopifyCustomer> {
  const data = await adminWrite<{ customer: ShopifyCustomer }>(`customers/${customerId}.json`, "PUT", {
    customer: { id: customerId, ...updates },
  });
  return data.customer;
}

export interface ShopifyFulfillmentOrder {
  id: number;
  status: string;
  request_status: string;
  line_items: Array<{ id: number; quantity: number; fulfillment_order_id: number }>;
}

export async function fetchFulfillmentOrders(orderId: number): Promise<ShopifyFulfillmentOrder[]> {
  const data = await adminFetch<{ fulfillment_orders: ShopifyFulfillmentOrder[] }>(
    `orders/${orderId}/fulfillment_orders.json`,
    0
  );
  return data.fulfillment_orders;
}

export async function createFulfillment(
  fulfillmentOrderId: number,
  options: { trackingNumber?: string; trackingCompany?: string; trackingUrl?: string; notifyCustomer: boolean }
): Promise<void> {
  await adminWrite("fulfillments.json", "POST", {
    fulfillment: {
      line_items_by_fulfillment_order: [{ fulfillment_order_id: fulfillmentOrderId }],
      notify_customer: options.notifyCustomer,
      tracking_info:
        options.trackingNumber || options.trackingCompany || options.trackingUrl
          ? {
              number: options.trackingNumber || undefined,
              company: options.trackingCompany || undefined,
              url: options.trackingUrl || undefined,
            }
          : undefined,
    },
  });
}

export interface ShopPolicy {
  id: string;
  type: string;
  title: string;
  body: string;
}

export async function fetchShopPolicies(): Promise<ShopPolicy[]> {
  const data = await adminGraphQL<{ shop: { shopPolicies: ShopPolicy[] } }>(`
    query {
      shop {
        shopPolicies {
          id
          type
          title
          body
        }
      }
    }
  `);
  return data.shop.shopPolicies;
}

export async function updateShopPolicy(type: string, body: string): Promise<ShopPolicy> {
  const data = await adminGraphQL<{
    shopPolicyUpdate: { shopPolicy: ShopPolicy; userErrors: Array<{ field: string; message: string }> };
  }>(
    `
    mutation UpdatePolicy($policy: ShopPolicyInput!) {
      shopPolicyUpdate(shopPolicy: $policy) {
        shopPolicy { id type title body }
        userErrors { field message }
      }
    }
  `,
    { policy: { type, body } },
    0
  );
  if (data.shopPolicyUpdate.userErrors.length > 0) {
    throw new Error(data.shopPolicyUpdate.userErrors.map((e) => e.message).join("; "));
  }
  return data.shopPolicyUpdate.shopPolicy;
}

export { STORE_DOMAIN };
