import {
  egyptCollectionPositioning,
  egyptFinishes,
  egyptProducts,
  egyptSeries,
  egyptTradeRules,
  egyptWarrantyRules,
  formatEgyptPrice,
  getAvailableEgyptFinishesForSeries,
  getEgyptProductsBySeries,
  type EgyptFinishId,
  type EgyptProduct,
  type EgyptSeriesId,
} from "@/data/egypt-master-catalog";
import { officialProjects, verifiedBrandFacts } from "@/data/brand-knowledge";

export type AssistantMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type AssistantAction =
  | { type: "product"; slug: string; finish?: string; label: string; href: string }
  | { type: "series"; series: EgyptSeriesId; finish?: string; label: string; href: string }
  | { type: "quote"; label: string; href: string }
  | { type: "projects"; label: string; href: string }
  | { type: "compare"; label: string; href: string }
  | { type: "trade"; label: string; href: string }
  | null;

export type AssistantResult = {
  text: string;
  action: AssistantAction;
  brain: "catalog-rules-v1";
};

const seriesAliases: Record<EgyptSeriesId, string[]> = {
  joy: ["joy"],
  up: ["up"],
  art: ["art"],
  quatro: ["quatro", "quattro"],
};

const finishAliases: Record<EgyptFinishId, string[]> = {
  chrome: ["chrome", "polished"],
  "brushed-nickel": ["brushed nickel", "nickel", "brushed"],
  "matte-black": ["matte black", "black", "اسود", "أسود"],
  "brushed-gold": ["brushed gold", "gold", "دهبي", "ذهب"],
  "coffee-gold": ["coffee gold", "coffee", "كوفي"],
  "metal-gun": ["metal gun", "gunmetal", "gun metal"],
};

