import Link from "next/link";

import { Container } from "@/components/ui/container";
import { gaMeasurementId } from "@/lib/analytics";
import type { SiteConfig } from "@/lib/site-config";

/**
 * The privacy notice's body (UK GDPR Article 13).
 *
 * Written in code rather than the CMS, like the cookie policy and for the same
 * reason: it describes what the code does with an enquiry — the fields the
 * form stores, the hashed address the rate limit keeps, the services it passes
 * through — so it has to change when the code does. The analytics passages
 * follow the analytics switch by themselves.
 *
 * Nothing here is invented. There is no ICO registration number, office
 * address or retention period in it, because none has been supplied; each can
 * be added once John confirms it. Supabase's region was read from the project
 * on 2026-10-03.
 */
export function PrivacyNotice({ config }: { config: SiteConfig }) {
  const email = <a href={config.mailtoHref}>{config.email}</a>;

  return (
    <section className="section-space">
      <Container>
        <div className="article-body policy-body">
          <section>
            <h2>Who is responsible for your information</h2>
            <p>
              {config.name}, {config.role.toLowerCase()}, is responsible for the
              personal information you send through this website. Questions
              about it, and requests to see, correct or delete it, go to{" "}
              {email}.
            </p>
            <p>
              If you go on to instruct John, you will be given the client care
              and privacy information that applies to your case.
            </p>
          </section>

          <section>
            <h2>What the website collects</h2>
            <p>
              <strong>When you send the enquiry form:</strong> your name, phone
              number and email address, the type of matter, any court or
              interview date and place you give, and your description of what
              has happened. The page you sent it from is recorded with it, and
              so is a one-way scrambled (hashed) version of your connection’s
              IP address, used only to stop repeated submissions. The address
              itself is not stored.
              {gaMeasurementId
                ? " If you accepted analytics, the website and campaign tags that brought you here are attached as well."
                : null}
            </p>
            <p>
              <strong>When you call, email or message John on WhatsApp:</strong>{" "}
              what you send goes straight to him through that service. WhatsApp
              messages are also covered by WhatsApp’s own privacy policy.
            </p>
            <p>
              <strong>When you browse:</strong> nothing that identifies you
              {gaMeasurementId
                ? ", unless you accept analytics cookies"
                : null}
              . The <Link href="/cookies">cookie policy</Link> lists everything
              this site keeps in your browser.
            </p>
          </section>

          <section>
            <h2>Why it is used</h2>
            <p>
              To understand your situation, reply to you, and take the steps you
              ask for before you decide whether to instruct John. The law allows
              this because you have asked for it, and because John has a
              legitimate interest in answering the people who contact him.
            </p>
            <p>
              Details of an alleged offence are criminal offence information,
              which the law protects more closely. They are used because they
              are needed to give you legal advice and to establish, exercise or
              defend your legal rights (Data Protection Act 2018, Schedule 1,
              paragraph 33).
            </p>
            <p>
              Your information is never sold and never used for marketing.
            </p>
          </section>

          <section>
            <h2>Who can see it</h2>
            <p>
              Your enquiry is read by John. It is kept in an admin area that
              only John, and the people who maintain this website for him, can
              sign in to.
            </p>
            <p>These services handle it for him, only to run the website:</p>
            <ul>
              <li>Vercel hosts the website.</li>
              <li>
                Supabase stores enquiries, in the European Union (Ireland).
              </li>
              <li>
                Resend sends John his notification and you your confirmation
                email.
              </li>
              {gaMeasurementId ? (
                <li>
                  Google Analytics counts visits, only if you accept analytics
                  cookies. It is never sent your name, your contact details or
                  anything about your enquiry.
                </li>
              ) : null}
            </ul>
            <p>
              Some of these providers are based in, or use servers in, the
              United States. Where your information leaves the UK, it is
              protected by the safeguards UK data protection law requires.
            </p>
          </section>

          <section>
            <h2>How long it is kept</h2>
            <p>
              Only as long as it is needed: to reply to you and, if you instruct
              John, as part of your case file under the record-keeping rules
              that apply to it. You can ask for your enquiry to be deleted at
              any time.
            </p>
          </section>

          <section>
            <h2>Your rights</h2>
            <p>
              You can ask to see the information held about you, to have it
              corrected or deleted, to restrict or object to how it is used, and
              to receive a copy of what you provided. Email {email}.
            </p>
            <p>
              If you are unhappy with how your information has been handled,
              you can complain to the Information Commissioner’s Office at{" "}
              <a
                href="https://ico.org.uk/make-a-complaint/"
                target="_blank"
                rel="noopener noreferrer"
              >
                ico.org.uk/make-a-complaint
              </a>
              . John would appreciate the chance to put things right first.
            </p>
            <p>
              <em>Updated 3 October 2026.</em>
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
