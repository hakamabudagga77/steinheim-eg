import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageTransition from "@/components/layout/PageTransition";
import { getProjectReference, projectReferences } from "@/data/project-references";

export function generateStaticParams() {
  return projectReferences.map((project) => ({ slug: project.slug }));
}

export default async function ProjectReferencePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const project = getProjectReference(slug);
  if (!project) notFound();

  return (
    <PageTransition>
      <main className="bg-[#0f0e0b] text-white">
        <section className="relative min-h-screen overflow-hidden">
          {project.heroVideo ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster={project.heroImage}
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            >
              <source src={project.heroVideo} type="video/mp4" />
            </video>
          ) : (
            <Image
              src={project.heroImage}
              alt={project.name}
              fill
              priority
              quality={92}
              sizes="100vw"
              className="object-cover opacity-72"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/12 to-[#0f0e0b]" />
          <div className="absolute inset-0 bg-black/22" />

          {/* Breadcrumb — Gessi style top-left */}
          <div className="absolute left-0 right-0 top-24 z-10 px-6 sm:px-10 lg:top-28 lg:px-16">
            <p className="text-[13px] text-white/70">
              <Link href="/" className="transition hover:text-white">Home</Link>
              <span className="px-2 text-white/40">·</span>
              <Link href="/projects" className="transition hover:text-white">Projects</Link>
              <span className="px-2 text-white/40">·</span>
              <span>References</span>
              <span className="px-2 text-white/40">·</span>
              <span className="text-white/90">{project.name}</span>
            </p>
          </div>

          <div className="relative z-10 flex min-h-screen flex-col justify-end px-6 pb-16 pt-32 sm:px-10 lg:px-16 lg:pb-20">
            <div className="max-w-4xl">
              <p className="text-[12px] uppercase tracking-[0.34em] text-white/70">{project.sector}</p>
              <h1 className="mt-5 text-[clamp(2.2rem,4.8vw,4.6rem)] font-light leading-[1.05] tracking-[-0.03em]">
                {project.name}
              </h1>
              <p className="mt-4 text-[16px] font-light leading-[1.3] text-white/70">
                {project.location} - {project.country}
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
          <div className="mx-auto grid max-w-[1780px] gap-14 lg:grid-cols-[0.42fr_0.58fr]">
            <div className="grid content-start gap-12 text-[18px] leading-[1.55]">
              <div>
                <p className="text-[15px] font-semibold">Sector</p>
                <p className="mt-3 text-white/72">{project.sector}</p>
              </div>
              <div>
                <p className="text-[15px] font-semibold">Designer</p>
                <p className="mt-3 text-white/72">{project.designer}</p>
              </div>
              <div>
                <p className="text-[15px] font-semibold">Steinheim collection</p>
                <Link
                  href={`/collections/${project.collectionSlug}`}
                  className="mt-3 inline-block text-white/72 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-white/60"
                >
                  {project.collection}
                </Link>
              </div>
              <div>
                <p className="text-[15px] font-semibold">Finish direction</p>
                <p className="mt-3 text-white/72">{project.finish}</p>
              </div>
              <div className="border-t border-white/12 pt-8">
                <p className="text-[15px] font-semibold">Published evidence</p>
                <p className="mt-3 text-[15px] leading-[1.75] text-white/55">{project.note}</p>
              </div>
            </div>

            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                <Image
                  src={project.gallery[0]}
                  alt={`${project.name} detail`}
                  fill
                  quality={92}
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-14 max-w-3xl text-[clamp(1.4rem,2.2vw,2.25rem)] leading-[1.35] tracking-[-0.025em] text-white/88">
                {project.intro}
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 sm:px-10 lg:px-16 lg:pb-32">
          <div className="mx-auto grid max-w-[1780px] items-start gap-14 lg:grid-cols-[0.54fr_0.46fr]">
            <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
              <Image
                src={project.gallery[1]}
                alt={`${project.name} atmosphere`}
                fill
                quality={92}
                sizes="(max-width: 1024px) 100vw, 54vw"
                className="object-cover"
              />
            </div>
            <div className="lg:pt-16">
              <p className="text-[13px] uppercase tracking-[0.34em] text-white/45">Published reference note</p>
              <p className="mt-8 max-w-3xl text-[20px] leading-[1.75] text-white/78">
                {project.body}
              </p>
              <p className="mt-8 max-w-2xl text-[14px] leading-[1.7] text-white/42">
                Project visual shown from Steinheim Egypt&apos;s public project references. Specification details should be confirmed directly with the Steinheim Egypt trade team.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 sm:px-10 lg:px-16 lg:pb-32">
          <div className="mx-auto max-w-[1780px]">
            <div className="mb-12 flex items-end justify-between">
              <h2 className="text-[clamp(2.4rem,5vw,5.5rem)] font-light tracking-[-0.06em]">Gallery</h2>
              <div className="h-px w-28 bg-white/42" />
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {project.gallery.map((image, index) => (
                <div key={`${image}-${index}`} className={`relative overflow-hidden bg-white/5 ${index === 0 ? "aspect-[4/3]" : "aspect-[3/4]"}`}>
                  <Image
                    src={image}
                    alt={`${project.name} gallery ${index + 1}`}
                    fill
                    quality={90}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-[1400ms] hover:scale-[1.035]"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto flex max-w-[1780px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/projects" className="text-[13px] text-white/55 transition hover:text-white">
              Back to all projects
            </Link>
            <Link
              href="/trade"
              className="inline-flex h-12 w-fit items-center rounded-full bg-white px-8 text-[13px] text-black transition hover:bg-white/82"
            >
              Build a project schedule
            </Link>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
