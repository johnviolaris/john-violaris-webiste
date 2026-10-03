Product Requirements Document (PRD)
John Violaris — Criminal Defence Solicitor Website

Current scope decisions

This document incorporates the following approved delivery decisions:

- The Vercel application deployment identified in Phase 1 is complete; this
  does not by itself mark every Phase 1 launch or external-service task complete.
- Consultation calls to action lead visitors to the contact journey; no TidyCal or other booking-calendar integration is in scope.
- The public website does not display fee figures, and the admin area does not include fee-schedule management. The Fees page explains the consultation and fee-setting process without publishing prices.

1. Product Overview

Build a production-ready website for John Violaris, a criminal defence solicitor practising across England & Wales, with a strong focus on motoring offences and police station representation.

The website is primarily a lead-generation and trust-building platform. Visitors are often arriving during stressful situations — facing a driving ban, court hearing, police interview, or criminal charge — so the experience must immediately communicate professionalism, reassurance, expertise, and direct access to John.

The site should feel personal rather than corporate. John is the product and the key differentiator is that clients deal directly with the solicitor handling their case rather than with a large law firm, junior staff, sales team, or call centre.

The website should be modern, premium, fast, responsive, SEO-friendly, and easy for John to manage without developer assistance.

2. Primary Objectives

The website should:

Generate qualified private-client enquiries.
Build trust quickly through John's experience and credentials.
Clearly explain the legal services John provides.
Make contacting John extremely easy.
Allow visitors to request a free initial consultation.
Provide useful offence-specific information that can rank in Google.
Allow John to manage website content through a secure CMS.
Provide a strong technical SEO foundation for future SEO work.
Perform well across mobile, tablet, and desktop.
Be easy to maintain and expand with additional service pages and blog content.
3. Target Audience

Primary users are individuals in England & Wales who:

Have been accused of a motoring offence.
Are at risk of losing their driving licence.
Have received penalty points or are approaching 12 points.
Have been charged with drink driving or drug driving.
Are facing speeding or mobile phone offences.
Need advice regarding exceptional hardship or special reasons.
Have been arrested or invited to a police interview.
Have an upcoming Magistrates' Court hearing.
Need urgent criminal defence representation.
Want to speak directly with an experienced solicitor.

These users may be anxious and unfamiliar with the legal process, so content should be clear, direct, reassuring, and written in plain English.

4. Brand & Positioning

The website should position John as:

Experienced.
Professional.
Approachable.
Trustworthy.
Direct.
Personal.
Transparent.

Key trust points include:

Qualified solicitor since 2005.
20+ years of criminal defence experience.
10,000+ police station attendances.
Personal representation.
Practises across England & Wales.
Extensive police station and Magistrates' Court experience.
Free initial consultation.
Clear information about how fees are discussed and agreed privately.

A major recurring message should be:

You deal directly with John.

The website should avoid feeling like a generic large law firm.

5. Technology Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
App Router
Backend / CMS
Supabase
PostgreSQL
Supabase Auth
Supabase Storage where required
Email
Resend
Hosting
Vercel
Source Control
GitHub
6. Public Website Pages
6.1 Home

The homepage should quickly communicate:

Who John is.
What he specialises in.
Why clients should trust him.
Why direct representation matters.
How to contact him.

Recommended sections:

Hero with professional portrait and primary CTA.
Trust statistics.
Personal representation section.
Main services.
Urgent help section.
Experience section.
How the process works.
Testimonials / reviews.
Fee-process preview.
Final consultation CTA.

Primary CTA:

Book a Free Consultation

Secondary actions:

Call John.
WhatsApp John.
Contact John.
6.2 About

A personal profile page explaining:

John's background.
Career history.
Qualifications.
Criminal defence experience.
Police station experience.
Professional philosophy.
Personal approach to clients.

The page should make visitors feel that they know who they will be speaking to before making contact.

6.3 Services

Overview of the areas John handles.

Potential services include:

Drink Driving
Drug Driving
Speeding
Totting Up / 12 Points
Exceptional Hardship
Special Reasons
Careless Driving
Dangerous Driving
Mobile Phone Offences
Driving Without Insurance
Failing to Stop / Report
Section 172 / Driver Details
Police Station Representation
General Criminal Defence

Each service should have a short explanation and link to a detailed service page where available.

6.4 Individual Service Pages

Use a reusable service-page architecture rather than creating each page independently.

Each service page can contain:

Service-specific hero.
Overview.
Potential penalties/consequences.
Relevant legal process.
Possible defence issues.
How John can assist.
What happens next.
Fees-information CTA.
Consultation-request CTA.
Related services.

Desktop service pages may include a sticky contact sidebar with:

Call John.
WhatsApp.
Request Consultation.
Free initial consultation message.

The architecture should make it easy to create additional service pages through the CMS later.

