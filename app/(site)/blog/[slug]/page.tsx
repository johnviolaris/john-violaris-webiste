import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { OnThisPage } from "@/components/ui/on-this-page";
import { Icon } from "@/components/ui/icons";
import { JsonLd } from "@/components/ui/json-ld";
import { CtaBanner } from "@/components/layout/cta-banner";
import {
  getArticle,
  getArticles,
  getServices,
  getSiteConfig,
} from "@/lib/cms/queries";
import { redirectFromCms } from "@/lib/cms/redirects";

import {
  articleId,
  blogPostingNode,
  breadcrumbNode,
  graph,
  webPageNode,
} from "@/lib/cms/seo/json-ld";
import { seoMetadataFor, structuredDataFor } from "@/lib/cms/seo/metadata";
import { blogIntroDefaults } from "@/lib/content/pages";
import { formatUkDate } from "@/lib/format";
import { slugify } from "@/lib/slug";

/**
 * Prerender every published article at build time.
 *
 * `dynamicParams` is left at its default, so an article published after the
 * build renders on first request rather than 404ing while it waits for a
 * deploy. The publish action revalidates its path either way.
 */
export async function generateStaticParams() {
  const articles = await getArticles();

  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // The headline, the excerpt and the featured image, from the route registry
  // and any SEO override. An unpublished or missing article gets nothing.
  return seoMetadataFor(`/blog/${slug}`);
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const path = `/blog/${slug}`;

  const [article, articles, services, config] = await Promise.all([
    getArticle(slug),
    getArticles(),
    getServices(),
    getSiteConfig(),
  ]);

  if (!article) {
    await redirectFromCms(path);
    notFound();
  }

  const structured = await structuredDataFor(path, article.title);
  // What the index calls itself, which is also the breadcrumb back to it.
  const index = blogIntroDefaults.eyebrow;

  const related = services.find(
    (service) => service.href === article.relatedService,
  );
  const more = articles.filter((item) => item.slug !== article.slug).slice(0, 3);
  const sections = article.body.map((block) => ({
    id: slugify(block.heading),
    label: block.heading,
  }));

  return (
    <>
      <JsonLd
        data={graph([
          ...structured.site,
          webPageNode({
            page: structured.page,
            // The article is the subject, not the practice.
            about: null,
            mainEntity: { "@id": articleId(path) },
            hasBreadcrumb: true,
          }),
          // The printed trail stops at the index; the article it leads to is
          // the heading directly beneath it.
          breadcrumbNode(path, [
            { name: index, path: "/blog" },
            { name: article.title, path },
          ]),
          blogPostingNode({
            path,
            headline: article.title,
            description: structured.page.description,
            image: article.featuredImage,
            section: article.category,
            datePublished: article.publishedAt,
            dateModified: structured.lastModified,
          }),
        ])}
      />
      <section className="article-intro">
        <Container>
          <Link href="/blog" className="breadcrumb">
            Home <span>/</span> {index}
          </Link>
          <p className="eyebrow">
            <span className="small-rule" /> {article.category}
          </p>
          <h1>{article.title}</h1>
          <p className="article-standfirst">{article.standfirst}</p>
          {/* Only articles given an image in the CMS have one; the rest open
              exactly as they did before. */}
          {article.featuredImage && (
            <div className="article-hero-image">
              <Image
                src={article.featuredImage}
                alt={article.featuredImageAlt ?? ""}
                fill
                sizes="(max-width: 860px) 100vw, 760px"
                priority
              />
            </div>
          )}
          {/*
            Who wrote it and how current it is (REQ-063): legal guidance is
            judged on both. The name links to the About page, which says who
            John is; the date is the article's last save, the same value as
            `dateModified` in the markup above. "Updated", not "Reviewed": a
            save proves the article changed, not that the law was re-checked.
          */}
          <div className="article-meta">
            <Link href="/about" rel="author" className="article-byline">
              {config.name}
            </Link>
            <span>{config.role}</span>
            {structured.lastModified ? (
              <span>
                Updated{" "}
                <time dateTime={structured.lastModified}>
                  {formatUkDate(structured.lastModified)}
                </time>
              </span>
            ) : null}
            <span>{article.readTime}</span>
          </div>
        </Container>
      </section>

      <section className="section-space">
        <Container>
          <div className="article-layout">
            <div className="article-body">
              {article.body.map((block) => (
                <section key={block.heading}>
                  <h2 id={slugify(block.heading)}>{block.heading}</h2>
                  {block.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {block.list && (
                    <ul>
                      {block.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              {/*
                Publishing legal commentary invites people to act on it. Say
                plainly that it is general information, as the reference firms
                do on their own guides.
              */}
              <p className="article-disclaimer">
                This article is general information about the law in England and
                Wales. It is not legal advice and it does not take account of
                your circumstances. If you are facing a charge or an
                investigation, speak to a solicitor about your own case.
              </p>

              {related && (
                <Link href={related.href} className="text-link">
                  Read more about {related.name.toLowerCase()}{" "}
                  <Icon name="arrowRight" size={17} />
                </Link>
              )}
            </div>

            <div className="page-rail">
              <OnThisPage items={sections} />
              <aside className="service-contact-card" data-track="contact_card">
                <span className="eyebrow">Speak directly to John</span>
                <h2>
                  It starts with
                  <br />
                  <em>a conversation.</em>
                </h2>
                <p>
                  A free initial consultation. A chance to explain your
                  situation and understand the next step.
                </p>
                <Link href={config.bookingHref} className="action-button">
                  Discuss your case <Icon name="arrowRight" size={17} />
                </Link>
                <span className="service-contact-caption">
                  20+ years in criminal defence
                  <br />
                  Representing clients across England &amp; Wales
                </span>
              </aside>
            </div>
          </div>

          {more.length > 0 && (
            <div className="related-services">
              <p className="eyebrow">More guides</p>
              {more.map((item) => (
                <Link key={item.slug} href={`/blog/${item.slug}`}>
                  {item.title}
                  <Icon name="arrowRight" size={18} />
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      <CtaBanner
        config={config}
        heading="Still have questions?"
        emphasis="Let’s talk them through."
      />
    </>
  );
}
