import { ExternalLink } from 'lucide-react'

import {
  missingFirebaseEnvironmentNames,
} from '../../../config/firebase'

export function AuthConfigurationNotice() {
  return (
    <section
      className="auth-configuration"
      aria-labelledby="auth-configuration-heading"
    >
      <p className="archive-label">
        Configuration required
      </p>
      <h2
        className="font-display"
        id="auth-configuration-heading"
      >
        Connect the Firebase projection.
      </h2>
      <p>
        Authentication is intentionally paused because this
        environment does not contain a complete Firebase web
        configuration. Add the following values to{' '}
        <code>.env.local</code>, enable Email/Password in the
        Firebase console, and restart Vite.
      </p>

      <ul>
        {missingFirebaseEnvironmentNames.map((name) => (
          <li key={name}>
            <code>{name}</code>
          </li>
        ))}
      </ul>

      <a
        href="https://firebase.google.com/docs/auth/web/start"
        rel="noreferrer"
        target="_blank"
      >
        Open Firebase setup guide
        <ExternalLink aria-hidden="true" />
      </a>
    </section>
  )
}
