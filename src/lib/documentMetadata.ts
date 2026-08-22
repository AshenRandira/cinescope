export type RouteMetadata = {
  description: string
  indexable: boolean
}

const DEFAULT_DESCRIPTION =
  'CineScope is a cinematic archive for discovering, tracking, and organizing movies and television series.'

export function getRouteMetadata(
  pathname: string,
): RouteMetadata {
  if (pathname === '/') {
    return {
      description:
        'Discover films, television, and contributors through CineScope, then keep a private local or synchronized living archive.',
      indexable: true,
    }
  }

  if (pathname === '/movies' || pathname.startsWith('/movies/')) {
    return {
      description:
        'Explore movie records, credits, trailers, availability, recommendations, and personal archive controls in CineScope.',
      indexable: true,
    }
  }

  if (pathname === '/tv' || pathname.startsWith('/tv/')) {
    return {
      description:
        'Explore television series, seasons, episodes, progress, credits, and recommendations in CineScope.',
      indexable: true,
    }
  }

  if (pathname.startsWith('/people/')) {
    return {
      description:
        'Explore a contributor record and their movie and television credits in the CineScope living archive.',
      indexable: true,
    }
  }

  if (pathname === '/discover') {
    return {
      description:
        'Explore transparent trending, temporal, genre, and archive-informed discovery signals in CineScope.',
      indexable: true,
    }
  }

  if (pathname === '/credits') {
    return {
      description:
        'Review CineScope data sources, TMDB attribution, and third-party media credits.',
      indexable: true,
    }
  }

  if (pathname === '/privacy') {
    return {
      description:
        'Understand what CineScope stores locally and in Firebase, how catalogue requests work, and how to export or delete account data.',
      indexable: true,
    }
  }

  if (pathname === '/terms') {
    return {
      description:
        'Review the conditions and limitations that apply when using CineScope.',
      indexable: true,
    }
  }

  if (pathname === '/accessibility') {
    return {
      description:
        'Review CineScope accessibility support, current conformance target, testing coverage, and known limitations.',
      indexable: true,
    }
  }

  return {
    description: DEFAULT_DESCRIPTION,
    indexable: false,
  }
}