6.5 Fees

Explain clearly how fees are assessed and agreed with a prospective client.

The approved scope is deliberately limited:

Free initial consultation.
Factors that can affect the work required.
An explanation that John discusses the scope and fee privately before instruction.
A clear route to contact John for a case-specific discussion.

The website must not publish fee figures, price ranges, fee cards, or a fee schedule.

Fee-schedule management is not part of the CMS. General Fees-page copy remains editable with the other website content.

6.6 Police Station

Dedicated page focused on John's extensive police station experience.

Key topics:

Why early legal advice matters.
What happens before an interview.
What John does during an interview.
What happens afterward.
Legal aid / free police station advice information.
Continuity if the matter proceeds to court.

This page should prominently communicate John's 10,000+ police station attendances.

Urgent contact should be highly visible.

6.7 Blog / Resources

SEO-focused legal content area.

Admin should be able to:

Create posts.
Edit posts.
Publish/unpublish posts.
Add images.
Manage categories.
Set SEO metadata.
Set URL slug.
Add image alt text.

Blog article pages should be optimized for readability and search engines.

6.8 Contact

The contact page should make contacting John extremely simple.

Contact form fields
First Name
Last Name
Phone Number
Email Address
Type of Matter
Court Date
Court Location
Brief Description of Case
Contact methods
Contact form.
Direct email.
WhatsApp.
Direct phone call.

Urgent cases should prominently display:

Court tomorrow or police interview today? Please call rather than email.

7. Contact Form & Email Flow

When a visitor submits the enquiry form:

Validate the submitted fields.
Submit the enquiry securely.
Send John an email notification through Resend.
Send the visitor a confirmation email through Resend.
Display a clear success state.
Handle failures gracefully.

The notification sent to John should contain the relevant enquiry details.

The user confirmation should acknowledge receipt without making legal guarantees.

8. WhatsApp

No WhatsApp Business API is required for the initial product.

Use WhatsApp Click-to-Chat.

When a visitor clicks the WhatsApp action:

Open WhatsApp.
Open a conversation with John's configured number.
Optionally pre-fill a short introductory message.

John will handle enquiries personally.

9. Direct Email

Display John's email address visibly.

Clicking it should use a standard mailto: link and open the visitor's configured email application.

10. Direct Phone Contact

Phone numbers should use tel: links.

This is particularly important for:

Mobile users.
Urgent court matters.
Police station representation.
11. Consultation Requests

No booking-calendar integration is in scope.

The site should provide consultation calls to action throughout relevant pages. These lead to the contact journey, where a visitor can submit the enquiry form, call, email, or use WhatsApp.

Example:

Book a Free Consultation

CTA destinations should be centralized rather than hardcoded across multiple components.

12. Admin Authentication

Create a secure protected admin area.

Use:

Supabase Auth

Only authorized admin users should access the CMS.

Public visitors must never have access to administration functionality.

13. CMS Dashboard

John should not need to use the raw Supabase database interface for ordinary content changes.

Create a purpose-built CMS/admin dashboard.

The CMS should allow management of relevant content including:

Website content
Text
Hero content
Images
Calls to action
Contact information
Services
Service name
Description
Full page content
Publish status
URL slug
Images
Reviews
Read-only view of the verified ReviewSolicitors reviews shown publicly
No testimonial editing or publishing workflow; corrections stay with the source platform
Surrounding Reviews-page copy remains editable under Website Content
Blog
Title
Slug
Excerpt
Content
Featured image
Category
Publish state
Publication date
14. SEO Management

Admin should be able to edit SEO information where appropriate.

Fields may include:

Meta title.
Meta description.
URL slug.
Canonical URL where necessary.
Open Graph title.
Open Graph description.
Open Graph image.
Image alt text.
15. Technical SEO

Implement a strong technical SEO foundation.

Requirements include:

Semantic HTML.
Proper heading hierarchy.
Unique page titles.
Meta descriptions.
Canonical URLs.
Sitemap.
robots.txt.
Search-friendly URLs.
Open Graph metadata.
Structured internal linking.
Optimized images.
Fast page rendering.
Server-rendered/static content where appropriate.

Implement relevant Schema.org structured data where appropriate, for example:

LegalService
Person
Article
BreadcrumbList
FAQPage where valid

Do not guarantee search-engine rankings.

16. Analytics & Search

Configure:

Google Analytics.
Google Search Console.

The website should be ready for future professional SEO work.

17. Reviews / Testimonials

The UI should support displaying trusted reviews.

Possible sources include:

ReviewSolicitors.
Trustpilot.
Manually managed verified testimonials.

Initial implementation may use:

Provider widget/embed.
CMS-managed reviews.

Do not create fake verified reviews.

18. Responsive Requirements

The website must provide an excellent experience across:

