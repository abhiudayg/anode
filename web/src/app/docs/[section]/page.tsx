import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsShell } from "../DocsShell";
import { CHAPTERS } from "../registry";
import { allValidIds, docSections } from "../nav";

type Props = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  return [...allValidIds].filter((id) => id !== "overview").map((section) => ({ section }));
}

function titleFor(section: string): string {
  const item = docSections.flatMap((s) => s.items).find((i) => i.id === section);
  return item?.title ?? "Documentation";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const title = titleFor(section);
  return {
    title: `${title} — Anode Docs`,
    alternates: { canonical: `/docs/${section}` },
  };
}

export default async function DocsSectionPage({ params }: Props) {
  const { section } = await params;
  const Chapter = CHAPTERS[section];
  if (!Chapter || section === "overview") notFound();
  return (
    <DocsShell activeId={section}>
      <Chapter />
    </DocsShell>
  );
}