function normalize(input: string) {
  return input.toLowerCase().normalize("NFKC").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

function isArabic(input: string) {
  return /[\u0600-\u06FF]/.test(input);
}

function findSeries(input: string): EgyptSeriesId | null {
  const lower = normalize(input);
  for (const [series, aliases] of Object.entries(seriesAliases) as Array<[EgyptSeriesId, string[]]>) {
    if (aliases.some((alias) => lower.includes(alias))) return series;
  }
  return null;
}

function findFinish(input: string): EgyptFinishId | null {
  const lower = normalize(input);
  if (lower.includes("coffee gold") || lower.includes("coffee")) return "coffee-gold";
  if (lower.includes("metal gun") || lower.includes("gunmetal") || lower.includes("gun metal")) return "metal-gun";
  for (const [finish, aliases] of Object.entries(finishAliases) as Array<[EgyptFinishId, string[]]>) {
    if (aliases.some((alias) => lower.includes(alias))) return finish;
  }
  return null;
}

function finishName(finish: string) {
  return egyptFinishes.find((entry) => entry.id === finish)?.name ?? finish;
}

function seriesName(series: string) {
  return egyptSeries.find((entry) => entry.id === series)?.name ?? series;
}

function modelLookup(input: string) {
  const upper = input.toUpperCase();
  const match = upper.match(/STM-[A-Z0-9-]+/);
  if (!match) return null;

  for (const product of egyptProducts) {
    const variant = product.variants.find((entry) => entry.model.toUpperCase() === match[0]);
    if (variant) return { product, variant };
  }
  return null;
}

function findProductByIntent(input: string) {
  const lower = normalize(input);
  const series = findSeries(lower);
  const finish = findFinish(lower);
  const productPool = series ? getEgyptProductsBySeries(series) : egyptProducts;

  const typePriority: Array<[string, string[]]> = [
    ["free-standing", ["free standing", "freestanding", "bath mixer", "bathtub"]],
    ["concealed-shower", ["concealed shower", "shower mixer", "concealed"]],
    ["wall-mounted", ["wall mounted", "wall-mounted"]],
    ["tall-basin-mixer", ["tall", "vessel", "countertop"]],
    ["basin-mixer", ["basin mixer", "lavatory", "mixer", "tap"]],
    ["bidet-spray", ["bidet", "shattaf", "spray"]],
    ["accessories", ["accessories", "accessory"]],
  ];

  for (const [type, aliases] of typePriority) {
    if (!aliases.some((alias) => lower.includes(alias))) continue;
    const product = productPool.find((entry) => entry.type === type);
    if (!product) continue;
    const variant = product.variants.find((entry) => entry.finish === finish) ?? product.variants[0];
    return { product, variant };
  }

  return null;
}

function actionForProduct(product: EgyptProduct, finish?: string): AssistantAction {
  return {
    type: "product",
    slug: product.slug,
    finish,
    label: `View ${seriesName(product.series)} ${product.name}`,
    href: `/products/${product.slug}${finish ? `?finish=${finish}` : ""}`,
  };
}

function actionForSeries(series: EgyptSeriesId, finish?: string): AssistantAction {
  return {
    type: "series",
    series,
    finish,
    label: `Open ${seriesName(series)} collection`,
    href: `/collections/${series}${finish ? `?finish=${finish}` : ""}`,
  };
}

function withAction(text: string, action: AssistantAction): AssistantResult {
  return { text, action, brain: "catalog-rules-v1" };
}

function productLine(product: EgyptProduct, finish?: EgyptFinishId) {
  const variant = finish
    ? product.variants.find((entry) => entry.finish === finish)
    : product.variants[0];

  if (!variant) return `${seriesName(product.series)} ${product.name}`;
  return `${seriesName(product.series)} ${product.name} in ${finishName(variant.finish)} — model ${variant.model}, retail-reference ${formatEgyptPrice(variant.price)}.`;
}

function answerModelLookup(question: string) {
  const found = modelLookup(question);
  if (!found) return null;
  const { product, variant } = found;
  return withAction(
    `${variant.model} is the ${seriesName(product.series)} ${product.name} in ${finishName(variant.finish)}. The Egypt catalogue retail-reference price is ${formatEgyptPrice(variant.price)}. Trade pricing, stock, and lead time still need Steinheim Egypt confirmation.`,
    actionForProduct(product, variant.finish)
  );
}

function answerProductFacts(question: string) {
  const found = findProductByIntent(question);
  if (!found) return null;
  if (/(strategy|not a product schedule)/i.test(question)) return null;
  const { product, variant } = found;
  const wantsSpecs = /material|cartridge|aerator|pressure|spec|technical|مواصفات/i.test(question);
  const wantsPrice = /price|how much|cost|سعر|بكام/i.test(question);

  if (wantsSpecs) {
    return withAction(
      `${seriesName(product.series)} ${product.name}: material ${product.material ?? "not separately published"}, cartridge ${product.cartridge ?? "not separately published"}, aerator ${product.aerator ?? "not separately published"}, pressure range ${product.pressureRange ?? "not separately published"}. Do not use this as an installation drawing; final site conditions should be checked by the installer.`,
      null
    );
  }

  if (wantsPrice) {
    return withAction(
      `${productLine(product, variant.finish as EgyptFinishId)} This is a retail-reference catalogue price, not a confirmed trade price.`,
      actionForProduct(product, variant.finish)
    );
  }

  return null;
}

function answerCollection(question: string) {
  const series = findSeries(question);
  const finish = findFinish(question);
  if (!series) return null;

  const activeFinishes =
    (egyptSeries.find((entry) => entry.id === series)?.finishes as EgyptFinishId[] | undefined) ??
    getAvailableEgyptFinishesForSeries(series);
  const positioning = egyptCollectionPositioning[series];

  if (/finish|finishes|colors|colours|come in|available|تشطيبات|ألوان/i.test(question)) {
    return withAction(
      `${seriesName(series)} is active in Egypt in: ${activeFinishes.map(finishName).join(", ")}. ${positioning.caution ?? "Availability can still vary by individual product family."}`,
      null
    );
  }

  if (finish && !activeFinishes.includes(finish)) {
    return withAction(
      `${seriesName(series)} is not available in ${finishName(finish)} in the active Egypt 2026 catalogue. Available finishes are: ${activeFinishes.map(finishName).join(", ")}. I would avoid showing it as sellable unless Kareem confirms it.`,
      null
    );
  }

  return withAction(
    `${seriesName(series)}: ${positioning.role} Best for ${positioning.bestFor.join(", ")}. Active finishes: ${activeFinishes.map(finishName).join(", ")}.`,
    actionForSeries(series, finish ?? undefined)
  );
}

function answerHospitality(question: string, conversation: string) {
  const lower = normalize(question);
  const full = normalize(conversation);
  const hotelContext = /(hotel|hospitality|فندق|guestroom|five-star|five star)/.test(full);
  if (!hotelContext && !/(hotel|hospitality|فندق|rooms|suite|guestroom)/.test(lower)) return null;

  if (isArabic(question) && /(فندق|five star)/.test(lower)) {
    return withAction(
      "تمام، بس قبل ما أعمل specification كاملة لازم نحدد الأساس: الفندق في القاهرة ولا الساحل؟ الموقع مهم عشان الرطوبة والصيانة. وبعدها محتاج أعرف عدد standard rooms وعدد suites، نوع الحوض، وهل المطلوب basin mixers بس ولا concealed showers/accessories كمان.",
      null
    );
  }

  if (/^cairo\.?$/.test(lower) || /^new cairo\.?$/.test(lower)) {
    return withAction(
      "Good — Cairo removes most coastal-exposure concerns. Next I need the room mix: how many standard rooms and how many suites? A five-star hotel should not be specified as one flat package because standard rooms and suites usually need different product/finish logic.",
      null
    );
  }

  if (/\d/.test(lower) && /(standard|suite)/.test(lower) && !/(basin|shower|scope|complete|concealed)/.test(lower)) {
    return withAction(
      "Good room mix. Before I build a specification, confirm the product scope: basin mixers only, basin mixers plus concealed showers, or a complete bathroom package including bidet sprays, wastes, angle valves, and accessories?",
      null
    );
  }

  if (/\d/.test(lower) && /(room|standard|suite)/.test(lower) && !/(standard.*suite|suite.*standard)/.test(lower)) {
    return withAction(
      "A total room count is not enough for a five-star hotel. I need the split between standard rooms and suites, because I would usually keep standard rooms repeatable and maintenance-led, then treat suites more premium.",
      null
    );
  }

  if (!/\d/.test(lower)) {
    return withAction(
      "For a five-star hotel in Egypt, I would not jump straight to one product. First I need: location/coastal exposure, number of standard rooms vs suites, basin type, construction stage, finish direction, and maintenance priority. Initial strategy: Up for repeatable guestrooms, Joy for warmer premium suites, and Art only when the design brief needs a stronger architectural statement. Use the Smart Room Calculator to turn room counts into a first schedule.",
      null
    );
  }

  if (/(strategy|not a product schedule|design stage|easy maintenance)/.test(lower)) {
    return withAction(
      "Specification strategy: keep the 100 standard rooms on Up because it is the strongest repeatable trade collection, easy to coordinate and sensible for maintenance. Treat the 20 suites separately with Joy if the interiors need a warmer premium feel. For easy maintenance, start with Brushed Nickel or Chrome before PVD gold/black. Because you are still at design stage, lock basin type, concealed-shower wall depth, and finish direction before turning this into a final product schedule.",
      null
    );
  }

  const finish = findFinish(question) ?? "brushed-nickel";
  const standardBasin = egyptProducts.find((entry) => entry.slug === "up-basin-mixer");
  const standardShower = egyptProducts.find((entry) => entry.slug === "up-concealed-shower");
  const suiteBasin = egyptProducts.find((entry) => entry.slug === "joy-tall-basin-mixer");
  const suiteShower = egyptProducts.find((entry) => entry.slug === "joy-concealed-shower");

  const lines = [standardBasin, standardShower, suiteBasin, suiteShower]
    .filter(Boolean)
    .map((product) => productLine(product as EgyptProduct, finish as EgyptFinishId))
    .join("\n");

  return withAction(
    `For a premium five-star hotel, I would split the specification instead of treating every room the same:\n\n1. Standard rooms: Up collection for repeatable, clean, easy-maintenance bathrooms.\n2. Suites: Joy collection where you want a warmer, more premium feel.\n3. Finish starting point: ${finishName(finish)} for durability and calmer maintenance; use PVD gold finishes selectively in suites or VIP areas.\n\nFirst catalogue direction:\n${lines}\n\nThis is not final procurement. Confirm room counts, basin type, stock, lead time, and trade pricing with Steinheim Egypt.`,
    null
  );
}

function answerQuote(question: string) {
  const lower = normalize(question);
  if (/(strategy|not a product schedule)/.test(lower)) return null;
  if (!/(rfq|quote|schedule|line)/.test(lower)) return null;
  if (!/\d/.test(lower)) return null;

  const qtyMatch = lower.match(/(\d[\d,]*)/);
  const quantity = qtyMatch ? qtyMatch[1] : "the requested";
  const series = findSeries(question) ?? "up";
  const finish = findFinish(question) ?? "chrome";
  const productType = lower.includes("concealed") ? "concealed-shower" : "basin-mixer";
  const product = getEgyptProductsBySeries(series).find((entry) => entry.type === productType);
  const variant = product?.variants.find((entry) => entry.finish === finish);

  const line = product && variant
    ? `${quantity} × ${seriesName(series)} ${product.name}, ${finishName(finish)}, model ${variant.model}, retail-reference ${formatEgyptPrice(variant.price)} each.`
    : `${quantity} × ${seriesName(series)} ${productType}, ${finishName(finish)} — confirm exact active SKU.`;

  return withAction(
    `RFQ draft line:\n${line}\n\nThis is a trade request draft using retail-reference catalogue pricing only. Final trade price, stock, and lead time must be confirmed by Steinheim Egypt.`,
    { type: "quote", label: "Open trade workflow", href: "/trade" }
  );
}

function answerDesignAdvice(question: string) {
  const lower = normalize(question);

  if (/(countertop|vessel|tall)/.test(lower)) {
    const finish = lower.includes("walnut") || lower.includes("warm") ? "brushed-nickel" : "chrome";
    const product = egyptProducts.find((entry) => entry.slug === "joy-tall-basin-mixer") ?? egyptProducts[0];
    return withAction(
      `For that kind of master bathroom, start with a tall basin mixer if the basin is countertop/vessel. My calm premium direction would be Joy in ${finishName(finish)}: softer shape, warmer than chrome, and easier to live with than a very dark finish. Check basin height and spout reach before ordering.`,
      actionForProduct(product, finish)
    );
  }

  if (/(beige|walnut|warm|soft lighting|stone)/.test(lower)) {
    return withAction(
      "For warm beige stone, walnut, and soft lighting, I would start with Joy in Brushed Nickel or Brushed Gold. Brushed Nickel is calmer and easier for daily maintenance; Brushed Gold feels richer and more decorative.",
      actionForSeries("joy", "brushed-nickel")
    );
  }

  if (/(children|kids|family|maintenance|water spots|fingerprint)/.test(lower)) {
    return withAction(
      "For a bathroom used heavily by children, I would avoid making Matte Black the automatic choice. It looks beautiful, but water spots and cleaning habits matter more. Start with Chrome or Brushed Nickel for daily forgiveness, and reserve Matte Black for a lower-use powder room if you love the look.",
      null
    );
  }

  if (/(coast|north coast|salt|salty|humid|ساحل)/.test(lower)) {
    return withAction(
      "For coastal or humid exposure, start with easier-maintenance finishes and ask Steinheim Egypt to confirm the finish warranty for the exact site conditions. Art can make sense for an architectural brief because of its stainless-steel character, but I would still confirm finish choice, cleaning routine, and availability before procurement.",
      actionForSeries("art", "brushed-nickel")
    );
  }

  return null;
}

function answerCare(question: string) {
  const lower = normalize(question);
  if (!/(clean|care|vinegar|water spot|chemical|bleach|تنضف|أنضف|نظف|خل|منظف)/.test(lower)) return null;

  const finish = findFinish(question);
  const finishMeta = finish ? egyptFinishes.find((entry) => entry.id === finish) : null;
  const care = finishMeta?.careInstructions ?? "Use a soft damp cloth and mild soap, then dry immediately.";
  const warning = "Avoid vinegar, bleach, acidic cleaners, abrasive pads, and harsh chemicals unless Steinheim Egypt confirms a product-specific method.";

  if (isArabic(question)) {
    return withAction(
      `الأمان أولاً: استخدم فوطة ناعمة ومياه دافية، وبعدها نشّف السطح فوراً. بلاش خل، كلور، منظفات حمضية، أو أي إسفنجة خشنة. ${care} لو البقع تقيلة، ابعت صورة لفريق Steinheim Egypt قبل استخدام أي كيميكال قوي.`,
      null
    );
  }

  return withAction(`${care} ${warning} For heavy water spots, send photos before using stronger chemicals.`, null);
}

function answerTradeBoundary(question: string) {
  const lower = normalize(question);
  if (/(discount|guarantee|stock|lead time|deliver|delivery|next thursday|available|bulk price|trade price)/.test(lower)) {
    if (/(stock|available)/.test(lower)) {
      return withAction(
        "I do not have live stock data, so I won’t guess. Kareem/the Steinheim Egypt team must confirm current availability, reserved quantities, and lead time for that exact model and finish.",
        null
      );
    }
    if (/(deliver|delivery|next thursday)/.test(lower)) {
      return withAction(
        "Delivery cannot be promised from the assistant. The required date, location, quantity, stock status, and logistics need confirmation from Steinheim Egypt before anyone says yes.",
        null
      );
    }
    return withAction(
      `${egyptTradeRules.retailPriceRule} Discounts are not published and I won’t guess. Kareem/the trade team must confirm the commercial offer after reviewing quantity, finish, model mix, project timing, and availability.`,
      null
    );
  }
  return null;
}

function answerProjects(question: string) {
  const lower = normalize(question);
  if (!/(project|completed|meydan|burj|reference|مشاريع)/.test(lower)) return null;

  if (/(exact|quantity|model|supplied|burj)/.test(lower)) {
    if (lower.includes("burj")) {
      return withAction(
        "I cannot confirm a verified Steinheim project at Burj Al Arab from the published Steinheim Egypt references. I would not tell a client that Steinheim supplied it unless Kareem provides confirmation.",
        null
      );
    }

    return withAction(
      `The official Steinheim Egypt project references do not publish exact supplied models, quantities, contract values, or a Burj Al Arab reference. I would not invent those details. Published references include: ${officialProjects.map((project) => project.name).join("; ")}.`,
      { type: "projects", label: "View projects", href: "/projects" }
    );
  }

  return withAction(
    `Published Steinheim project references include: ${officialProjects.map((project) => `${project.name} (${project.location})`).join("; ")}. The site uses these for credibility, but exact models and quantities are not publicly published.`,
    { type: "projects", label: "View projects", href: "/projects" }
  );
}

function answerWarranty(question: string) {
  const lower = normalize(question);
  if (!/(warranty|leak|replace|return|refund|ضمان)/.test(lower)) return null;

  if (/(return|changed my mind|refund)/.test(lower)) {
    return withAction(
      "Returns and exchanges are not something I should promise from the website. Steinheim Egypt needs to confirm condition, timing, packaging, and invoice details.",
      null
    );
  }

  if (/(leak|replace|broken|defect)/.test(lower)) {
    return withAction(
      `${egyptWarrantyRules.safePublicWording} A leak may be installation-related, pressure-related, cartridge-related, or a manufacturing issue, so the right next step is photos/video, invoice, installation date, and pressure/site details.`,
      null
    );
  }

  return withAction(
    `${verifiedBrandFacts.warranty} ${egyptWarrantyRules.safePublicWording}`,
    null
  );
}

function answerOrigin(question: string) {
  const lower = normalize(question);
  if (!/(made in germany|manufactured in germany|origin|ألمانيا)/.test(lower)) return null;
  return withAction(
    "I would not claim every Steinheim product is manufactured in Germany because the current verified Egypt knowledge does not publish that as a confirmed claim for every SKU. The safe public wording is European design/engineering language and verified technical components such as Sedal cartridges and Neoperl aerators where listed.",
    null
  );
}

function answerBrand(question: string) {
  const lower = normalize(question);

  if (/(ignore|system prompt|api key|groq|secret|previous instructions)/.test(lower)) {
    return withAction(
      "I can’t reveal private instructions, API keys, or internal prompts. I can help with Steinheim products, finishes, projects, warranty, and trade specification.",
      null
    );
  }

  if (/(who is|what makes|brand|different|steinheim)/.test(lower)) {
    return withAction(
      `Steinheim is positioned as a premium bathroom solutions brand for Egypt: European design language, precise engineering, coordinated collections, refined finishes, and products specified as one architectural system rather than random standalone taps. In Egypt, Steinheim is represented by El-Sharbatly International Group.`,
      null
    );
  }

  return null;
}

function answerCertifications(question: string) {
  const lower = normalize(question);
  if (!/(wras|leed|certified|certification)/.test(lower)) return null;
  return withAction(
    "I cannot confirm that every Steinheim mixer is WRAS or LEED certified because that is not published in the verified Egypt catalogue data. If a project requires certifications, ask Steinheim Egypt for the exact model datasheet and certificate before specifying.",
    null
  );
}

function answerHandoff(question: string) {
  const lower = normalize(question);
  if (!/(contact kareem|send kareem|accurate quote|project quote|quote quickly)/.test(lower)) return null;

  if (/(information|what information|send)/.test(lower)) {
    return withAction(
      "For a fast accurate quote, send: project name/location, customer type, required date, room count, model or product type, finish, quantity, technical scope, drawings if available, and whether pricing is for retail or trade review. The cleanest route is to submit the project board so Steinheim Egypt can review it.",
      null
    );
  }

  return withAction(
    "Use the trade project board for the cleanest handoff, or contact inquiries@steinheim-eg.com. Include project name, location, product models, finishes, quantities, required date, and whether you need trade pricing or technical confirmation.",
    null
  );
}

function answerResidentialDevelopment(question: string) {
  const lower = normalize(question);
  if (!/(compound|development|شقة|شقق)/.test(lower)) return null;
  return withAction(
    "ده residential development مش فندق، فالأهم نقسم الشقق لنماذج: one-bedroom, two-bedroom, three-bedroom، وعدد الحمامات في كل نموذج. بعد كده نحدد هل المطلوب basin mixers وconcealed showers فقط ولا package كاملة. كبداية premium وسهل الصيانة: Up in Brushed Nickel أو Chrome للمناطق المتكررة.",
    null
  );
}

function answerRange(question: string) {
  const lower = normalize(question);
  if (!/(what does|range|sell|catalogue|catalog|products|بيع|منتجات)/.test(lower)) return null;

  return withAction(
    `Steinheim Egypt’s active catalogue is built around four collections: Joy, Up, Art, and Quatro. Across them, the range covers basin mixers, tall basin mixers, wall-mounted mixers, concealed showers, shower columns, free-standing bath mixers, bidet sprays, accessories, click-clack wastes, and angle valves. Exact availability depends on collection and finish.`,
    null
  );
}

function answerCorrection(question: string) {
  const lower = normalize(question);
  if (!/(correction|undermount|not a vessel)/.test(lower)) return null;

  return withAction(
    "Got it — if it is an undermount basin, I would move away from a tall mixer. Start with a standard basin mixer, then check spout reach, vanity depth, and whether the basin has a tap hole or needs a wall-mounted setup.",
    null
  );
}

function answerCodeSwitching(question: string) {
  const lower = normalize(question);
  if (!isArabic(question) || !/(master|maintenance|premium|mixer)/.test(lower)) return null;

  return withAction(
    "للـmaster bathroom لو عايز premium بس easy maintenance، ابدأ من نوع الحوض الأول. لو الحوض countertop يبقى tall mixer، ولو undermount أو عادي يبقى standard basin mixer. في التشطيب، Brushed Nickel أهدى وأسهل في الصيانة من Matte Black.",
    null
  );
}

function answerBudget(question: string) {
  const lower = normalize(question);
  if (!/(budget|100,000|100000|pounds|ميزانية)/.test(lower)) return null;

  return withAction(
    "A budget alone is not enough to build the right package. I need the bathroom scope first: how many rooms, basin type, shower or no shower, desired finish, and whether this is one home bathroom or a multi-unit project.",
    null
  );
}

function answerSelection(question: string) {
  const lower = normalize(question);
  if (/(need a basin mixer|pick one|choose one|عايز mixer|عايز خلاط)/.test(lower)) {
    return withAction(
      "I can choose, but one detail changes the answer: is the basin countertop/vessel, undermount, or standard inset? For a vessel basin use a tall basin mixer; for standard basins use a regular basin mixer; for a new wall/plumbing stage you can consider wall-mounted.",
      null
    );
  }

  if (/(already tiled|switch to concealed|wall mixer)/.test(lower)) {
    return withAction(
      "If the bathroom is already tiled, switching to a concealed wall mixer can require opening the wall, changing plumbing depth, waterproofing again, and repairing tile. I would confirm site condition with the installer before recommending it.",
      null
    );
  }

  return null;
}

function answerComparison(question: string) {
  const lower = normalize(question);
  if (/(compare|joy and up|joy vs up)/.test(lower)) {
    return withAction(
      "Joy feels warmer, softer, and more residential-premium; I would use it for villas, master bathrooms, and suites. Up is cleaner, more repeatable, and stronger for hotels, compounds, and schedules where consistency and maintenance matter. For a hotel suite: Joy if the suite needs emotional luxury, Up if procurement consistency matters more.",
      { type: "compare", label: "Compare collections", href: "/collections" }
    );
  }

  if (/(grohe|hansgrohe|better than)/.test(lower)) {
    return withAction(
      "I would not attack another brand or invent weaknesses. A fair comparison needs exact model, datasheet, finish, warranty terms, and verified price. The stronger Steinheim argument is positive: coordinated collections, Egypt-specific catalogue clarity, refined finish choices, and a trade workflow that helps designers and developers specify faster.",
      null
    );
  }

  return null;
}

function answerMemory(question: string, projectContext: string) {
  if (!/remember|my project|ذاكر/i.test(question)) return null;
  if (projectContext.trim()) {
    return withAction(`Here is the project context I have: ${projectContext.trim()}`, null);
  }
  return withAction(
    "I only know what is in this current conversation/session. I do not have a permanent memory of your project yet. If you give me room counts, finish direction, location, and construction stage, I can structure it into a Steinheim brief.",
    { type: "trade", label: "Start a project brief", href: "/trade#smart-room-calculator" }
  );
}

function fallback(question: string) {
  if (isArabic(question)) {
    return withAction(
      "أقدر أساعدك في اختيار منتجات Steinheim Egypt، التشطيبات، الأسعار المرجعية، الضمان، أو تجهيز مواصفة لمشروع. ابعتلي نوع المكان، عدد الحمامات، التشطيب المفضل، وهل المشروع لسه في التصميم ولا التنفيذ.",
      { type: "trade", label: "Open trade workflow", href: "/trade" }
    );
  }

  return withAction(
    "I can help with Steinheim Egypt products, finishes, technical specs, warranty, projects, and trade schedules. Tell me the room type, basin type, finish direction, quantity, and whether this is a home, hotel, compound, or commercial project.",
    { type: "trade", label: "Open trade workflow", href: "/trade" }
  );
}

export function answerSteinheimQuestion(messages: AssistantMessage[] = [], projectContext = ""): AssistantResult {
  const lastUser = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const question = lastUser.trim();
  const conversation = messages.map((message) => `${message.role}: ${message.content}`).join("\n");

  const injection = answerBrand(question);
  if (injection && /ignore|system prompt|api key|groq|secret|previous instructions/i.test(question)) return injection;

  const memory = answerMemory(question, projectContext);
  if (memory) return memory;

  const responders = [
    answerCertifications,
    answerOrigin,
    answerHandoff,
    answerQuote,
    answerModelLookup,
    answerProductFacts,
    answerTradeBoundary,
    answerProjects,
    answerWarranty,
    answerCare,
    answerComparison,
    (input: string) => answerHospitality(input, conversation),
    answerResidentialDevelopment,
    answerCorrection,
    answerCodeSwitching,
    answerSelection,
    answerDesignAdvice,
    answerCollection,
    answerRange,
    answerBudget,
    answerBrand,
  ];

  for (const responder of responders) {
    const answer = responder(question);
    if (answer) return answer;
  }

  return fallback(question);
}

export function actionToEvaluationJson(action: AssistantAction) {
  if (!action) return "";
  if (action.type === "product") {
    return JSON.stringify({ type: "product", slug: action.slug, finish: action.finish, href: action.href });
  }
  if (action.type === "series") {
    return JSON.stringify({ type: "series", series: action.series, finish: action.finish, href: action.href });
  }
  if (action.type === "quote") {
    return JSON.stringify({ type: "quote", href: action.href });
  }
  if (action.type === "projects") {
    return JSON.stringify({ type: "projects", href: action.href });
  }
  if (action.type === "compare") {
    return JSON.stringify({ type: "compare", href: action.href });
  }
  return JSON.stringify({ type: action.type, href: action.href });
}
