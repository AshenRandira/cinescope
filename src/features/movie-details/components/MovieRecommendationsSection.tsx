import { Link } from 'react-router'

import {
  getTmdbImageSrcSet,
  getTmdbPosterUrl,
} from '../../../lib/tmdb/image'

import type {
  TmdbMovie,
  TmdbMovieDetails,
} from '../../../types/tmdb'

import './MovieRecommendationsSection.css'

type MovieRecommendationsSectionProps = {
  movie: TmdbMovieDetails
}

function getRecommendationRecords(
  movie: TmdbMovieDetails,
): TmdbMovie[] {
  const recordedIds = new Set<number>()
  const recommendations: TmdbMovie[] = []

  for (
    const recommendation of
    movie.recommendations.results
  ) {
    if (
      recommendation.id === movie.id ||
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

function getReleaseYear(
  releaseDate: string,
): string {
  const year = releaseDate.slice(0, 4)

  return /^\d{4}$/.test(year)
    ? year
    : 'Undated'
}

function getScoreLabel(
  voteAverage: number,
  voteCount: number,
): string {
  if (voteCount <= 0) {
    return 'Not rated'
  }

  return `${voteAverage.toFixed(1)} / 10`
}

export function MovieRecommendationsSection({
  movie,
}: MovieRecommendationsSectionProps) {
  const recommendations =
    getRecommendationRecords(movie)

  return (
    <section
      className="movie-recommendations"
      aria-labelledby="movie-recommendations-heading"
    >
      <header className="movie-recommendations__heading">
        <div>
          <p className="archive-label">
            06 / Adjacent records
          </p>

          <h2
            className="movie-recommendations__title font-display text-balance"
            id="movie-recommendations-heading"
          >
            Continue through related catalogue signals.
          </h2>
        </div>

        <p className="movie-recommendations__copy text-pretty">
          Related records supplied by TMDB. These titles
          are not personalized and do not represent a
          CineScope quality ranking.
        </p>
      </header>

      {recommendations.length > 0 ? (
        <ul className="movie-recommendations__grid">
          {recommendations.map(
            (recommendation, index) => {
              const posterUrl =
                getTmdbPosterUrl(
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
                    className="movie-recommendation-card"
                    to={`/movies/${recommendation.id}`}
                    aria-label={`Open movie record for ${recommendation.title}`}
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

                      <span className="movie-recommendation-card__number">
                        {String(index + 1).padStart(
                          2,
                          '0',
                        )}
                      </span>
                    </div>

                    <div className="movie-recommendation-card__caption">
                      <h3 className="font-display">
                        {recommendation.title}
                      </h3>

                      <p>
                        {getReleaseYear(
                          recommendation.release_date,
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
            No related records were returned.
          </h3>

          <Link to="/movies">
            Return to the movie register
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      )}
    </section>
  )
}