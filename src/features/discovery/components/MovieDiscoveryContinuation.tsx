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
    ? `Retrieving catalogue page ${nextPageNumber}.`
    : `${loadedCount.toLocaleString()} of ${totalResults.toLocaleString()} reported matches are currently projected.`

  return (
    <section
      className="movie-continuation"
      aria-labelledby="movie-continuation-title"
    >
      <div className="movie-continuation__copy">
        <p className="archive-label">
          Catalogue continuation
        </p>

        <h3
          className="movie-continuation__title font-display"
          id="movie-continuation-title"
        >
          Continue the reel.
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
              The next catalogue page could not be
              retrieved. Previously loaded films
              remain available.
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
              ? 'Preparing next reel'
              : isNextPageError
                ? 'Retry next reel'
                : 'Continue the reel'}

            <span aria-hidden="true">
              {isFetchingNextPage ? '...' : '>'}
            </span>
          </button>
        ) : (
          <p className="movie-continuation__complete">
            No additional catalogue pages are
            available for this discovery method.
          </p>
        )}
      </div>
    </section>
  )
}
