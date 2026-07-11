import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";

const pathways = [
  {
    title: "Homeowners",
    label: "Buy directly",
    href: "/collections",
    body: "Explore collections, compare finishes, add products to cart, and move toward direct checkout.",
  },
  {
    title: "Interior designers",
    label: "Present clearly",
    href: "/collections",
    body: "Use the catalogue, product pages, and project board to prepare cleaner client selections.",
  },
  {
    title: "Developers",
    label: "Specify at scale",
    href: "/trade#smart-room-calculator",
    body: "Build multi-unit schedules with models, finishes, and quantities before requesting trade pricing.",
  },
  {
    title: "Architects & contractors",
    label: "Coordinate execution",
    href: "/projects",
    body: "Review references, technical details, and coordinated systems for project-ready decisions.",
  },
];

export default function CustomerPathways() {
  return (
    <section className="bg-charcoal py-20 text-white sm:py-28">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[0.95fr_1.35fr] lg:items-start">
          <ScrollReveal>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/35">
              Built for every customer
            </p>
            <h2 className="mt-5 max-w-xl font-heading text-[clamp(2.35rem,5vw,4.8rem)] leading-[0.95]">
              Retail simplicity.
              <br />
              Trade intelligence.
            </h2>
            <p className="mt-7 max-w-md text-[14px] leading-[1.85] text-white/45">
              Steinheim Egypt should serve a homeowner choosing one mixer and a developer
              specifying hundreds of units with the same level of clarity.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/collections"
                className="inline-flex h-[50px] items-center justify-center bg-white px-8 text-[10px] font-semibold uppercase tracking-[0.16em] text-charcoal transition hover:bg-white/90"
              >
                Shop collections
              </Link>
              <Link
                href="/trade#smart-room-calculator"
                className="inline-flex h-[50px] items-center justify-center border border-white/20 px-8 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60 transition hover:border-white/50 hover:text-white"
              >
                Start a project
              </Link>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid gap-px bg-white/10 sm:grid-cols-2">
            {pathways.map((pathway) => (
              <StaggerItem key={pathway.title}>
                <Link
                  href={pathway.href}
                  className="group flex min-h-[240px] flex-col justify-between bg-[#0a0a0a] p-7 transition-colors duration-300 hover:bg-[#0a0a0a] sm:p-8"
                >
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/28">
                      {pathway.label}
                    </p>
                    <h3 className="mt-4 font-heading text-[30px] leading-none text-white">
                      {pathway.title}
                    </h3>
                    <p className="mt-5 text-[13px] leading-[1.8] text-white/42">
                      {pathway.body}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.16em] text-white/35 transition-colors duration-300 group-hover:text-white">
                    Enter path
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </Container>
    </section>
  );
}