Mobile.
Tablet.
Laptop.
Desktop.

Important breakpoints to test include approximately:

375px.
768px.
1024px.
1440px.

Mobile layouts should be designed intentionally rather than simply shrinking desktop layouts.

19. Accessibility

Follow common accessibility best practices.

Requirements include:

Semantic HTML.
Keyboard navigation.
Visible focus states.
Proper form labels.
Sufficient colour contrast.
Alt text for meaningful images.
Accessible navigation.
Appropriate ARIA attributes where necessary.

The scope does not include a formal external accessibility certification.

20. Performance

The website should be optimized for:

Fast first load.
Optimized images.
Efficient font loading.
Minimal unnecessary JavaScript.
Core Web Vitals.
Good Lighthouse results.

Target a Lighthouse score of approximately 90+ where realistically achievable.

21. Multi-Domain Support

The client intends to use:

johnviolaris.com
drivingjustice.co.uk

The system should support both domains through Vercel.

The apex `johnviolaris.com` is the primary/canonical domain.

`www.johnviolaris.com`, `drivingjustice.co.uk` and
`www.drivingjustice.co.uk` permanently redirect path-for-path, preserving query
strings, to the canonical HTTPS apex. Those domains were attached and the
DNS/SSL cutover completed on 2026-10-03.

Avoid duplicate indexed versions of identical content.

Domain configuration should be centralized and easy to adjust.

22. Security

Implement standard production security practices.

Requirements include:

Protected admin routes.
Supabase authentication.
Appropriate database access policies.
Secure environment variables.
Server-side validation.
No sensitive secrets exposed to the browser.
Safe form handling.
Spam protection where appropriate.
Secure file-storage policies.
23. Backups & Recoverability

The production application should use:

GitHub for source-code history and recovery.
Supabase production database backups based on the selected plan.
Vercel deployments with rollback capability.

Long-term monitoring and maintenance can be handled separately after launch.

24. SSL

Production domains will use Vercel-managed SSL.

SSL provisioning and renewal should be automatic once DNS/domain configuration is correct.

25. Content Rules

Never invent:

SRA number.
Legal credentials.
Awards.
Case results.
Client testimonials.
Phone numbers.
Addresses.
Pricing.

Missing information should use clearly identifiable placeholders or configurable values.

Avoid guaranteed legal-outcome language.

Do not use claims such as:

"We will save your licence."

Prefer language such as:

"John will assess the available defence and mitigation options in your case."

26. UX Principles

The website should consistently prioritize:

Trust

Make credentials, experience, direct representation and genuine reviews visible.

Personal connection

John should appear throughout the site through photography, first-person copy and direct contact CTAs.

Simplicity

Visitors should immediately understand where to go.

Reassurance

Avoid overly aggressive or fear-based legal marketing.

Conversion

Every important page should offer a clear path to:

Request a consultation.
Call.
WhatsApp.
Submit an enquiry.
27. Visual Direction

The overall design should feel:

Premium.
Professional.
Established.
Personal.
Calm.
Trustworthy.

A sophisticated navy / warm neutral / muted gold direction is appropriate.

Avoid:

Generic SaaS aesthetics.
Excessive gradients.
Glassmorphism.
Overly flashy animation.
Excessive icons.
Generic corporate-law imagery.
Designs that feel like a large impersonal law firm.

Use genuine professional photography of John wherever possible.

28. Reusable Architecture

Build the application around reusable components and data structures.

Examples:

components/
  layout/
  ui/
  sections/
  services/
  forms/
  admin/

Possible data entities:

Site Settings
Services
Service Pages
Testimonials
Blog Posts
Blog Categories
SEO Metadata

Avoid duplicating layouts across individual service pages.

29. Central Site Configuration

Store common information centrally, including:

John's phone number
WhatsApp number
Email address
Primary domain
Secondary domain
Social/profile URLs

Do not hardcode this information in dozens of components.

30. Definition of Done

The project is considered complete when:

Public pages are implemented.
Website is responsive.
CMS is operational.
Admin authentication is secure.
Blog management works.
Service content can be managed.
Contact form works.
Admin enquiry emails work.
Visitor confirmation emails work.
Consultation CTAs lead to the contact journey.
WhatsApp click-to-chat works.
Direct email works.
Direct phone actions work.
Technical SEO setup is complete.
Google Analytics is configured.
Google Search Console is configured.
Required Schema.org markup is implemented.
Cross-browser testing is complete.
Production domains are connected.
SSL is active.
The Vercel application deployment is complete.
CMS usage documentation is provided.
Product Vision

The finished website should leave visitors with one clear impression:

"This is an experienced solicitor I can trust, and I can speak directly with him about my case."

The website should use technology to make John's practice easier to discover and contact, while keeping the experience fundamentally personal, professional, and human.
