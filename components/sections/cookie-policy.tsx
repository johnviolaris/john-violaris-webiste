import { CookieSettingsButton } from "@/components/layout/analytics";
import { Container } from "@/components/ui/container";
import { consentStorageKey, gaMeasurementId } from "@/lib/analytics";

/**
 * The cookie policy's body (REQ-054).
 *
 * Written in code rather than the CMS, and on purpose: it describes what the
 * code stores, so it has to change when the code does, and it follows the
 * analytics switch by itself. With no measurement ID configured it says the
 * site sets no cookies for visitors, which is then the truth.
 *
 * Checked 2026-09-25: the ReviewSolicitors panels set no cookies on this
 * domain and their responses carry no `Set-Cookie`.
 */
export function CookiePolicy() {
  const rows = gaMeasurementId
    ? [
        {
          name: consentStorageKey,
          by: "This site",
          purpose:
            "Remembers whether you accepted or rejected analytics cookies, so you are not asked on every page. Kept in your browser’s storage rather than as a cookie.",
          kept: "Until you clear your browser’s data",
        },
        {
          name: "_ga",
          by: "Google Analytics, only if you accept",
          purpose:
            "Tells visits from the same browser apart, so that people are counted rather than page loads.",
          kept: "2 years",
        },
        {
          name: `_ga_${gaMeasurementId.slice(2)}`,
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
            {gaMeasurementId ? (
              <p>
                Nothing is stored in your browser until you answer the cookie
                question. Your answer is then remembered, and if you accept,
                Google Analytics sets two cookies. All three are listed here.
              </p>
            ) : (
              <p>
                This site does not use analytics or advertising cookies, and it
                sets no cookies for visitors at all.
              </p>
            )}
            {rows.length > 0 ? (
              <div className="service-outcomes-table-wrap">
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

          {gaMeasurementId ? (
            <section>
              <h2>What analytics is used for</h2>
              <p>
                Google Analytics shows which pages people read, and which of
                them lead to a call, a WhatsApp message, an email or an enquiry.
                It is never sent your name, your contact details or anything
                about your enquiry.
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
