import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { OnThisPage } from "@/components/ui/on-this-page";
import { Icon } from "@/components/ui/icons";
import { JsonLd } from "@/components/ui/json-ld";
import { ImageCaption } from "@/components/ui/image-caption";
import { FaqBlock } from "@/components/ui/faq-block";
import { faqSectionId, resolveFaqItems } from "@/lib/cms/faq";
import { CtaBanner } from "@/components/layout/cta-banner";
import {
  articleId,
  blogPostingNode,
  breadcrumbNode,
  graph,
  faqPageNode,
  webPageNode,
} from "@/lib/cms/seo/json-ld";
import { structuredDataFor } from "@/lib/cms/seo/metadata";
import { blogIntroDefaults } from "@/lib/content/pages";
import { formatUkDate } from "@/lib/format";
import { slugify } from "@/lib/slug";

import type { Article, Service } from "@/lib/cms/types";
import type { SiteConfig } from "@/lib/site-config";

export async function ArticlePageContent({ article, articles, services, config, preview = false, updatedAt }: { article: Article; articles: Article[]; services: Service[]; config: SiteConfig; preview?: boolean; updatedAt?: string | null }) {
  const path = `/blog/${article.slug}`;
  const structured = preview ? null : await structuredDataFor(path, article.title);
  const lastModified = structured?.lastModified ?? updatedAt;
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
  const faqs = resolveFaqItems(article.faqItems);
  const faqId = faqSectionId(sections.map((section) => section.id));
  const faqSchema = faqPageNode({ path, items: faqs, sectionId: faqId });
  if (faqs.length) sections.push({ id: faqId, label: "Frequently asked questions" });

  return (
    <>
      {structured && <JsonLd
        data={graph([
          ...structured.site,
          webPageNode({
            page: structured.page,
            // The article is the subject, not the practice.
            about: null,
            mainEntity: { "@id": articleId(path) },
            ...(faqSchema ? { hasPart: { "@id": faqSchema["@id"] } } : {}),
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
            dateModified: lastModified ?? undefined,
          }),
          ...(faqSchema ? [faqSchema] : []),
        ])}
      />}
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
            <figure>
            <div className="article-hero-image">
              <Image
                src={article.featuredImage}
                alt={article.featuredImageAlt ?? ""}
                title={article.featuredImageTitle}
                fill
                sizes="(max-width: 860px) 100vw, 760px"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            {article.featuredImageCaption && <figcaption className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground"><ImageCaption caption={article.featuredImageCaption} format={article.featuredImageCaptionFormat} /></figcaption>}
            </figure>
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
            {lastModified ? (
              <span>
                Updated{" "}
                <time dateTime={lastModified}>
                  {formatUkDate(lastModified)}
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

              <FaqBlock items={faqs} id={faqId} />

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
