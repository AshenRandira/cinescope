import {
  ArrowRight,
  Search,
  X,
} from 'lucide-react'
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSearchParams } from 'react-router'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/feedback'

import { SearchResultCard } from '../components/SearchResultCard'

import {
  countSearchRecords,
  filterSearchRecords,
  normalizeSearchQuery,
  parseSearchScope,
  SEARCH_MINIMUM_LENGTH,
  searchScopeOptions,
  type SearchScope,
} from '../data/search'

import { useCineScopeSearch } from '../hooks/useCineScopeSearch'

import './SearchPage.css'

const SEARCH_SUGGESTIONS = [
  'Dune',
  'Alien',
  'Batman',
  'Studio Ghibli',
] as const

function getSearchParams(
  query: string,
  scope: SearchScope,
): URLSearchParams {
  const searchParams = new URLSearchParams()

  if (query) {
    searchParams.set('q', query)
  }

  if (scope !== 'all') {
    searchParams.set('type', scope)
  }

  return searchParams
}

export function SearchPage() {
  const [searchParams, setSearchParams] =
    useSearchParams()

  const inputRef =
    useRef<HTMLInputElement>(null)

  const parsedQuery = normalizeSearchQuery(
    searchParams.get('q') ?? '',
  )

  const query =
    parsedQuery.length >= SEARCH_MINIMUM_LENGTH
      ? parsedQuery
      : ''

  const scope = parseSearchScope(
    searchParams.get('type'),
  )

  const [draftQuery, setDraftQuery] =
    useState(parsedQuery)

  const [
    validationMessage,
    setValidationMessage,
  ] = useState<string | null>(null)

  const search = useCineScopeSearch(query)

  const filteredRecords = useMemo(
    () =>
      filterSearchRecords(
        search.records,
        scope,
      ),
    [scope, search.records],
  )

  const scopeCounts = useMemo(
    () => countSearchRecords(search.records),
    [search.records],
  )

  useEffect(() => {
    setDraftQuery(parsedQuery)
    setValidationMessage(null)
  }, [parsedQuery])

  useEffect(() => {
    document.title = query
      ? `Search: ${query} — CineScope`
      : 'Search — CineScope'
  }, [query])

  function commitSearch(
    value: string,
  ): void {
    const normalizedQuery =
      normalizeSearchQuery(value)

    if (!normalizedQuery) {
      setSearchParams(new URLSearchParams())
      setValidationMessage(null)
      return
    }

    if (
      normalizedQuery.length <
      SEARCH_MINIMUM_LENGTH
    ) {
      setValidationMessage(
        `Enter at least ${SEARCH_MINIMUM_LENGTH} characters to search the archive.`,
      )
      inputRef.current?.focus()
      return
    }

    setDraftQuery(normalizedQuery)
    setValidationMessage(null)
    setSearchParams(
      getSearchParams(normalizedQuery, 'all'),
    )
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault()
    commitSearch(draftQuery)
  }

  function handleSuggestion(
    suggestion: string,
  ): void {
    commitSearch(suggestion)
  }

  function handleScopeChange(
    nextScope: SearchScope,
  ): void {
    setSearchParams(
      getSearchParams(query, nextScope),
    )
  }

  function handleClear(): void {
    setDraftQuery('')
    setValidationMessage(null)
    setSearchParams(new URLSearchParams())
    inputRef.current?.focus()
  }

  let resultsContent

  if (search.isPending) {
    resultsContent = (
      <LoadingState
        title="Scanning the living archive"
        message={`Searching TMDB for records matching “${query}”.`}
      />
    )
  } else if (search.isInitialError) {
    resultsContent = (
      <ErrorState
        title="The archive search was interrupted"
        message={
          search.errorMessage ??
          'The requested records could not be retrieved.'
        }
        onRetry={search.retry}
        retryLabel="Search again"
      />
    )
  } else if (
    search.records.length === 0
  ) {
    resultsContent = (
      <EmptyState
        title="No matching records were found"
        message={`TMDB returned no movies, television series, or people for “${query}”. Try another title or name.`}
        actionLabel="Clear search"
        onAction={handleClear}
      />
    )
  } else if (
    filteredRecords.length === 0
  ) {
    resultsContent = (
      <EmptyState
        title="No loaded records match this filter"
        message="Other media types were found. Return to all records or load another result page."
        actionLabel="Show all records"
        onAction={() =>
          handleScopeChange('all')
        }
      />
    )
  } else {
    resultsContent = (
      <ul className="search-results__grid">
        {filteredRecords.map(
          (record, index) => (
            <SearchResultCard
              index={index}
              key={`${record.mediaType}:${record.id}`}
              record={record}
            />
          ),
        )}
      </ul>
    )
  }

  return (
    <div className="search-page">
      <header className="search-opening">
        <div>
          <p className="archive-label">
            07 / Archive Search
          </p>

          <h1 className="search-opening__title font-display text-balance">
            Find the record you remember.
          </h1>
        </div>

        <div className="search-opening__copy">
          <p className="text-pretty">
            Search across films, television series,
            and people preserved in the TMDB
            catalogue.
          </p>

          <p>
            Results reflect catalogue matches, not
            personalised recommendations.
          </p>
        </div>
      </header>

      <section
        className="search-console"
        aria-labelledby="search-console-title"
      >
        <div className="search-console__heading">
          <div>
            <p className="archive-label">
              Search coordinates
            </p>

            <h2
              className="search-console__title font-display"
              id="search-console-title"
            >
              Name the signal.
            </h2>
          </div>

          <p>
            Use a title, series name, performer, or
            filmmaker. Submit when the query is ready.
          </p>
        </div>

        <form
          className="search-form"
          noValidate
          onSubmit={handleSubmit}
        >
          <label htmlFor="archive-search-query">
            Archive query
          </label>

          <div className="search-form__control">
            <Search aria-hidden="true" />

            <input
              aria-describedby={
                validationMessage
                  ? 'archive-search-query-error'
                  : undefined
              }
              aria-invalid={Boolean(
                validationMessage,
              )}
              autoComplete="off"
              id="archive-search-query"
              maxLength={100}
              onChange={(event) => {
                setDraftQuery(event.target.value)
                setValidationMessage(null)
              }}
              placeholder="Search movies, series, and people"
              ref={inputRef}
              spellCheck="false"
              type="search"
              value={draftQuery}
            />

            {draftQuery ? (
              <button
                aria-label="Clear archive query"
                className="search-form__clear"
                onClick={handleClear}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            ) : null}

            <button
              className="search-form__submit"
              type="submit"
            >
              Search archive
              <ArrowRight aria-hidden="true" />
            </button>
          </div>

          <p
            className="search-form__validation"
            id="archive-search-query-error"
            aria-live="polite"
          >
            {validationMessage ?? ''}
          </p>
        </form>

        <div className="search-suggestions">
          <p>Suggested signals</p>

          <div>
            {SEARCH_SUGGESTIONS.map(
              (suggestion) => (
                <button
                  key={suggestion}
                  onClick={() =>
                    handleSuggestion(suggestion)
                  }
                  type="button"
                >
                  {suggestion}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      {query ? (
        <section
          className="search-results"
          aria-labelledby="search-results-title"
        >
          <header className="search-results__heading">
            <div>
              <p className="archive-label">
                Search projection
              </p>

              <h2
                className="search-results__title font-display"
                id="search-results-title"
              >
                Results for “{query}”
              </h2>
            </div>

            <p aria-live="polite">
              <strong>
                {search.records.length.toLocaleString()}
              </strong>{' '}
              unique records loaded from{' '}
              <strong>
                {search.totalResults.toLocaleString()}
              </strong>{' '}
              reported matches.
            </p>
          </header>

          <div
            className="search-scope"
            aria-label="Filter loaded search results"
            role="group"
          >
            {searchScopeOptions.map((option) => (
              <button
                aria-pressed={
                  scope === option.value
                }
                key={option.value}
                onClick={() =>
                  handleScopeChange(option.value)
                }
                type="button"
              >
                <span>{option.label}</span>
                <strong>
                  {scopeCounts[option.value]}
                </strong>
              </button>
            ))}
          </div>

          <div className="search-results__content">
            {resultsContent}
          </div>

          {search.records.length > 0 ? (
            <section
              className="search-continuation"
              aria-labelledby="search-continuation-title"
            >
              <div>
                <p className="archive-label">
                  Search continuation
                </p>

                <h3
                  className="search-continuation__title font-display"
                  id="search-continuation-title"
                >
                  Extend the signal.
                </h3>

                <p aria-live="polite">
                  {search.isFetchingNextPage
                    ? `Retrieving search page ${search.loadedPageCount + 1}.`
                    : `${search.records.length.toLocaleString()} records are currently projected.`}
                </p>
              </div>

              <div className="search-continuation__action">
                {search.isNextPageError ? (
                  <div role="alert">
                    <p>
                      The next search page could not
                      be retrieved. Existing results
                      remain available.
                    </p>

                    {search.errorMessage ? (
                      <p>{search.errorMessage}</p>
                    ) : null}
                  </div>
                ) : null}

                {search.hasNextPage ? (
                  <button
                    aria-busy={
                      search.isFetchingNextPage
                    }
                    disabled={
                      search.isFetchingNextPage
                    }
                    onClick={search.loadNextPage}
                    type="button"
                  >
                    {search.isFetchingNextPage
                      ? 'Extending signal'
                      : search.isNextPageError
                        ? 'Retry next page'
                        : 'Load more records'}

                    <ArrowRight aria-hidden="true" />
                  </button>
                ) : (
                  <p className="search-continuation__complete">
                    The available result pages have
                    been fully projected.
                  </p>
                )}
              </div>
            </section>
          ) : null}
        </section>
      ) : (
        <section
          className="search-idle"
          aria-labelledby="search-idle-title"
        >
          <p className="archive-label">
            Awaiting query
          </p>

          <h2
            className="search-idle__title font-display"
            id="search-idle-title"
          >
            The archive is listening.
          </h2>

          <p>
            Submit at least two characters to begin a
            live TMDB search.
          </p>
        </section>
      )}
    </div>
  )
}
