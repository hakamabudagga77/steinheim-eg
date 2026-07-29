const baseUrl = new URL(process.argv[2] || process.env.SITE_CRAWL_BASE_URL || "http://127.0.0.1:3000");
const concurrency = Math.max(1, Number(process.env.SITE_CRAWL_CONCURRENCY || 8));
const timeoutMs = Math.max(1_000, Number(process.env.SITE_CRAWL_TIMEOUT_MS || 20_000));

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attributes(tag) {
  const result = {};
  const pattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    result[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => match[0]);
}

function textTags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "gi"))].map((match) =>
    decodeHtml(match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
  );
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Steinheim pre-launch crawl verifier" },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function mapLimit(values, limit, worker) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await worker(values[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, run));
  return results;
}

function localUrl(url) {
  const source = new URL(url, baseUrl);
  return new URL(`${source.pathname}${source.search}`, baseUrl);
}

const sitemapResponse = await fetchWithTimeout(new URL("/sitemap.xml", baseUrl));
if (!sitemapResponse.ok) {
  throw new Error(`Unable to load sitemap: ${sitemapResponse.status} ${sitemapResponse.statusText}`);
}

const sitemapXml = await sitemapResponse.text();
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeHtml(match[1]));
if (sitemapUrls.length === 0) {
  throw new Error("The sitemap contains no URLs.");
}

const errors = [];
const pages = await mapLimit(sitemapUrls, concurrency, async (sitemapUrl) => {
  const target = localUrl(sitemapUrl);

  try {
    const response = await fetchWithTimeout(target);
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      errors.push(`${target.pathname}: HTTP ${response.status}`);
      return null;
    }
    if (!contentType.includes("text/html")) {
      errors.push(`${target.pathname}: expected HTML but received ${contentType || "unknown content type"}`);
      return null;
    }

    const html = await response.text();
    const titles = textTags(html, "title").filter(Boolean);
    const metaTags = tags(html, "meta").map(attributes);
    const linkTags = tags(html, "link").map(attributes);
    const anchors = tags(html, "a").map(attributes);
    const descriptions = metaTags.filter((tag) => tag.name?.toLowerCase() === "description").map((tag) => tag.content);
    const robots = metaTags.find((tag) => tag.name?.toLowerCase() === "robots")?.content?.toLowerCase() || "";
    const canonicals = linkTags.filter((tag) => tag.rel?.toLowerCase() === "canonical").map((tag) => tag.href);
    const alternates = linkTags.filter((tag) => tag.rel?.toLowerCase() === "alternate");
    const h1Count = (html.match(/<h1\b/gi) || []).length;

    if (titles.length !== 1) errors.push(`${target.pathname}: expected one title, found ${titles.length}`);
    if (descriptions.length !== 1 || !descriptions[0]?.trim()) {
      errors.push(`${target.pathname}: expected one non-empty meta description`);
    }
    if (canonicals.length !== 1) {
      errors.push(`${target.pathname}: expected one canonical, found ${canonicals.length}`);
    } else if (new URL(canonicals[0], baseUrl).pathname !== target.pathname) {
      errors.push(`${target.pathname}: canonical points to ${canonicals[0]}`);
    }
    if (robots.includes("noindex")) errors.push(`${target.pathname}: sitemap URL is marked noindex`);
    if (h1Count !== 1) errors.push(`${target.pathname}: expected one H1, found ${h1Count}`);

    for (const language of ["en", "ar", "x-default"]) {
      if (!alternates.some((tag) => tag.hreflang?.toLowerCase() === language)) {
        errors.push(`${target.pathname}: missing ${language} hreflang`);
      }
    }

    const internalLinks = anchors
      .map((tag) => tag.href)
      .filter(Boolean)
      .map((href) => new URL(href, target))
      .filter((url) => url.origin === baseUrl.origin)
      .filter((url) => !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/admin/"))
      .map((url) => `${url.pathname}${url.search}`);

    return {
      path: target.pathname,
      locale: target.pathname.split("/")[1] || "root",
      title: titles[0] || "",
      description: descriptions[0] || "",
      internalLinks,
    };
  } catch (error) {
    errors.push(`${target.pathname}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
});

const validPages = pages.filter(Boolean);
for (const field of ["title", "description"]) {
  const values = new Map();
  for (const page of validPages) {
    const key = `${page.locale}:${page[field]}`;
    const matches = values.get(key) || [];
    matches.push(page.path);
    values.set(key, matches);
  }
  for (const matches of values.values()) {
    if (matches.length > 1) errors.push(`Duplicate ${field}: ${matches.join(", ")}`);
  }
}

const internalPaths = [
  ...new Set(validPages.flatMap((page) => page.internalLinks).filter((path) => !path.startsWith("/_next/"))),
];
await mapLimit(internalPaths, concurrency, async (path) => {
  try {
    const response = await fetchWithTimeout(new URL(path, baseUrl));
    if (!response.ok) errors.push(`${path}: internal link returned HTTP ${response.status}`);
  } catch (error) {
    errors.push(`${path}: internal link failed (${error instanceof Error ? error.message : String(error)})`);
  }
});

console.log(
  JSON.stringify(
    {
      baseUrl: baseUrl.href,
      sitemapUrls: sitemapUrls.length,
      htmlPagesChecked: validPages.length,
      internalLinksChecked: internalPaths.length,
      errors,
    },
    null,
    2
  )
);

if (errors.length > 0) process.exitCode = 1;
