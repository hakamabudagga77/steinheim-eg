import Image from "next/image";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";

const categories = [
  {
    title: "Basin mixers",
    eyebrow: "Everyday rituals",
    href: "/products/joy-basin-mixer",
    image: "/images/products/joy/basin-mixer/chrome.png",
    detail: "Single-lever, tall, and wall-mounted mixers for villas, apartments, and hospitality bathrooms.",
  },
  {
    title: "Shower systems",
    eyebrow: "Complete control",
    href: "/products/up-shower-column",
    image: "/images/products/up/shower-column/matte-black.png",
    detail: "Columns and concealed shower systems for private bathrooms, suites, and project specifications.",
  },
  {
    title: "Bath mixers",
    eyebrow: "Freestanding focus",
    href: "/products/joy-free-standing-bath-mixer",
    image: "/images/products/joy/free-standing-bath-mixer/brushed-gold.png",
    detail: "Floor-standing and bath-mounted pieces designed around the architecture of the room.",
  },
  {
    title: "Accessories",
    eyebrow: "Complete the system",
    href: "/products/joy-accessories-set",
    image: "/images/products/joy/accessories-set/chrome.png",
    detail: "Coordinated accessories and finishing details that keep the bathroom language consistent.",
  },
];

export default function ShopByCategory() {
  return (
    <section className="border-t border-border-light bg-[#ece9e2] py-20 sm:py-28">
      <Container>
        <ScrollReveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-warm-gray">
              Shop by need
            </p>
            <h2 className="mt-4 max-w-2xl font-heading text-[clamp(2.2rem,5vw,4.6rem)] leading-[0.95] text-charcoal">
              Start with the room.
              <br />
              Then choose the system.
            </h2>
          </div>
          <p className="max-w-sm text-[14px] leading-[1.85] text-warm-gray">
            For direct buyers, every category leads into exact products, finishes, and prices.
            For professionals, the same products can be added to a project board.
          </p>
        </ScrollReveal>

        <StaggerContainer className="mt-14 grid gap-px bg-charcoal/10 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <StaggerItem key={category.title}>
              <Link href={category.href} className="group block h-full bg-white">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#ece9e2]">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    quality={90}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-8 transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-6 sm:p-7">
                  <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-warm-gray">
                    {category.eyebrow}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <h3 className="font-heading text-[26px] leading-none text-charcoal">
                      {category.title}
                    </h3>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="shrink-0 text-charcoal/35 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-charcoal"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="mt-4 text-[12px] leading-[1.75] text-warm-gray">
                    {category.detail}
                  </p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Container>
    </section>
  );
}
