export type ProjectReference = {
  slug: string;
  name: string;
  location: string;
  country: string;
  sector: string;
  designer: string;
  collection: string;
  collectionSlug: "joy" | "up" | "art" | "quatro";
  finish: string;
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
  "Exact model, finish, quantity, installation area, project date, and designer are not publicly published. The collection shown reflects Steinheim Egypt's internal project categorization.";

export const projectReferences: ProjectReference[] = [
  {
    slug: "the-100-meydan",
    name: "The 100, Meydan, Dubai",
    location: "Meydan, Dubai",
    country: "UAE",
    sector: "Residential development",
    designer: "Not publicly published",
    collection: "Up",
    collectionSlug: "up",
    finish: "Not publicly published",
    positioning: "Refined urban living",
    heroImage:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790117748.png?v=1776254023&width=1600",
    cardImage:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790117748.png?v=1776254023&width=1200",
    gallery: [
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790117748.png?v=1776254023&width=1600",
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790117748.png?v=1776254023&width=1200",
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790117748.png?v=1776254023&width=900",
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
    designer: "Not publicly published",
    collection: "Joy",
    collectionSlug: "joy",
    finish: "Not publicly published",
    positioning: "Modern luxury",
    heroImage:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790157926.png?v=1776254196&width=1600",
    heroVideo: "/videos/one-yard-jvc-hero.mp4",
    cardImage:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790157926.png?v=1776254196&width=1200",
    gallery: [
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790157926.png?v=1776254196&width=1600",
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790157926.png?v=1776254196&width=1200",
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790157926.png?v=1776254196&width=900",
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
    designer: "Not publicly published",
    collection: "Art",
    collectionSlug: "art",
    finish: "Not publicly published",
    positioning: "Material-led luxury",
    heroImage:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790261733.png?v=1776254907&width=1600",
    cardImage:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790261733.png?v=1776254907&width=1200",
    gallery: [
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790261733.png?v=1776254907&width=1600",
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790261733.png?v=1776254907&width=1200",
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790261733.png?v=1776254907&width=900",
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
    designer: "Not publicly published",
    collection: "Quatro",
    collectionSlug: "quatro",
    finish: "Not publicly published",
    positioning: "Practical design, elevated",
    heroImage:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790282757.png?v=1776255067&width=1600",
    cardImage:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790282757.png?v=1776255067&width=1200",
    gallery: [
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790282757.png?v=1776255067&width=1600",
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790282757.png?v=1776255067&width=1200",
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790282757.png?v=1776255067&width=900",
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
