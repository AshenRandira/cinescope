import { AlertTriangle, RefreshCw } from 'lucide-react'

type ErrorStateProps = {
  message: string
  onRetry?: () => void
  retryLabel?: string
  title?: string
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Try again',
  title = 'Something went wrong',
}: ErrorStateProps) {
  return (
    <section
      aria-live="assertive"
      className="flex min-h-64 flex-col items-center justify-center gap-5 rounded-3xl border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-8 text-center"
      role="alert"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-[color:rgba(251,113,133,0.12)] text-[var(--color-app-error)]">
        <AlertTriangle aria-hidden="true" className="size-6" />
      </span>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-app-text)]">
          {title}
        </h2>

        <p className="max-w-lg text-sm leading-6 text-[var(--color-app-muted)]">
          {message}
        </p>
      </div>

      {onRetry ? (
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-app-primary-strong)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          onClick={onRetry}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          {retryLabel}
        </button>
      ) : null}
    </section>
  )
}
