import Link from "next/link";
import { QuestionsAccordion } from "@/components/sections/questions-accordion";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icons";
import { Lines, Paragraphs } from "@/components/ui/lines";
import { feesPreviewDefaults } from "@/lib/content/pages";
import type { FeesPreviewContent } from "@/lib/content/pages";

export function FeesPreview({
  content = feesPreviewDefaults,
}: {
  content?: FeesPreviewContent;
}) {
  return (
    <section
      className="questions-section section-space"
      aria-labelledby="questions-heading"
    >
      <Container>
        <div className="questions-grid">
          <div className="fees-note">
            <p className="eyebrow">
              <span className="small-rule" /> {content.eyebrow}
            </p>
            <h2 id="questions-heading" className="display-heading">
              <Lines values={content.headline} />
              <br />
              {content.headlineEmphasisLead}{" "}
              <em>{content.headlineEmphasis}</em>
            </h2>
            <Paragraphs values={content.body} />
            {content.linkLabel ? (
              <Link href="/fees" className="text-link">
                {content.linkLabel} <Icon name="arrowRight" size={17} />
              </Link>
            ) : null}
          </div>
          <div>
            {/* A label rather than a heading: the questions are already
                headings under the section's own. */}
            {content.questionsTitle ? (
              <p className="eyebrow questions-title">
                <span className="small-rule" /> {content.questionsTitle}
              </p>
            ) : null}
            <QuestionsAccordion questions={content.questions} />
          </div>
        </div>
      </Container>
    </section>
  );
}
