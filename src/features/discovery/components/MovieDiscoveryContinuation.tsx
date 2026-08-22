import './MovieDiscoveryContinuation.css'

type MovieDiscoveryContinuationProps = {
  errorMessage: string | null
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isNextPageError: boolean
  loadedCount: number
  loadedPageCount: number
  onContinue: () => void
  totalResults: number
}

export function MovieDiscoveryContinuation({
  errorMessage,
  hasNextPage,
  isFetchingNextPage,
  isNextPageError,
  loadedCount,
  loadedPageCount,
  onContinue,
  totalResults,
}: MovieDiscoveryContinuationProps) {
  const nextPageNumber = loadedPageCount + 1

  const statusMessage = isFetchingNextPage
    ? `Loading result page ${nextPageNumber}.`
    : `${loadedCount.toLocaleString()} of ${totalResults.toLocaleString()} movies loaded.`

  return (
    <section
      className="movie-continuation"
      aria-labelledby="movie-continuation-title"
    >
      <div className="movie-continuation__copy">
        <p className="archive-label">
          More results
        </p>

        <h3
          className="movie-continuation__title font-display"
          id="movie-continuation-title"
        >
          Continue browsing.
        </h3>

        <p
          className="movie-continuation__status"
          aria-live="polite"
          role="status"
        >
          {statusMessage}
        </p>
      </div>

      <div className="movie-continuation__action">
        {isNextPageError ? (
          <div
            className="movie-continuation__error"
            role="alert"
          >
            <p>
              More movies could not load. Your current results remain available.
            </p>

            {errorMessage ? (
              <p>{errorMessage}</p>
            ) : null}
          </div>
        ) : null}

        {hasNextPage ? (
          <button
            type="button"
            aria-busy={isFetchingNextPage}
            disabled={isFetchingNextPage}
            onClick={onContinue}
          >
            {isFetchingNextPage
              ? 'Loading more movies'
              : isNextPageError
                ? 'Retry loading more'
                : 'Load more movies'}

            <span aria-hidden="true">
              {isFetchingNextPage ? '...' : '>'}
            </span>
          </button>
        ) : (
          <p className="movie-continuation__complete">
            All available movies are loaded.
          </p>
        )}
      </div>
    </section>
  )
}
