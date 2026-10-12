import { IntentLink as Link } from "@/components/ui/intent-link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
export function PageIntro({
  eyebrow,
  title,
  emphasis,
  description,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  emphasis: string;
  description: string;
  /** A figure set beside the heading, for the page that has one. */
  aside?: ReactNode;
  /** An action set beneath the standfirst, for the page that needs one. */
  children?: ReactNode;
}) {
  const text = (
    <>
      <Link href="/" className="breadcrumb">
        Home <span>/</span> {eyebrow}
      </Link>
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
  return (
    <section className="page-intro">
      <Container>
        {aside ? (
          <div className="page-intro-split">
            <div>{text}</div>
            {aside}
          </div>
        ) : (
          text
        )}
      </Container>
    </section>
  );
}
