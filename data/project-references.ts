export type ProjectReference = {
  slug: string;
  name: string;
  location: string;
  country: string;
  sector: string;
  collection: string;
  collectionSlug: "joy" | "up" | "art" | "quatro";
  positioning: string;
  heroImage: string;
  heroVideo?: string;
  cardImage: string;
  gallery: string[];
  intro: string;
  body: string;
  note: string;
};

const projectEvidenceNote =
  "Exact model, finish, quantity, installation area, and project date are not publicly published. The collection shown reflects Steinheim Egypt's internal project categorization.";

export const projectReferences: ProjectReference[] = [
  {
    slug: "the-100-meydan",
    name: "The 100, Meydan, Dubai",
    location: "Meydan, Dubai",
    country: "UAE",
    sector: "Residential development",
    collection: "Up",
    collectionSlug: "up",
    positioning: "Refined urban living",
    heroImage: "/images/projects/the-100-meydan.webp",
    cardImage: "/images/projects/the-100-meydan.webp",
    gallery: [
      "/images/projects/the-100-meydan-detail.webp",
      "/images/projects/the-100-meydan-atmosphere.webp",
    ],
    intro:
      "A published Steinheim project reference in Meydan, Dubai, positioned around refined urban living and long-term architectural value.",
    body:
      "Steinheim's official project reference presents The 100, Meydan as a residential development where Steinheim bathroom systems were supplied to complement the architectural direction of the project. The published positioning focuses on performance, durability, and a timeless design language rather than decorative excess.",
    note: projectEvidenceNote,
  },
  {
    slug: "one-yard-jvc",
    name: "One Yard JVC Residences by Park Hyatt",
    location: "Jumeirah Village Circle, Dubai",
    country: "UAE",
    sector: "Branded residences",
    collection: "Joy",
    collectionSlug: "joy",
    positioning: "Modern luxury",
    heroImage: "/images/projects/one-yard-jvc.webp",
    heroVideo: "/videos/one-yard-jvc-hero.mp4",
    cardImage: "/images/projects/one-yard-jvc.webp",
    gallery: [
      "/images/projects/one-yard-jvc-detail.webp",
      "/images/projects/one-yard-jvc-atmosphere.webp",
    ],
    intro:
      "A branded-residence reference in Jumeirah Village Circle, Dubai, where Steinheim is presented as part of a modern luxury interior direction.",
    body:
      "For One Yard JVC Residences by Park Hyatt, Steinheim's official reference describes engineered bathroom solutions integrated into contemporary interiors. The public story is about precision, restraint, and understated design: bathroom systems that support the living environment without making the space feel overdesigned.",
    note: projectEvidenceNote,
  },
  {
    slug: "dubai-creek-residence",
    name: "Dubai Creek Residence by Park Hyatt",
    location: "Dubai Creek, Dubai",
    country: "UAE",
    sector: "Branded residences",
    collection: "Art",
    collectionSlug: "art",
    positioning: "Material-led luxury",
    heroImage: "/images/projects/dubai-creek-residence.webp",
    cardImage: "/images/projects/dubai-creek-residence.webp",
    gallery: [
      "/images/projects/dubai-creek-residence-detail.webp",
      "/images/projects/dubai-creek-residence-atmosphere.webp",
    ],
    intro:
      "A Dubai Creek branded-residence reference built around material-led luxury, refined bathroom systems, and long-term visual relevance.",
    body:
      "Steinheim's official project reference presents Dubai Creek Residence by Park Hyatt as a refined, material-rich environment where the bathroom systems are part of a broader architectural experience. The public description emphasizes seamless performance and a visual language intended to remain relevant over time.",
    note: projectEvidenceNote,
  },
  {
    slug: "flamingo-city-sharjah",
    name: "Flamingo City, Sharjah",
    location: "Sharjah",
    country: "UAE",
    sector: "Residential development",
    collection: "Quatro",
    collectionSlug: "quatro",
    positioning: "Practical design, elevated",
    heroImage: "/images/projects/flamingo-city-sharjah.webp",
    cardImage: "/images/projects/flamingo-city-sharjah.webp",
    gallery: [
      "/images/projects/flamingo-city-sharjah-detail.webp",
      "/images/projects/flamingo-city-sharjah-atmosphere.webp",
    ],
    intro:
      "A Sharjah residential development reference where Steinheim's public project story centers on consistency, durability, and refined simplicity.",
    body:
      "Flamingo City, Sharjah is published by Steinheim Egypt as a residential development reference. The stated emphasis is practical design elevated through consistency, durability, and a refined bathroom language that can support repeated residential applications.",
    note: projectEvidenceNote,
  },
];

export function getProjectReference(slug: string) {
  return projectReferences.find((project) => project.slug === slug);
}
