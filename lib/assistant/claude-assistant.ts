import productsData from "@/data/products.json";
import finishesData from "@/data/finishes.json";
import { egyptCollectionPositioning } from "@/data/egypt-master-catalog";

export type MessageRole = "user" | "assistant";
export type ConversationMessage = { role: MessageRole; content: string };

function buildProductIndex(): string {
  const lines: string[] = [];

  for (const series of productsData.series) {
    const pos = egyptCollectionPositioning[series.id as keyof typeof egyptCollectionPositioning];
    lines.push(`## ${series.name} (Code ${series.code}, ${series.shape})`);
    lines.push(`${pos?.role ?? ""} Best for: ${pos?.bestFor.join(", ") ?? ""}`);
    if (pos?.caution) lines.push(`Note: ${pos.caution}`);
    lines.push(`Finishes: ${series.finishes.join(", ")}`);

    const seriesProducts = productsData.products.filter((p) => p.series === series.id);
    for (const p of seriesProducts) {
      const mat = p.material ? ` [${p.material}]` : "";
      const variants = p.variants
        .map((v) => {
          const fn = finishesData.find((f) => f.id === v.finish)?.name ?? v.finish;
          return `${fn}=${v.model}@${v.price}`;
        })
        .join(" | ");
      lines.push(`${series.name} ${p.name}${mat}: ${variants}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildFinishGuide(): string {
  return finishesData
    .map((f) => {
      const sn = f.series.map((sid) => productsData.series.find((s) => s.id === sid)?.name ?? sid).join(", ");
      return `${f.name} (${f.type}) — in ${sn}. Care: ${f.careInstructions}`;
    })
    .join("\n");
}

function computePriceExtremes(): string {
  let cheapest = { name: "", price: Infinity, model: "", finish: "", series: "" };
  let mostExpensive = { name: "", price: 0, model: "", finish: "", series: "" };

  for (const p of productsData.products) {
    const seriesName = productsData.series.find((s) => s.id === p.series)?.name ?? p.series;
    for (const v of p.variants) {
      const fn = finishesData.find((f) => f.id === v.finish)?.name ?? v.finish;
      if (v.price < cheapest.price) {
        cheapest = { name: `${seriesName} ${p.name}`, price: v.price, model: v.model, finish: fn, series: seriesName };
      }
      if (v.price > mostExpensive.price) {
        mostExpensive = { name: `${seriesName} ${p.name}`, price: v.price, model: v.model, finish: fn, series: seriesName };
      }
    }
  }

  const seriesCheapest: string[] = [];
  for (const s of productsData.series) {
    const prods = productsData.products.filter((p) => p.series === s.id);
    let min = Infinity;
    let minName = "";
    for (const p of prods) {
      for (const v of p.variants) {
        if (v.price < min) { min = v.price; minName = `${s.name} ${p.name}`; }
      }
    }
    if (min < Infinity) seriesCheapest.push(`${s.name} starts at ${min.toLocaleString()} LE (${minName})`);
  }

  return `PRICE FACTS:
Cheapest: ${cheapest.name} in ${cheapest.finish} — ${cheapest.model}, ${cheapest.price.toLocaleString()} LE
Most expensive: ${mostExpensive.name} in ${mostExpensive.finish} — ${mostExpensive.model}, ${mostExpensive.price.toLocaleString()} LE
${seriesCheapest.join(". ")}.
Total active product families: ${productsData.products.length}. Total variants (including finishes): ${productsData.products.reduce((sum, p) => sum + p.variants.length, 0)}.
4 collections: Joy (round, warm), Up (streamline, trade workhorse), Art (stainless steel, architectural), Quatro (geometric, bold).
6 finishes: Chrome, Brushed Nickel, Matte Black, Brushed Gold, Coffee Gold (Joy only), Metal Gun (Up only).`;
}

function buildSystemPrompt(): string {
  const productIndex = buildProductIndex();
  const finishGuide = buildFinishGuide();
  const priceExtremes = computePriceExtremes();

  return `You are the Steinheim Egypt AI Concierge — premium bathroom fixture consultant for the Egypt market.
Sound like the best showroom consultant in Cairo: assured, warm, specific. Always cite model numbers and prices from the index below. Mirror the customer's language (Arabic→Arabic, English→English). 2-4 paragraphs max.

CRITICAL RULES:
- ONLY cite products listed in the PRODUCT INDEX below. Never invent products, prices, or model numbers.
- Prices are retail-reference LE. Never quote trade/B2B pricing — say "submit via the trade project board for trade pricing."
- Never state stock, delivery dates, or lead times — say "confirmed by the Steinheim Egypt team after your enquiry."
- Never claim "Made in Germany." Say "precision-engineered" or "European-engineered."
- For competitors (Grohe, Hansgrohe, Duravit, etc.): don't attack — redirect to Steinheim strengths (Sedal cartridge lifetime warranty, PVD finishes, curated Egypt range).
- If asked about a product NOT in the index, say "That product is not currently in the active Egypt catalogue" — never make up details.

COLLECTIONS:
Joy = warm, round lines, broadest range (5 finishes incl. Coffee Gold). Best for villas, hotel suites, luxury residential.
Up = streamlined, complete range, trade workhorse (5 finishes incl. Metal Gun). Best for hotels, compounds, developers.
Art = stainless steel bodies, architectural statement (3 finishes). Best for architect-led projects, boutique hospitality.
Quatro = geometric, linear, bold (3 finishes). Best for modern apartments, commercial washrooms, powder rooms.

FINISH MATCHING:
brass/gold/warm accents → Brushed Gold or Coffee Gold. chrome/silver/steel → Chrome or Brushed Nickel. dark/moody spaces → Matte Black. industrial/gunmetal → Metal Gun.

PRODUCT TYPE GUIDE:
Basin Mixer = standard deck-mounted single-lever. Tall Basin Mixer = elevated for countertop/vessel basins. Wall-Mounted Basin Mixer = concealed in-wall, cleaner look for floating vanities.
Concealed Shower = in-wall thermostatic with rain head + hand shower. Shower Column = exposed with bath mixer, rain head + hand shower. Free-Standing Bath Mixer = floor-mounted tub filler.
Accessories Set = 4pc stainless steel (towel ring, robe hook, paper holder, towel bar). Bidet Spray = handheld shataff. Click-Clack Waste = pop-up basin drain. Angle Valve = 1/2" x 1/2" shut-off valve.

HOTEL/HOSPITALITY:
Standard rooms → Up collection (complete, repeatable, cost-effective). Suites → Joy (warmer, more premium). Recommend "Smart Room Calculator on our trade page" for room-based scheduling.

WARRANTY:
Sedal cartridge = lifetime warranty. Chrome & Brushed Nickel finish = 10-year. Neoperl aerator & body = 5-year. PVD finishes (Brushed Gold, Coffee Gold, Matte Black, Metal Gun) = 3-year. Egypt only, manufacturing defects, proper use.

SPECS (common across all mixer products):
Brass body (Art = stainless steel). 35mm Sedal cartridge. Neoperl aerator. 1/2" connection. 0.5-5 bar operating pressure (16 bar max). 90°C max temp. DIA 35mm mounting hole for deck-mounted.

CARE:
Soft damp cloth + mild soap, dry immediately. Never use vinegar, bleach, abrasive cleaners. PVD finishes need extra gentle care. Hard water → wipe dry after each use.

${priceExtremes}

FAQ — use these for common questions:
Q: Where can I buy / is there a showroom? → "Contact the Steinheim Egypt team through the trade project board or our AI concierge for showroom and purchasing information."
Q: Where is Steinheim from / origin? → "Steinheim is a precision-engineered bathroom fixture brand available in Egypt through El Sharbatly International Group."
Q: Do you do custom finishes? → "The Egypt 2026 catalogue offers 6 curated finishes. Custom finishes are not currently available."
Q: What's included in the Concealed Shower? → "Overhead rain shower head, hand shower, diverter, and in-wall rough-in valve body."
Q: What's included in the Shower Column? → "Exposed column with overhead rain shower, hand shower, bath mixer, and diverter."
Q: What's in the Accessories Set? → "4-piece stainless steel set: towel ring, robe hook, paper holder, and towel bar."
Q: Do you install? → "Steinheim provides the fixtures. Installation should be handled by your contractor or plumber."
Q: Payment / how to order? → "Browse products on the website, add to your project board, and submit to the Steinheim Egypt trade team."
Q: What's the difference between Concealed Shower and Shower Column? → "Concealed Shower is built into the wall for a cleaner look. Shower Column is exposed/surface-mounted and includes a bath mixer."

${finishGuide}

PRODUCT INDEX (Steinheim Egypt 2026, prices in LE retail-reference)
Format: Finish=ModelNumber@Price. When responding, always format as: "Product Name in Finish — ModelNumber, Price LE retail-reference"

${productIndex}`;
}

function buildLightSystemPrompt(): string {
  const priceExtremes = computePriceExtremes();

  return `You are the Steinheim Egypt AI Concierge — premium bathroom fixture consultant.
Be warm, specific, cite model numbers and prices. Mirror user's language. 2-3 paragraphs max.

RULES: Only cite products from index below. Prices=retail-reference LE. Never invent products. Never state stock/delivery. Never claim "Made in Germany." Never quote trade pricing.

${priceExtremes}

COLLECTIONS: Joy=warm/round/5 finishes/villas+suites. Up=streamline/complete/5 finishes/hotels+trade. Art=stainless steel/3 finishes/architectural. Quatro=geometric/3 finishes/modern.
6 FINISHES: Chrome, Brushed Nickel, Matte Black, Brushed Gold, Coffee Gold (Joy), Metal Gun (Up).
WARRANTY: Sedal=lifetime. Chrome/BN=10yr. Body=5yr. PVD=3yr.
SPECS: Brass body (Art=SS). 35mm Sedal. Neoperl. 1/2". 0.5-5bar.

KEY PRODUCTS (prices in LE):
Joy: Basin Mixer 4950-6300 | Tall Basin 6550-8300 | Wall-Mounted 6600-8400 | Concealed Shower 11700-16600 | Shower Column 12850-17100 | Free-Standing 35000-39200 | Accessories 3650-4600 | Bidet Spray 3250-4100
Up: Basin Mixer 5500-6500 | Tall Basin 8200-9900 | Wall-Mounted 6800-7900 | Concealed Shower 11350-13200 | Shower Column 13350-16750 | Free-Standing 25400-32400 | Accessories 4500-4700
Art: Basin Mixer 5900-6300 | Tall Basin 10800-11400 | Wall-Mounted 8850-9350 | Concealed Shower 14500-15300 | Free-Standing 37200-39000
Quatro: Basin Mixer 5250-6700 | Tall Basin 7900-9700 | Wall-Mounted 7500-8300 | Concealed Shower 11700-13550

Format response as: "Product Name in Finish — ModelNumber, Price LE"`;
}

const SYSTEM_PROMPT = buildSystemPrompt();
const LIGHT_SYSTEM_PROMPT = buildLightSystemPrompt();

type Provider = "anthropic" | "groq";

function detectProvider(): { provider: Provider; apiKey: string; model: string } {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return {
      provider: "anthropic",
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
    };
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      provider: "groq",
      apiKey: groqKey,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    };
  }

  throw new Error("No AI API key configured (set ANTHROPIC_API_KEY or GROQ_API_KEY)");
}

const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] as const;

async function callGroqStream(
  messages: ConversationMessage[],
  apiKey: string,
  model: string,
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const isLightModel = model.includes("8b");
  const systemPrompt = isLightModel ? LIGHT_SYSTEM_PROMPT : SYSTEM_PROMPT;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: isLightModel ? 800 : 1200,
      temperature: 0.3,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onDelta(delta);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return fullText;
}

function parseRetryDelay(errMsg: string): number {
  const match = errMsg.match(/try again in (\d+\.?\d*)s/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000);
  const minMatch = errMsg.match(/try again in (\d+)m/i);
  if (minMatch) return parseInt(minMatch[1]) * 60000;
  return 0;
}

async function streamGroq(
  messages: ConversationMessage[],
  apiKey: string,
  preferredModel: string,
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const models = [preferredModel, ...GROQ_MODELS.filter((m) => m !== preferredModel)];

  for (const model of models) {
    try {
      return await callGroqStream(messages, apiKey, model, onDelta, signal);
    } catch (err) {
      const msg = (err as Error).message;
      if (!msg.includes("429")) throw err;

      const delay = parseRetryDelay(msg);
      if (delay > 0 && delay <= 20000) {
        console.log(`[assistant] ${model} rate-limited, waiting ${delay}ms and retrying...`);
        await new Promise((r) => setTimeout(r, delay));
        try {
          return await callGroqStream(messages, apiKey, model, onDelta, signal);
        } catch {
          // fall through to next model
        }
      }

      if (model !== models[models.length - 1]) {
        console.log(`[assistant] ${model} rate-limited, trying fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw new Error("All Groq models rate-limited");
}

async function streamAnthropic(
  messages: ConversationMessage[],
  apiKey: string,
  model: string,
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  let fullText = "";

  const stream = client.messages.stream({
    model,
    max_tokens: 1200,
    temperature: 0.3,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  if (signal) {
    signal.addEventListener("abort", () => stream.abort(), { once: true });
  }

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      onDelta(event.delta.text);
    }
  }

  return fullText;
}

export async function streamAssistant(
  messages: ConversationMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<{ text: string; brain: string }> {
  const { provider, apiKey, model } = detectProvider();

  const claudeMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  if (claudeMessages.length === 0) {
    throw new Error("No messages provided");
  }

  let fullText: string;

  if (provider === "anthropic") {
    fullText = await streamAnthropic(claudeMessages, apiKey, model, onDelta, signal);
  } else {
    fullText = await streamGroq(claudeMessages, apiKey, model, onDelta, signal);
  }

  return { text: fullText, brain: `${model}+catalogue-grounded` };
}
