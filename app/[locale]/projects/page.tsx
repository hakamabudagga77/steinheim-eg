import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageTransition from "@/components/layout/PageTransition";
import { projectReferences } from "@/data/project-references";
import { getStaticPageMetadata } from "@/lib/seo";

const pillarKeys = ["visual", "collection", "schedule"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return getStaticPageMetadata(locale, "/projects", "projects");
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projectsPage");
  const featured = projectReferences[0];

  return (
    <PageTransition>
      <main className="bg-[#0a0a0a] text-white">
        <section className="relative min-h-screen overflow-hidden">
          <Image
            src={featured.heroImage}
            alt={featured.name}
            fill
            priority
            quality={92}
            sizes="100vw"
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-black/25" />

          <div className="relative z-10 flex min-h-screen flex-col justify-end px-6 pb-16 pt-32 sm:px-10 lg:px-16 lg:pb-24">
            <div className="max-w-4xl">
              <p className="text-[13px] uppercase tracking-[0.34em] text-white/70">{t("eyebrow")}</p>
              <h1 className="mt-8 max-w-5xl text-[clamp(4.2rem,10vw,10.5rem)] font-light leading-[0.84] tracking-[-0.07em]">
                {t("heroHeadline")}
              </h1>
              <p className="mt-8 max-w-2xl text-[18px] leading-[1.75] text-white/72">
                {t("heroBody")}
              </p>
              <Link
                href="#all-projects"
                className="mt-10 inline-flex h-12 items-center rounded-full border border-white/45 px-8 text-[13px] transition hover:bg-white hover:text-black"
              >
                {t("discoverMore")}
              </Link>
            </div>
          </div>
        </section>

        <section id="all-projects" className="px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-[1780px]">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-[13px] uppercase tracking-[0.34em] text-white/55">{t("allProjects")}</p>
              <h2 className="mt-7 text-[clamp(2.8rem,6vw,6.2rem)] font-light leading-[0.94] tracking-[-0.055em]">
                {t("officialHeadline")}
              </h2>
              <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-[1.8] text-white/58">
                {t("officialBody")}
              </p>
            </div>

            <div className="mt-20 grid gap-x-10 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
              {projectReferences.map((project) => (
                <Link key={project.slug} href={`/projects/${project.slug}`} className="group block">
                  <article>
                    <div className="relative aspect-[4/5] overflow-hidden bg-white/5">
                      <Image
                        src={project.cardImage}
                        alt={project.name}
                        fill
                        quality={90}
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition duration-[1400ms] group-hover:scale-[1.045]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-75" />
                    </div>
                    <div className="pt-7">
                      <div className="flex items-center justify-between gap-5 text-[13px] text-white/55">
                        <span>{project.location} - {project.country}</span>
                        <span>{project.sector}</span>
                      </div>
                      <h3 className="mt-4 text-[28px] font-medium leading-[1.05] tracking-[-0.035em]">
                        {project.name}
                      </h3>
                      <p className="mt-3 max-w-md text-[15px] leading-[1.7] text-white/55">
                        {project.intro}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
          <div className="mx-auto grid max-w-[1780px] items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
              <Image
                src="/images/generated/gessi/steinheim-specification-story.png"
                alt="Steinheim specification materials"
                fill
                quality={92}
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover"
              />
            </div>
            <div className="lg:ps-12">
              <p className="text-[13px] uppercase tracking-[0.34em] text-white/48">{t("forEgypt")}</p>
              <h2 className="mt-7 text-[clamp(2.8rem,5.8vw,6rem)] font-light leading-[0.92] tracking-[-0.06em]">
                {t("scheduleHeadline")}
              </h2>
              <p className="mt-7 max-w-2xl text-[17px] leading-[1.9] text-white/62">
                {t("scheduleBody")}
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {pillarKeys.map((key) => (
                  <div key={key} className="border border-white/12 px-5 py-5">
                    <p className="text-[12px] uppercase tracking-[0.22em] text-white/56">{t(`pillars.${key}`)}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/trade"
                className="mt-10 inline-flex h-12 items-center rounded-full bg-white px-8 text-[13px] text-black transition hover:bg-white/82"
              >
                {t("openTradeStudio")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
