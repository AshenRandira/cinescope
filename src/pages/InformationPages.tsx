import { ExternalLink } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router'

import './InformationPages.css'

type InformationPageProps = {
  children: React.ReactNode
  eyebrow: string
  introduction: string
  title: string
}

function InformationPage({
  children,
  eyebrow,
  introduction,
  title,
}: InformationPageProps) {
  return (
    <article className="information-page">
      <header className="information-page__hero">
        <p className="archive-label">{eyebrow}</p>
        <h1 className="information-page__title font-display">
          {title}
        </h1>
        <p className="information-page__introduction">
          {introduction}
        </p>
        <p className="information-page__updated">
          Last updated 22 August 2026
        </p>
      </header>

      <div className="information-page__body">{children}</div>

      <nav
        aria-label="CineScope information"
        className="information-page__related"
      >
        <Link to="/credits">Credits</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/accessibility">Accessibility</Link>
      </nav>
    </article>
  )
}

function InformationSection({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <section>
      <h2 className="font-display">{title}</h2>
      {children}
    </section>
  )
}

export function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy — CineScope'
  }, [])

  return (
    <InformationPage
      eyebrow="01 / Privacy and data"
      introduction="CineScope is designed around a private, local-first archive. This notice explains the data the application uses, where it is stored, and the controls available to you."
      title="Your archive remains yours."
    >
      <InformationSection title="What CineScope stores">
        <p>
          Guest library records, ratings, watch progress, discovery
          preferences, and recommendation feedback are stored in your
          browser. CineScope does not add advertising or analytics
          trackers.
        </p>
        <p>
          If you create an account, Firebase Authentication stores your
          email address, display name, account identifiers, and sign-in
          metadata. Your library, preferences, and bounded recommendation
          feedback can then synchronize to your user-scoped Firestore
          records.
        </p>
      </InformationSection>

      <InformationSection title="Catalogue requests">
        <p>
          Search terms and selected catalogue filters pass through the
          CineScope Firebase Function to The Movie Database (TMDB). The
          Function records route category, response status, latency,
          cache result, and a request reference for operations. It does
          not intentionally log raw search text, passwords, email
          addresses, library contents, Firebase tokens, or TMDB tokens.
        </p>
      </InformationSection>

      <InformationSection title="Retention and deletion">
        <p>
          Browser data remains until you clear it, remove individual
          records, or successfully delete your CineScope account. Cloud
          account data remains until you delete the account. Account
          deletion removes the Firebase Authentication user and the
          associated CineScope Firestore tree, then clears the
          user-scoped browser archive.
        </p>
        <p>
          Infrastructure providers may retain operational logs or
          backups under their own documented retention processes. Never
          post account data, passwords, or tokens in a public issue.
        </p>
      </InformationSection>

      <InformationSection title="Your controls">
        <ul>
          <li>Use CineScope without creating an account.</li>
          <li>Edit your display name and discovery preferences.</li>
          <li>Export a versioned JSON copy of your account data.</li>
          <li>Delete individual archive records or the full account.</li>
          <li>Clear browser storage through your browser settings.</li>
        </ul>
      </InformationSection>

      <InformationSection title="Questions">
        <p>
          Non-sensitive product questions may be filed in the{' '}
          <a
            href="https://github.com/AshenRandira/cinescope/issues"
            rel="noreferrer"
            target="_blank"
          >
            project issue tracker
            <ExternalLink aria-hidden="true" />
          </a>
          . A private privacy-contact channel must be published before a
          public production release.
        </p>
      </InformationSection>
    </InformationPage>
  )
}

export function TermsPage() {
  useEffect(() => {
    document.title = 'Terms — CineScope'
  }, [])

  return (
    <InformationPage
      eyebrow="02 / Conditions of use"
      introduction="These release-candidate terms describe the intended V1 service boundary. They require operator review before CineScope is released publicly."
      title="Use the archive with care."
    >
      <InformationSection title="The service">
        <p>
          CineScope provides movie and television discovery, personal
          tracking, and account synchronization. Features may change,
          pause, or be withdrawn while the project remains in preview.
        </p>
      </InformationSection>

      <InformationSection title="Accounts and acceptable use">
        <p>
          You are responsible for your account access and for the
          information you choose to save. Do not attempt to bypass
          authorization rules, interfere with the service, automate
          abusive catalogue traffic, extract credentials, or use the
          application in violation of applicable law or third-party
          rights.
        </p>
      </InformationSection>

      <InformationSection title="Third-party material">
        <p>
          Catalogue data and artwork come from TMDB. Videos, provider
          availability, external profiles, and destination links are
          supplied by third parties and may change without notice.
          CineScope does not guarantee their accuracy, availability, or
          suitability.
        </p>
      </InformationSection>

      <InformationSection title="No professional advice or warranty">
        <p>
          CineScope is an entertainment discovery tool. It is provided
          on an as-available basis for the release candidate, without a
          promise that every record, recommendation, synchronization, or
          external link will always be complete or uninterrupted.
        </p>
      </InformationSection>

      <InformationSection title="Release review">
        <p>
          The production operator must approve these terms, publish a
          private contact channel, and decide the repository licensing
          position before a public V1 release.
        </p>
      </InformationSection>
    </InformationPage>
  )
}

