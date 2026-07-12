import { Inbox } from 'lucide-react'

type EmptyStateProps = {
  actionLabel?: string
  message: string
  onAction?: () => void
  title?: string
}

export function EmptyState({
  actionLabel,
  message,
  onAction,
  title = 'Nothing to show',
}: EmptyStateProps) {
  const hasAction = Boolean(actionLabel && onAction)

  return (
    <section className="flex min-h-64 flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-[var(--color-app-border)] bg-[var(--color-app-surface)] p-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-[var(--color-app-primary-soft)] text-[var(--color-app-primary)]">
        <Inbox aria-hidden="true" className="size-6" />
      </span>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-[var(--color-app-text)]">
          {title}
        </h2>

        <p className="max-w-lg text-sm leading-6 text-[var(--color-app-muted)]">
          {message}
        </p>
      </div>

      {hasAction ? (
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-elevated)] px-5 py-2.5 text-sm font-semibold text-[var(--color-app-text)] transition hover:border-[var(--color-app-primary)]"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  )
}
