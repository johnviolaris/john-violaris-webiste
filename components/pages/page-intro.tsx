import Image from "next/image";
import { IntentLink as Link } from "@/components/ui/intent-link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import type { PageIntroFigure } from "@/lib/content/pages";
export function PageIntro({
  eyebrow,
  title,
  emphasis,
  description,
  figure,
  children,
}: {
  eyebrow: string;
  title: string;
  emphasis: string;
  description: string;
  /** A photograph set beside the heading, for the page that has one. */
  figure?: PageIntroFigure;
  /** An action set beneath the standfirst, for the page that needs one. */
  children?: ReactNode;
}) {
  const text = (
    <>
      <p className="eyebrow">
        <span className="small-rule" /> {eyebrow}
      </p>
      <h1>
        {title}
        <br />
        <em>{emphasis}</em>
      </h1>
      <p className="page-intro-description">{description}</p>
      {children ? <div className="page-intro-action">{children}</div> : null}
    </>
  );
  // A wide photograph takes a wider column beside the heading than a tall one.
  const landscape = figure ? figure.width > figure.height : false;
  return (
    <section className="page-intro">
      <Container>
        <Link href="/" className="breadcrumb">
          Home <span>/</span> {eyebrow}
        </Link>
        {/* The figure starts level with the eyebrow, below the breadcrumb. */}
        {figure ? (
          <div className="page-intro-split">
            <div>{text}</div>
            <figure className={`page-intro-figure page-intro-figure-${landscape ? "landscape" : "portrait"}`}>
              <Image
                src={figure.src}
                alt={figure.alt}
                width={figure.width}
                height={figure.height}
                loading="eager"
                fetchPriority="high"
                sizes={landscape
                  ? "(max-width: 767px) min(100vw - 40px, 420px), 380px"
                  : "(max-width: 767px) min(100vw - 40px, 300px), 290px"}
              />
              {figure.caption ? <figcaption>{figure.caption}</figcaption> : null}
            </figure>
          </div>
        ) : (
          text
        )}
      </Container>
    </section>
  );
}
