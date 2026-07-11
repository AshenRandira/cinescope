import { CheckCircle2, Sparkles } from 'lucide-react'
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

  return (
    <section aria-labelledby={headingId}>
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[var(--color-app-surface)] px-6 py-14 shadow-2xl sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-violet-600/20 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-36 left-1/4 -z-10 size-80 rounded-full bg-blue-600/10 blur-3xl"
        />

        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200">
            <Sparkles aria-hidden="true" size={16} />
            {eyebrow}
          </div>

          <h1
            className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
            id={headingId}
          >
            {title}
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-[var(--color-app-muted)] sm:text-lg">
            {description}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-[var(--color-app-muted)]">
              <CheckCircle2
                aria-hidden="true"
                className="text-emerald-400"
                size={17}
              />
              Route configured
            </div>

            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-[var(--color-app-muted)]">
              Planned for {release}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
