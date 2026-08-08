import { Check, Clock3 } from 'lucide-react'
import { useId } from 'react'

type RoutePlaceholderProps = {
  description: string
  eyebrow: string
  release: 'Release 1' | 'Release 2'
  title: string
}

export function RoutePlaceholder({
  description,
  eyebrow,
  release,
  title,
}: RoutePlaceholderProps) {
  const headingId = useId()
  const archiveNumber = release === 'Release 1' ? '01' : '02'

  return (
    <section
      aria-labelledby={headingId}
      className="relative mx-auto flex min-h-[calc(100svh-var(--layout-header-height)-11rem)] max-w-[var(--layout-max)] flex-col justify-center overflow-hidden py-10 lg:py-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-0.04em] top-1/2 -z-10 -translate-y-1/2 font-display text-[clamp(12rem,32vw,34rem)] leading-none text-[var(--color-paper-100)] opacity-[0.018]"
      >
        {archiveNumber}
      </div>

      <div className="border-y border-[var(--color-line)]">
        <div className="grid lg:grid-cols-[minmax(10rem,0.28fr)_minmax(0,1fr)]">
          <aside className="flex flex-row justify-between gap-8 border-b border-[var(--color-line)] py-6 lg:min-h-[28rem] lg:flex-col lg:border-b-0 lg:border-r lg:py-10 lg:pr-10">
            <div>
              <p className="archive-label">Archive frame</p>

              <p className="mt-3 font-display text-5xl italic text-[var(--color-projector)] lg:text-7xl">
                {archiveNumber}
              </p>
            </div>

            <div className="self-end lg:self-start">
              <p className="font-mono text-[var(--font-size-label)] uppercase tracking-[0.14em] text-[var(--color-paper-600)]">
                Status / Configured
              </p>

              <p className="mt-2 font-mono text-[var(--font-size-label)] uppercase tracking-[0.14em] text-[var(--color-paper-600)]">
                Target / {release}
              </p>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col justify-center py-12 lg:px-[clamp(3rem,7vw,8rem)] lg:py-20">
            <p className="archive-label text-[var(--color-projector)]">
              {eyebrow}
            </p>

            <h1
              className="font-display mt-6 max-w-5xl text-[clamp(3.75rem,8vw,8.75rem)] leading-[0.84] text-[var(--color-paper-100)]"
              id={headingId}
            >
              {title}
            </h1>

            <p className="mt-8 max-w-2xl text-pretty text-base leading-8 text-[var(--color-paper-400)] md:text-lg">
              {description}
            </p>
          </div>
        </div>

        <div className="grid gap-px border-t border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2">
          <div className="flex items-center gap-4 bg-[var(--color-app-background)] px-5 py-4">
            <span className="grid size-8 place-items-center border border-[var(--color-line-strong)] text-[var(--color-success)]">
              <Check aria-hidden="true" className="size-4" />
            </span>

            <div>
              <p className="archive-label">Technical state</p>
              <p className="mt-1 text-sm text-[var(--color-paper-200)]">
                Route configured and accessible
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[var(--color-app-background)] px-5 py-4">
            <span className="grid size-8 place-items-center border border-[var(--color-line-strong)] text-[var(--color-projector)]">
              <Clock3 aria-hidden="true" className="size-4" />
            </span>

            <div>
              <p className="archive-label">Production schedule</p>
              <p className="mt-1 text-sm text-[var(--color-paper-200)]">
                Planned for {release}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}