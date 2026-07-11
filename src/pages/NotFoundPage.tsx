import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="grid min-h-[60vh] place-items-center text-center">
      <div className="max-w-xl">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--color-app-primary)]">
          Error 404
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          This page left the theatre.
        </h1>

        <p className="mt-5 leading-7 text-[var(--color-app-muted)]">
          The page may have moved, or the address may not be correct.
        </p>

        <Link
          className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--color-app-primary)] px-6 font-semibold text-white transition hover:bg-[var(--color-app-primary-strong)]"
          to="/"
        >
          <ArrowLeft aria-hidden="true" size={19} />
          Return home
        </Link>
      </div>
    </section>
  )
}
