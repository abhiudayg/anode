import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Calendar,
  Clock,
  ChevronLeft,
  Share2,
  Terminal,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { BLOG_POSTS } from "@/data/blogPosts";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: `${post.title} | Anode Engineering Journal`,
    description: post.subtitle,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.subtitle,
      url: `https://anode.abhiudayg.dev/blog/${post.slug}`,
      type: "article",
      publishedTime: "2026-11-11T00:00:00.000Z",
      authors: [post.author],
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.subtitle,
      images: ["/og-image.png"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://anode.abhiudayg.dev"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Technical Journal",
        "item": "https://anode.abhiudayg.dev/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://anode.abhiudayg.dev/blog/${post.slug}`
      }
    ]
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": post.title,
    "description": post.subtitle,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "datePublished": "2026-11-11T00:00:00Z",
    "publisher": {
      "@type": "Organization",
      "name": "Anode",
      "url": "https://anode.abhiudayg.dev"
    }
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-[#f3f4f6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <article className="space-y-8">
          {/* Breadcrumb & Back */}
          <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-mono-code text-cyan-400 hover:text-cyan-300 transition-colors py-1 px-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/30"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Journal</span>
            </Link>

            <span className="text-xs font-mono-code text-neutral-500">
              {post.category}
            </span>
          </div>

          {/* Header */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono-code">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 font-semibold">
                {post.category}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                {post.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                {post.readTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {post.title}
            </h1>

            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
              {post.subtitle}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                {post.author[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{post.author}</div>
                <div className="text-xs text-neutral-500 font-mono-code">{post.authorRole}</div>
              </div>
            </div>
          </div>

          {/* Long-form Article Body */}
          <div className="space-y-10 text-neutral-300 pt-4">
            {post.sections.map((sec, idx) => (
              <section key={idx} className="space-y-4">
                <h2 className="text-2xl font-bold text-white tracking-tight pt-4">
                  {sec.heading}
                </h2>

                {sec.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-sm sm:text-base leading-relaxed text-neutral-300">
                    {p}
                  </p>
                ))}

                {sec.callout && (
                  <div
                    className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed my-4 ${
                      sec.callout.type === "warning"
                        ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                        : sec.callout.type === "tip"
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                        : "bg-cyan-950/20 border-cyan-500/30 text-cyan-200"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>{sec.callout.text}</div>
                    </div>
                  </div>
                )}

                {sec.codeBlock && (
                  <div className="rounded-xl border border-white/[0.08] bg-[#06070a] overflow-hidden my-6 shadow-inner">
                    <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono-code text-neutral-400">
                      <span>{sec.codeBlock.title}</span>
                      <span className="uppercase text-[10px] text-neutral-500 font-semibold">
                        {sec.codeBlock.language}
                      </span>
                    </div>
                    <pre className="p-4 overflow-x-auto text-xs font-mono-code text-neutral-200 leading-relaxed">
                      <code>{sec.codeBlock.code}</code>
                    </pre>
                  </div>
                )}
              </section>
            ))}

            {/* End of article CTA */}
            <div className="p-8 rounded-2xl bg-[#07090e] border border-cyan-500/30 mt-12 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <span>Try Anode On Your Go Codebase</span>
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Inspect your existing Go microservices in under 20ms and deploy directly to any Linux VPS without Dockerfiles or YAML.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/docs#quickstart"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold font-mono-code transition-colors"
                >
                  Read Quickstart →
                </Link>
                <a
                  href="https://github.com/abhiudayg/anode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono-code text-white transition-colors"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
