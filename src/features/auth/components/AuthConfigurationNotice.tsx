import { Link } from 'react-router'

export function AuthConfigurationNotice() {
  return (
    <section
      className="auth-configuration"
      aria-labelledby="auth-configuration-heading"
    >
      <p className="archive-label">
        Sign-in unavailable
      </p>
      <h2
        className="font-display"
        id="auth-configuration-heading"
      >
        Account access is temporarily unavailable.
      </h2>
      <p>
        You can still browse CineScope and keep a library on this device.
        Please try signing in again later.
      </p>
      <Link to="/discover">Continue to Discover</Link>
    </section>
  )
}
