import { PageHeader, Panel } from "@/components/admin/ui";

export default function AdminContentPage() {
  return (
    <div>
      <PageHeader eyebrow="Content" title="Coming soon." />
      <Panel className="mt-6 max-w-lg">
        <p className="text-[14px] leading-[1.7] text-white/50">
          Editing site copy without touching code is a real architecture decision — page content
          currently lives in the app&apos;s source files, not a database. Worth its own conversation
          before building.
        </p>
      </Panel>
    </div>
  );
}
