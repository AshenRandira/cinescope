type CineScopeWordmarkProps = {
  showDescriptor?: boolean
}

export function CineScopeWordmark({
  showDescriptor = false,
}: CineScopeWordmarkProps) {
  return (
    <span className="inline-flex items-center gap-3">
      <span
        aria-hidden="true"
        className="relative grid size-9 shrink-0 place-items-center overflow-hidden border border-[var(--color-line-strong)] bg-[var(--color-ink-800)] shadow-[var(--shadow-whisper)]"
      >
        <span className="absolute inset-y-1 left-1 w-px bg-[var(--color-line-strong)]" />
        <span className="absolute inset-y-1 right-1 w-px bg-[var(--color-line-strong)]" />

        <span className="absolute left-1 top-1 size-1 bg-[var(--color-projector)]" />
        <span className="absolute bottom-1 right-1 size-1 bg-[var(--color-projector)]" />

        <span className="size-3.5 rotate-45 border border-[var(--color-projector)]" />

        <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-projector)] opacity-70" />
      </span>

      <span className="flex min-w-0 flex-col">
        <span className="flex items-baseline whitespace-nowrap">
          <span className="text-[0.95rem] font-bold tracking-[-0.045em] text-[var(--color-paper-100)]">
            Cine
          </span>

          <span className="font-display text-[1.35rem] italic leading-none text-[var(--color-projector)]">
            Scope
          </span>
        </span>

        {showDescriptor ? (
          <span className="mt-0.5 text-[var(--font-size-micro)] font-semibold uppercase tracking-[0.24em] text-[var(--color-paper-600)]">
            The living archive
          </span>
        ) : null}
      </span>
    </span>
  )
}