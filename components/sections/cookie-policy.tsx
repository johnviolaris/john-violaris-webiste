import { CookieSettingsButton } from "@/components/layout/analytics";
import { Container } from "@/components/ui/container";
import { consentStorageKey, gaMeasurementId } from "@/lib/analytics";
import { enquiryAttributionStorageKey } from "@/lib/enquiries/attribution";
import { getIntegrationSettings } from "@/lib/cms/seo/integration-queries";

/**
 * The cookie policy's body (REQ-054).
 *
 * Written in code rather than the CMS, and on purpose: it describes what the
 * code stores, so it has to change when the code does, and it follows the
 * same public integration switch as the site layout. With analytics disabled
 * or no measurement ID configured it says the
 * site sets no cookies or campaign-attribution storage for visitors, which is
 * then the truth.
 *
 * Checked 2026-09-25: the ReviewSolicitors panels set no cookies on this
 * domain and their responses carry no `Set-Cookie`.
 */
export async function CookiePolicy() {
  const integrations = await getIntegrationSettings();
  const measurementId = gaMeasurementId ?? "";
  const analyticsEnabled = integrations.ga4 && Boolean(measurementId);
  const rows = analyticsEnabled
    ? [
        {
          name: consentStorageKey,
          by: "This site",
          purpose:
            "Remembers whether you accepted or rejected analytics cookies, so you are not asked on every page. Kept in your browser’s storage rather than as a cookie.",
          kept: "Until you clear your browser’s data",
        },
        {
          name: enquiryAttributionStorageKey,
          by: "This site, only if you accept analytics",
          purpose:
            "Keeps the external referrer and campaign tags that brought you here for this browser tab. They are attached only if you choose to send an enquiry, and are not sent to Google.",
          kept: "Until you close this browser tab",
        },
        {
          name: "_ga",
          by: "Google Analytics, only if you accept",
          purpose:
            "Tells visits from the same browser apart, so that people are counted rather than page loads.",
          kept: "2 years",
        },
        {
          name: `_ga_${measurementId.slice(2)}`,
          by: "Google Analytics, only if you accept",
          purpose: "Keeps track of the current visit.",
          kept: "2 years",
        },
      ]
    : [];

  return (
    <section className="section-space">
      <Container>
        <div className="article-body policy-body">
          <section>
            <h2>What this site stores</h2>
            {analyticsEnabled ? (
              <p>
                Nothing is stored in your browser until you answer the cookie
                question. Your answer is then remembered. If you accept, this
                site keeps campaign attribution for this tab and Google
                Analytics sets two cookies. All four are listed here.
              </p>
            ) : (
              <p>
                This site does not use analytics or advertising cookies, and it
                sets no cookies or campaign-attribution storage for visitors.
              </p>
            )}
            {rows.length > 0 ? (
              <div
                className="service-outcomes-table-wrap"
                role="region"
                aria-label="Cookies and storage"
                tabIndex={0}
              >
                <table className="service-outcomes-table">
                  <caption>Cookies and storage</caption>
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Set by</th>
                      <th scope="col">What it is for</th>
                      <th scope="col">Kept for</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.name}>
                        <th scope="row">
                          <code>{row.name}</code>
                        </th>
                        <td>{row.by}</td>
                        <td>{row.purpose}</td>
                        <td>{row.kept}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          {analyticsEnabled ? (
            <section>
              <h2>What analytics is used for</h2>
              <p>
                Google Analytics shows which pages people read, and which of
                them lead to a call, a WhatsApp message, an email or an enquiry.
                It is never sent your name, your contact details or anything
                about your enquiry.
              </p>
              <p>
                With your consent, it also measures page loading, responsiveness
                and layout movement.
              </p>
              <h2>Changing your mind</h2>
              <p>
                You can change your answer at any time. Rejecting after
                accepting deletes the Google Analytics cookies from this site.
              </p>
              <CookieSettingsButton className="action-button policy-settings" />
            </section>
          ) : null}

          <section>
            <h2>Other services on this site</h2>
            <p>
              The reviews are shown by ReviewSolicitors, whose own privacy
              policy covers their review panels.
            </p>
            <p>
              The admin area, which only John uses, sets cookies that keep him
              signed in. Visitors never receive them.
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
