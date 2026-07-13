import type {
  TmdbGenre,
} from '../../../types/tmdb'
import type {
  MovieDiscoveryFilters,
  MovieDiscoverySort,
  MovieMinimumScore,
  MovieReleasePeriod,
  MovieRuntimeRange,
} from '../data/movieDiscovery'
import {
  movieMinimumScoreOptions,
  movieReleasePeriodOptions,
  movieRuntimeOptions,
  movieSortOptions,
} from '../data/movieDiscoveryUrl'
import './MovieDiscoveryControls.css'

type MovieDiscoveryControlsProps = {
  filters: MovieDiscoveryFilters
  genreErrorMessage: string | null
  genreItems: TmdbGenre[]
  isDefault: boolean
  isGenreEmpty: boolean
  isGenreError: boolean
  isGenrePending: boolean
  methodLabel: string
  onGenreChange: (genreId: number | null) => void
  onMinimumScoreChange: (
    minimumScore: MovieMinimumScore,
  ) => void
  onReleasePeriodChange: (
    releasePeriod: MovieReleasePeriod,
  ) => void
  onReset: () => void
  onRetryGenres: () => void
  onRuntimeChange: (
    runtime: MovieRuntimeRange,
  ) => void
  onSortChange: (
    sort: MovieDiscoverySort,
  ) => void
}

export function MovieDiscoveryControls({
  filters,
  genreErrorMessage,
  genreItems,
  isDefault,
  isGenreEmpty,
  isGenreError,
  isGenrePending,
  methodLabel,
  onGenreChange,
  onMinimumScoreChange,
  onReleasePeriodChange,
  onReset,
  onRetryGenres,
  onRuntimeChange,
  onSortChange,
}: MovieDiscoveryControlsProps) {
  return (
    <section
      className="movie-parameters"
      aria-labelledby="movie-parameters-title"
    >
      <header className="movie-parameters__heading">
        <div>
          <p className="archive-label">
            Projection parameters
          </p>

          <h2
            className="movie-parameters__title font-display"
            id="movie-parameters-title"
          >
            Shape the register.
          </h2>
        </div>

        <p className="movie-parameters__introduction">
          Adjust concrete catalogue properties.
          CineScope does not infer personal taste or
          describe these results as recommendations.
        </p>
      </header>

      <fieldset className="movie-parameters__genres">
        <legend>Genre aperture</legend>

        <div className="movie-parameters__genre-index">
          <button
            type="button"
            aria-pressed={filters.genreId === null}
            onClick={() => onGenreChange(null)}
          >
            All genres
          </button>

          {genreItems.map((genre) => (
            <button
              type="button"
              aria-pressed={
                filters.genreId === genre.id
              }
              key={genre.id}
              onClick={() =>
                onGenreChange(genre.id)
              }
            >
              {genre.name}
            </button>
          ))}
        </div>

        {isGenrePending ? (
          <p
            className="movie-parameters__genre-status"
            role="status"
          >
            Loading the TMDB movie genre index.
          </p>
        ) : null}

        {isGenreError ? (
          <div
            className="movie-parameters__genre-error"
            role="status"
          >
            <p>
              {genreErrorMessage ??
                'The genre index is temporarily unavailable.'}
            </p>

            <button
              type="button"
              onClick={onRetryGenres}
            >
              Retry genre index
            </button>
          </div>
        ) : null}

        {isGenreEmpty ? (
          <p className="movie-parameters__genre-status">
            TMDB returned an empty movie genre
            index.
          </p>
        ) : null}
      </fieldset>

      <div className="movie-parameters__controls">
        <label>
          <span>Order</span>

          <select
            value={filters.sort}
            onChange={(event) =>
              onSortChange(
                event.target
                  .value as MovieDiscoverySort,
              )
            }
          >
            {movieSortOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Release period</span>

          <select
            value={filters.releasePeriod}
            onChange={(event) =>
              onReleasePeriodChange(
                event.target
                  .value as MovieReleasePeriod,
              )
            }
          >
            {movieReleasePeriodOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>Runtime</span>

          <select
            value={filters.runtime}
            onChange={(event) =>
              onRuntimeChange(
                event.target
                  .value as MovieRuntimeRange,
              )
            }
          >
            {movieRuntimeOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Minimum score</span>

          <select
            value={filters.minimumScore}
            onChange={(event) =>
              onMinimumScoreChange(
                event.target
                  .value as MovieMinimumScore,
              )
            }
          >
            {movieMinimumScoreOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <div className="movie-parameters__method">
        <div>
          <p className="archive-label">
            Active method
          </p>

          <p
            className="movie-parameters__method-copy"
            aria-live="polite"
          >
            {methodLabel}
          </p>
        </div>

        <button
          type="button"
          disabled={isDefault}
          onClick={onReset}
        >
          Reset parameters
        </button>
      </div>
    </section>
  )
}
