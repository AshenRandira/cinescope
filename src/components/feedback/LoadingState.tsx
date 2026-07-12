import { LoaderCircle } from 'lucide-react'

type LoadingStateProps = {
  message?: string
  title?: string
}

export function LoadingState({
  message = 'Please wait while the latest data is retrieved.',
  title = 'Loading',
}: LoadingStateProps) {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-8 text-center"
    >
      <LoaderCircle
        aria-hidden="true"
        className="size-9 animate-spin text-[var(--color-app-primary)] motion-reduce:animate-none"
      />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-app-text)]">
          {title}
        </h2>

        <p className="max-w-md text-sm leading-6 text-[var(--color-app-muted)]">
          {message}
        </p>
      </div>
    </section>
  )
}
