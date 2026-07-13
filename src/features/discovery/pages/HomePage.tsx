import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/feedback'
import { getTmdbErrorMessage } from '../../../lib/tmdb/client'
import { ArchiveProjectionHero } from '../components/ArchiveProjectionHero'
import { DiscoverySplice } from '../components/DiscoverySplice'
import { useHomeDiscoveryQueries } from '../hooks/useHomeDiscoveryQueries'

export function HomePage() {
  const {
    discovery,
    featured,
  } = useHomeDiscoveryQueries()

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
      {openingScene}

      <DiscoverySplice
        cuts={discovery.cuts}
        errorMessage={getTmdbErrorMessage(discovery.error)}
        isEmpty={discovery.isEmpty}
        isError={discovery.isError}
        isPending={discovery.isPending}
        onRetry={discovery.refetch}
      />
    </>
  )
}