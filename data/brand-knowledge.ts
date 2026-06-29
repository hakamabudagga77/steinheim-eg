export interface SteinheimProjectReference {
  id: string;
  name: string;
  location: string;
  category: string;
  positioning: string;
  description: string;
  image: string;
  sourceUrl: string;
}

export const officialProjects: SteinheimProjectReference[] = [
  {
    id: "the-100-meydan",
    name: "The 100, Meydan, Dubai",
    location: "Meydan, Dubai, UAE",
    category: "Residential development",
    positioning: "Refined urban living",
    description:
      "Steinheim's official project page states that its bathroom systems were supplied to complement the development's architectural direction, with an emphasis on performance, durability, and timeless design.",
    image: "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790117748.png?v=1776254023&width=1200",
    sourceUrl: "https://steinheim-eg.com/pages/projects",
  },
  {
    id: "one-yard-jvc",
    name: "One Yard JVC Residences by Park Hyatt",
    location: "Jumeirah Village Circle, Dubai, UAE",
    category: "Branded residences",
    positioning: "Modern luxury",
    description:
      "Steinheim's official project page describes its contribution as engineered bathroom solutions integrated into contemporary interiors, combining precision with understated design.",
    image: "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790157926.png?v=1776254196&width=1200",
    sourceUrl: "https://steinheim-eg.com/pages/projects",
  },
  {
    id: "dubai-creek-residence",
    name: "Dubai Creek Residence by Park Hyatt",
    location: "Dubai Creek, Dubai, UAE",
    category: "Branded residences",
    positioning: "Material-led luxury",
    description:
      "The official project page presents Steinheim systems as part of refined, material-rich spaces designed around seamless performance and long-term visual relevance.",
    image: "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790261733.png?v=1776254907&width=1200",
    sourceUrl: "https://steinheim-eg.com/pages/projects",
  },
  {
    id: "flamingo-city-sharjah",
    name: "Flamingo City, Sharjah",
    location: "Sharjah, UAE",
    category: "Residential development",
    positioning: "Practical design, elevated",
    description:
      "Steinheim's official project page highlights consistency, durability, and refined simplicity across this residential development.",
    image: "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790282757.png?v=1776255067&width=1200",
    sourceUrl: "https://steinheim-eg.com/pages/projects",
  },
];

export const verifiedBrandFacts = {
  positioning:
    "Steinheim presents itself as a bathroom solutions brand shaped by European minimalism, precision, proportion, quiet elegance, and products designed as one architectural language.",
  design:
    "The official About page emphasizes intentional design, balanced proportions, material care, engineering, and long-term function and form.",
  applications:
    "The official 2026 catalogue describes products for modern residential and commercial environments; the official Projects page also demonstrates multi-unit residential and branded-residence applications.",
  distribution:
    "Steinheim is represented in Egypt by El-Sharbatly International Group.",
  warranty:
    "The official 2026 Egypt catalogue states: lifetime warranty on Sedal cartridges; 10 years on Chrome and Brushed Nickel finishes against qualifying defects; 5 years on Neoperl aerators/body; and 3 years on premium PVD finishes. Valid in Egypt for manufacturing defects, subject to terms and proper use.",
  contact:
    "Trade and project enquiries should be submitted through the project board for structured review. Public catalogue contact: inquiries@steinheim-eg.com and +20 1223998124.",
  commercialDataStatus:
    "The working interactive catalogue uses the Steinheim Price List 2026 as the Egypt sellable range and retail-reference price source. Trade pricing, stock, lead time, and discounts must be confirmed by Kareem/the Steinheim Egypt trade team.",
};

export function getVerifiedKnowledgePrompt() {
  const projects = officialProjects
    .map(
      (project) =>
        `${project.id}|${project.name}|${project.location}|${project.category}|${project.positioning}|${project.description}`
    )
    .join("\n");

  return `VERIFIED STEINHEIM BRAND KNOWLEDGE
Positioning: ${verifiedBrandFacts.positioning}
Design: ${verifiedBrandFacts.design}
Applications: ${verifiedBrandFacts.applications}
Distribution: ${verifiedBrandFacts.distribution}
Warranty: ${verifiedBrandFacts.warranty}
Contact: ${verifiedBrandFacts.contact}
Commercial data status: ${verifiedBrandFacts.commercialDataStatus}

VERIFIED OFFICIAL PROJECT REFERENCES (id|name|location|category|positioning|verified description)
${projects}

PROJECT EVIDENCE LIMITS
- The official Projects page confirms only the four references above.
- It does not identify the exact collection, model, finish, quantity, project date, contract value, installation area, or client testimonial for any reference.
- Never invent those missing details. Say they are not published and offer to ask the Steinheim trade team.
- Do not describe the official website's project visuals as documentary installation photography; call them project visuals.

SOURCE HIERARCHY
1. Product names, models, available finishes, and retail-reference prices: the compact working catalogue in this prompt.
2. Brand story and warranty: official 2026 Egypt PDF catalogue and official About page.
3. Completed project references: official Steinheim Egypt Projects page, limited exactly as stated above.
4. Trade discounts, stock, lead time, and delivery: never known until confirmed by Kareem/the trade team.
If two sources conflict, do not quietly choose one. Explain the conflict briefly and mark the answer for confirmation.`;
}
