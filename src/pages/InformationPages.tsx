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
      eyebrow="Privacy and data"
      introduction="See what CineScope stores, where it is kept, and how you can control it."
      title="Your archive remains yours."
    >
      <InformationSection title="What CineScope stores">
        <p>
          Without an account, your library, ratings, watch progress,
          preferences, and feedback stay in this browser. CineScope has
          no advertising or analytics trackers.
        </p>
        <p>
          With an account, our secure account service stores your email, display name,
          account ID, and sign-in details. Your library and preferences
          can then sync to your private account records.
        </p>
      </InformationSection>

      <InformationSection title="Catalogue requests">
        <p>
          Searches and filters pass through a secure CineScope service
          to TMDB.
        </p>
        <p>
          Operational logs record request type, status, timing, cache result,
          and a request ID. They do not intentionally record your search text,
          password, email, library, or access tokens.
        </p>
      </InformationSection>

      <InformationSection title="Retention and deletion">
        <p>
          Device data remains until you remove it, clear browser storage,
          or delete your account. Cloud data remains until account deletion.
          Deleting the account removes its sign-in and CineScope data,
          then clears this device.
        </p>
        <p>
          Service providers may retain logs or backups under their own
          policies. Never post account data, passwords, or tokens publicly.
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
          . A private privacy contact will be published before release.
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
      eyebrow="Conditions of use"
      introduction="These draft terms explain the planned V1 service. They require approval before public release."
      title="Use the archive with care."
    >
      <InformationSection title="The service">
        <p>
          CineScope provides movie and TV discovery, personal tracking,
          and account sync. Features may change while the app is in preview.
        </p>
      </InformationSection>

      <InformationSection title="Accounts and acceptable use">
        <p>
          You are responsible for your account and saved information.
          Do not bypass security, disrupt the service, create abusive
          traffic, extract credentials, or violate laws or third-party rights.
        </p>
      </InformationSection>

      <InformationSection title="Third-party material">
        <p>
          TMDB and other services provide catalogue data, artwork, videos,
          streaming availability, profiles, and links. This information may
          change. CineScope cannot guarantee its accuracy or availability.
        </p>
      </InformationSection>

      <InformationSection title="No professional advice or warranty">
        <p>
          CineScope is an entertainment discovery tool provided as available.
          Records, recommendations, sync, and external links may be incomplete
          or temporarily unavailable.
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
      eyebrow="Accessibility"
      introduction="CineScope aims for WCAG 2.2 Level AA, with readable text, keyboard access, clear focus, reduced motion, and responsive layouts."
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
          The release candidate is partially conformant with WCAG 2.2 AA.
          Automated accessibility, browser, reflow, and touch-target checks
          pass. Assistive-technology and cross-browser review is still needed.
        </p>
      </InformationSection>

      <InformationSection title="Known limitations">
        <p>
          Manual checks still include NVDA, VoiceOver, Safari, Firefox,
          high zoom, and physical devices. CineScope cannot control the
          accessibility of third-party players or websites.
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
          and include the page, browser, assistive technology, and expected
          result. Never include credentials or private library data.
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
      eyebrow="Credits and attribution"
      introduction="See which third-party services provide CineScope's catalogue, media, fonts, and icons."
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
          TMDB supplies movie, TV, contributor, rating, release,
          availability, and artwork information.
        </p>
      </InformationSection>

      <InformationSection title="Media and interface">
        <p>
          Trailers open on YouTube. Streaming, social, and contributor links
          open on their respective services. The interface uses Manrope,
          Instrument Serif, and Lucide icons.
        </p>
      </InformationSection>

      <InformationSection title="Source accuracy">
        <p>
          Dates, rankings, availability, biographies, credits, and popularity
          can change or vary by region. Check each service for current details,
          terms, privacy, and accessibility information.
        </p>
      </InformationSection>
    </InformationPage>
  )
}
