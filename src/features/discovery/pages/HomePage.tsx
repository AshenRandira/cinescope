import { useEffect } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/feedback'
import { getTmdbErrorMessage } from '../../../lib/tmdb/client'
import { ArchiveProjectionHero } from '../components/ArchiveProjectionHero'
import { DiscoverySplice } from '../components/DiscoverySplice'
import { HomepageClosingFrame } from '../components/HomepageClosingFrame'
import { TelevisionSignal } from '../components/TelevisionSignal'
import { TemporalCinemaMap } from '../components/TemporalCinemaMap'
import { useHomeDiscoveryQueries } from '../hooks/useHomeDiscoveryQueries'

export function HomePage() {
  const {
    discovery,
    featured,
    television,
    temporal,
  } = useHomeDiscoveryQueries()

  useEffect(() => {
    document.title = 'Discover your next story — CineScope'
  }, [])

  let openingScene

  if (featured.isPending) {
    openingScene = (
      <div className="mx-auto max-w-[var(--layout-max)] py-16">
        <LoadingState
          message="Preparing the opening projection from the CineScope archive."
          title="Opening CineScope"
        />
      </div>
    )
  } else if (featured.isError) {
    openingScene = (
      <div className="mx-auto max-w-[var(--layout-max)] py-16">
        <ErrorState
          message={getTmdbErrorMessage(featured.error)}
          onRetry={featured.refetch}
          title="The opening projection could not be loaded"
        />
      </div>
    )
  } else if (featured.isEmpty) {
    openingScene = (
      <div className="mx-auto max-w-[var(--layout-max)] py-16">
        <EmptyState
          actionLabel="Request another projection"
          message="TMDB responded successfully, but no suitable featured artwork was available."
          onAction={featured.refetch}
          title="No featured stories available"
        />
      </div>
    )
  } else {
    openingScene = (
      <ArchiveProjectionHero movies={featured.movies} />
    )
  }

  return (
    <>
      {featured.isPending || featured.isError || featured.isEmpty ? (
        <h1 className="sr-only">
          Discover your next story with CineScope
        </h1>
      ) : null}

      {openingScene}

      <DiscoverySplice
        cuts={discovery.cuts}
        errorMessage={getTmdbErrorMessage(discovery.error)}
        isEmpty={discovery.isEmpty}
        isError={discovery.isError}
        isPending={discovery.isPending}
        onRetry={discovery.refetch}
      />

      <TemporalCinemaMap
        errorMessage={getTmdbErrorMessage(temporal.error)}
        isEmpty={temporal.isEmpty}
        isError={temporal.isError}
        isPending={temporal.isPending}
        onRetry={temporal.refetch}
        stations={temporal.stations}
      />

      <TelevisionSignal
        errorMessage={getTmdbErrorMessage(television.error)}
        isEmpty={television.isEmpty}
        isError={television.isError}
        isPending={television.isPending}
        onRetry={television.refetch}
        signals={television.signals}
      />

      <HomepageClosingFrame />
    </>
  )
}