export function AccessibilityPage() {
  useEffect(() => {
    document.title = 'Accessibility — CineScope'
  }, [])

  return (
    <InformationPage
      eyebrow="03 / Accessibility"
      introduction="CineScope targets WCAG 2.2 Level AA where practical for V1 and treats readability, keyboard access, focus, motion, and responsive reflow as product requirements."
      title="Every record should remain reachable."
    >
      <InformationSection title="Current support">
        <ul>
          <li>Semantic landmarks and a keyboard skip link.</li>
          <li>Visible focus treatment and route focus transfer.</li>
          <li>Keyboard-operable search suggestions and dialogs.</li>
          <li>Polite loading announcements and safe error recovery.</li>
          <li>Reduced-motion, increased-contrast, and forced-colors rules.</li>
          <li>Readable supporting text and responsive mobile navigation.</li>
        </ul>
      </InformationSection>

      <InformationSection title="Conformance status">
        <p>
          The release candidate is partially conformant with the WCAG
          2.2 Level AA target. Automated accessibility lint, component
          tests, Chromium journeys, 320 CSS-pixel reflow checks, and
          touch-target checks pass. Formal assistive-technology and
          cross-browser review is still required before V1 approval.
        </p>
      </InformationSection>

      <InformationSection title="Known limitations">
        <p>
          NVDA, VoiceOver, Safari, Firefox, 200% and 400% zoom, and
          physical-device testing remain manual release checks. Some
          third-party video players and destination sites are outside
          CineScope's accessibility control.
        </p>
      </InformationSection>

      <InformationSection title="Feedback">
        <p>
          Report non-sensitive accessibility defects through the{' '}
          <a
            href="https://github.com/AshenRandira/cinescope/issues"
            rel="noreferrer"
            target="_blank"
          >
            project issue tracker
            <ExternalLink aria-hidden="true" />
          </a>{' '}
          and include the route, browser, assistive technology, and the
          expected result. Do not include account credentials or private
          archive data.
        </p>
      </InformationSection>
    </InformationPage>
  )
}

export function CreditsPage() {
  useEffect(() => {
    document.title = 'Credits and attribution — CineScope'
  }, [])

  return (
    <InformationPage
      eyebrow="04 / Credits and attribution"
      introduction="CineScope combines its Living Archive interface with catalogue records and media supplied by carefully bounded third-party services."
      title="Built with the archive in view."
    >
      <InformationSection title="The Movie Database">
        <a
          aria-label="Visit The Movie Database"
          className="information-page__tmdb-link"
          href="https://www.themoviedb.org"
          rel="noreferrer"
          target="_blank"
        >
          <img
            alt="The Movie Database (TMDB)"
            decoding="async"
            src="/branding/tmdb-logo.svg"
          />
          <ExternalLink aria-hidden="true" />
        </a>
        <p className="information-page__notice">
          This product uses the TMDB API but is not endorsed or certified
          by TMDB.
        </p>
        <p>
          TMDB supplies movie, television, contributor, rating, release,
          availability, and artwork information. CineScope's own mark
          remains the primary product identity.
        </p>
      </InformationSection>

      <InformationSection title="Media and interface">
        <p>
          Trailer destinations use YouTube links returned by TMDB.
          Provider availability and external social or contributor links
          are informational and open on their respective services.
          CineScope uses Manrope, Instrument Serif, and Lucide interface
          icons through their installed packages.
        </p>
      </InformationSection>

      <InformationSection title="Source accuracy">
        <p>
          Release dates, rankings, provider availability, biographies,
          credits, and popularity signals can change and may vary by
          territory. Follow the destination service for its current
          terms, privacy notice, and accessibility support.
        </p>
      </InformationSection>
    </InformationPage>
  )
}
