import { Link } from 'react-router'

import {
  getTmdbImageSrcSet,
  getTmdbPosterUrl,
} from '../../../lib/tmdb/image'

import type {
  TmdbTvDetails,
  TmdbTvShow,
} from '../../../types/tmdb'

import '../../movie-details/components/MovieRecommendationsSection.css'

function getRecommendationRecords(
  show: TmdbTvDetails,
): TmdbTvShow[] {
  const recordedIds = new Set<number>()
  const recommendations: TmdbTvShow[] = []

  for (
    const recommendation of
    show.recommendations.results
  ) {
    if (
      recommendation.id === show.id ||
      recommendation.adult ||
      recordedIds.has(recommendation.id)
    ) {
      continue
    }

    recordedIds.add(recommendation.id)
    recommendations.push(recommendation)

    if (recommendations.length === 8) {
      break
    }
  }

  return recommendations
}

function getFirstAirYear(
  firstAirDate: string,
): string {
  const year = firstAirDate.slice(0, 4)

  return /^\d{4}$/.test(year)
    ? year
    : 'Undated'
}

function getScoreLabel(
  voteAverage: number,
  voteCount: number,
): string {
  return voteCount <= 0
    ? 'Not rated'
    : `${voteAverage.toFixed(1)} / 10`
}

export function TvRecommendationsSection({
  show,
}: {
  show: TmdbTvDetails
}) {
  const recommendations =
    getRecommendationRecords(show)

  return (
    <section
      className="movie-recommendations"
      aria-labelledby="tv-recommendations-heading"
    >
      <header className="movie-recommendations__heading">
        <div>
          <p className="archive-label">
            Related series
          </p>

          <h2
            className="movie-recommendations__title font-display text-balance"
            id="tv-recommendations-heading"
          >
            Explore related series.
          </h2>
        </div>

        <p className="movie-recommendations__copy text-pretty">
          Related series from TMDB. These suggestions are not personalized.
        </p>
      </header>

      {recommendations.length > 0 ? (
        <ul className="movie-recommendations__grid">
          {recommendations.map(
            (recommendation) => {
              const posterUrl = getTmdbPosterUrl(
                recommendation.poster_path,
                'w500',
              )
              const posterSrcSet =
                getTmdbImageSrcSet(
                  recommendation.poster_path,
                  ['w185', 'w342', 'w500'],
                )

              return (
                <li key={recommendation.id}>
                  <Link
                    aria-label={`View series details for ${recommendation.name}`}
                    className="movie-recommendation-card"
                    to={`/tv/${recommendation.id}`}
                  >
                    <div className="movie-recommendation-card__artwork">
                      {posterUrl ? (
                        <img
                          alt=""
                          decoding="async"
                          loading="lazy"
                          sizes="(max-width: 40rem) 44vw, (max-width: 64rem) 30vw, 18vw"
                          src={posterUrl}
                          srcSet={posterSrcSet}
                        />
                      ) : (
                        <div className="movie-recommendation-card__fallback">
                          <span>
                            Artwork unavailable
                          </span>
                        </div>
                      )}

                    </div>

                    <div className="movie-recommendation-card__caption">
                      <h3 className="font-display">
                        {recommendation.name}
                      </h3>

                      <p>
                        {getFirstAirYear(
                          recommendation.first_air_date,
                        )}
                        {' / '}
                        {recommendation.original_language.toUpperCase()}
                      </p>

                      <span>
                        {getScoreLabel(
                          recommendation.vote_average,
                          recommendation.vote_count,
                        )}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            },
          )}
        </ul>
      ) : (
        <div className="movie-recommendations__empty">
          <p>Catalogue boundary</p>

          <h3 className="font-display">
            No related series were returned.
          </h3>

          <Link to="/tv">
            Return to TV Shows
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      )}
    </section>
  )
}
