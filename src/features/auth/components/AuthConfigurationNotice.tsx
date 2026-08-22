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
        Connect Firebase.
      </h2>
      <p>
        Sign-in is unavailable because Firebase is not fully configured.
        Add these values to <code>.env.local</code>, enable Email/Password
        in Firebase, then restart Vite.
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
