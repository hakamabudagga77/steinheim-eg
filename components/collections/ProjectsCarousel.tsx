"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { projectReferences, type ProjectReference } from "@/data/project-references";

export default function ProjectsCarousel({
  collectionSlug,
  collectionName,
}: {
  collectionSlug: ProjectReference["collectionSlug"];
  collectionName: string;
}) {
  const projects = projectReferences.filter((project) => project.collectionSlug === collectionSlug);
  if (projects.length === 0) return null;

  return (
    <section className="border-t border-white/10 bg-black px-5 py-20 text-white sm:px-8 lg:px-16 lg:py-28">
      <div className="mx-auto max-w-[1780px]">
        <h2 className="text-[clamp(1.8rem,3.4vw,2.8rem)] font-normal tracking-[-0.03em]">
          Discover projects with <span className="font-medium">{collectionName}</span>
        </h2>

        <div className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="group block w-[280px] shrink-0 snap-start sm:w-[340px]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-white/5">
                <Image
                  src={project.cardImage}
                  alt={project.name}
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 70vw, 340px"
                  className="object-cover transition duration-[1200ms] group-hover:scale-[1.04]"
                />
              </div>
              <p className="mt-5 text-[17px] font-medium leading-tight">{project.name}</p>
              <p className="mt-1.5 text-[13px] text-white/50">{project.location} - {project.country}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
