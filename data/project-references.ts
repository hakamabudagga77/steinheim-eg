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
  "Exact model, finish, quantity, and installation details for this project are not publicly published. Confirm with the Steinheim Egypt trade team.";

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
      "Refined urban living, specified for the long term, at The 100 in Meydan.",
    body:
      "At The 100, Steinheim's bathroom systems support a residential development built around performance and restraint. The direction here is calm and timeless: fittings chosen to hold up under daily use without ever feeling decorative.",
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
      "A branded residence in Jumeirah Village Circle, where Steinheim sits quietly inside a modern luxury interior.",
    body:
      "One Yard JVC pairs Steinheim's bathroom systems with contemporary interiors built for precision and restraint — fittings engineered to support the space, not compete with it.",
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
      "A Dubai Creek residence built around material-led luxury, with Steinheim as part of the architectural language.",
    body:
      "Dubai Creek Residence pairs Steinheim's bathroom systems with a refined, material-rich interior — fittings built for seamless performance and a visual language meant to last.",
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
      "A Sharjah residential development where Steinheim supports practical design, elevated.",
    body:
      "Flamingo City relies on Steinheim's bathroom systems for consistency across a large residential footprint — durable, refined fittings built to perform the same way in every unit.",
    note: projectEvidenceNote,
  },
];

export function getProjectReference(slug: string) {
  return projectReferences.find((project) => project.slug === slug);
}
