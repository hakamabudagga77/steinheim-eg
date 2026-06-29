import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import ScrollReveal from "@/components/ui/ScrollReveal";
import PageTransition from "@/components/layout/PageTransition";
import TradeOpenButton from "@/components/trade/TradeOpenButton";
import SmartRoomCalculator from "@/components/trade/SmartRoomCalculator";

const workflowSteps = [
  ["Define a scope", "Pick a room group — standard rooms, suites, washrooms, villas, or show units."],
  ["Choose direction", "Select the collection and finish for that scope. It does not lock the whole project."],
  ["Add to board", "Repeat for another scope, or add exact products from collection pages."],
  ["Submit one RFQ", "The board combines every line into one Steinheim Egypt trade request."],
] as const;

export default async function TradePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TradePageContent />;
}

function TradePageContent() {
  return (
    <PageTransition>
      <section className="relative flex min-h-[72svh] items-center overflow-hidden bg-charcoal pt-24 text-white">
        <Image
          src="/images/steinheim/final/trade-hero.jpg"
          alt="Steinheim project installation"
          fill
          priority
          quality={90}
          className="object-cover object-[center_45%] opacity-60"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
        <Container className="relative z-10 w-full py-16 sm:py-20">
          <ScrollReveal>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/60">
              For professionals
            </p>
            <h1 className="mt-4 max-w-4xl font-heading text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.9]">
              Build project
              <br />
              specifications by scope.
            </h1>
            <p className="mt-5 max-w-xl text-[14px] leading-[1.8] text-white/65">
              Separate standard rooms, suites, public washrooms, and show units — then combine every
              product line into one Steinheim Egypt RFQ.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#smart-room-calculator"
                className="inline-flex h-[48px] items-center gap-2 bg-white px-8 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:bg-white/90"
              >
                Start a scope
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <TradeOpenButton variant="outline" />
            </div>
          </ScrollReveal>
        </Container>
      </section>

      <section className="border-b border-charcoal/8 bg-white py-14 sm:py-20">
        <Container>
          <ScrollReveal>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-warm-gray">
              How it works
            </p>
            <h2 className="mt-4 max-w-2xl font-heading text-[clamp(2rem,4vw,3.6rem)] leading-[0.95] text-charcoal">
              One project, as many scopes as you need.
            </h2>
            <p className="mt-5 max-w-2xl text-[13px] leading-[1.8] text-warm-gray">
              Each scope carries its own collection, finish, and product logic. The board merges everything into one trade request.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-px overflow-hidden border border-charcoal/10 bg-charcoal/10 sm:grid-cols-4">
            {workflowSteps.map(([title, body], index) => (
              <div key={title} className="flex flex-col bg-white p-6">
                <span className="flex h-8 w-8 items-center justify-center bg-charcoal text-[11px] font-medium text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-[13px] font-medium text-charcoal">
                  {title}
                </h3>
                <p className="mt-2 text-[12px] leading-[1.7] text-warm-gray">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <SmartRoomCalculator />

      <section className="border-t border-charcoal/8 bg-[#FAFAF8] py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-warm-gray">
              Already know what you need?
            </p>
            <h2 className="mt-4 font-heading text-[clamp(1.8rem,4vw,3rem)] leading-[0.95] text-charcoal">
              Browse products directly
            </h2>
            <p className="mt-4 text-[13px] leading-[1.8] text-warm-gray">
              Add exact products to your project board from any product page. Mix collections,
              finishes, and quantities freely. The board persists across sessions — come back anytime to adjust and send.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/collections"
                className="inline-flex h-[48px] items-center border border-charcoal px-8 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:bg-charcoal hover:text-white"
              >
                Browse collections
              </Link>
              <TradeOpenButton variant="outline" />
            </div>
          </div>
        </Container>
      </section>
    </PageTransition>
  );
}
