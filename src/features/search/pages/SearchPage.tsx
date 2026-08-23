import {
  ArrowRight,
  Search,
  Sparkles,
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
import {
  preferenceGenreDefinitions,
  preferredLanguageOptions,
  type PreferenceGenreId,
} from '../../preferences/data/preferences'
import {
  recommendationMoodDefinitions,
} from '../../recommendations/data/recommendationMoods'
import { SearchResultCard } from '../components/SearchResultCard'
import {
  createDefaultIntentCriteria,
  intentMediaOptions,
  parseIntentCriteria,
  parseNaturalLanguageIntent,
  serializeIntentSearch,
  supportsIntentMedia,
  type IntentSearchCriteria,
} from '../data/intentSearch'
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
import { useIntentSearch } from '../hooks/useIntentSearch'

import './SearchPage.css'

const SEARCH_SUGGESTIONS = [
  'Dune',
  'Studio Ghibli',
  'a funny family movie under two hours',
  'a reflective Korean drama from the 2010s',
] as const

const decadeOptions = Array.from(
  { length: 7 },
  (_, index) =>
    Math.floor(new Date().getFullYear() / 10) * 10 - index * 10,
)

const runtimeOptions = [90, 100, 120, 150, 180] as const

function getLookupParams(
  query: string,
  scope: SearchScope,
): URLSearchParams {
  const params = new URLSearchParams()

  if (query) params.set('q', query)
  if (scope !== 'all') params.set('type', scope)

  return params
}

function withScope(
  params: URLSearchParams,
  scope: SearchScope,
): URLSearchParams {
  if (scope === 'all') params.delete('type')
  else params.set('type', scope)

  return params
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const parsedQuery = normalizeSearchQuery(
    searchParams.get('q') ?? '',
  )
  const query =
    parsedQuery.length >= SEARCH_MINIMUM_LENGTH
      ? parsedQuery
      : ''
  const isIntentMode = searchParams.get('mode') === 'intent'
  const naturalIntent = useMemo(
    () => parseNaturalLanguageIntent(parsedQuery),
    [parsedQuery],
  )
  const criteria = useMemo(
    () =>
      parseIntentCriteria(
        searchParams,
        naturalIntent.criteria,
      ),
    [naturalIntent.criteria, searchParams],
  )
  const parsedScope = parseSearchScope(searchParams.get('type'))
  const scope =
    isIntentMode && parsedScope === 'person'
      ? 'all'
      : parsedScope
  const [draftQuery, setDraftQuery] = useState(parsedQuery)
  const [validationMessage, setValidationMessage] =
    useState<string | null>(null)

  const lookupSearch = useCineScopeSearch(
    query,
    !isIntentMode,
  )
  const intentSearch = useIntentSearch(
    criteria,
    isIntentMode && Boolean(query),
  )
  const activeSearch = isIntentMode
    ? intentSearch
    : lookupSearch
  const filteredRecords = useMemo(
    () => filterSearchRecords(activeSearch.records, scope),
    [activeSearch.records, scope],
  )
  const scopeCounts = useMemo(
    () => countSearchRecords(activeSearch.records),
    [activeSearch.records],
  )
  const movieIntentSupported = supportsIntentMedia(criteria, 'movie')
  const tvIntentSupported = supportsIntentMedia(criteria, 'tv')
  const supportedIntentMedia =
    movieIntentSupported || tvIntentSupported
  const limitedIntentMessage =
    criteria.media === 'both' &&
    movieIntentSupported !== tvIntentSupported
      ? movieIntentSupported
        ? 'These genres are available for movies only, so TV results are hidden.'
        : 'These genres are available for TV only, so movie results are hidden.'
      : null
  const visibleScopeOptions = isIntentMode
    ? searchScopeOptions.filter(({ value }) => value !== 'person')
    : searchScopeOptions

  useEffect(() => {
    setDraftQuery(parsedQuery)
    setValidationMessage(null)
  }, [parsedQuery])

  useEffect(() => {
    document.title = query
      ? `${isIntentMode ? 'Recommendations' : 'Search'}: ${query} — CineScope`
      : 'Search — CineScope'
  }, [isIntentMode, query])

  function commitSearch(
    value: string,
    mode: 'auto' | 'intent' | 'lookup' = 'auto',
  ): void {
    const normalized = normalizeSearchQuery(value)

    if (!normalized) {
      setSearchParams(new URLSearchParams())
      setValidationMessage(null)
      return
    }

    if (normalized.length < SEARCH_MINIMUM_LENGTH) {
      setValidationMessage(
        `Enter at least ${SEARCH_MINIMUM_LENGTH} characters to search the archive.`,
      )
      inputRef.current?.focus()
      return
    }

    const parsedIntent = parseNaturalLanguageIntent(normalized)
    const shouldUseIntent =
      mode === 'intent' ||
      (mode === 'auto' && parsedIntent.isIntent)

    setDraftQuery(normalized)
    setValidationMessage(null)
    setSearchParams(
      shouldUseIntent
        ? serializeIntentSearch(normalized, parsedIntent.criteria)
        : getLookupParams(normalized, 'all'),
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    commitSearch(draftQuery)
  }

  function handleScopeChange(nextScope: SearchScope): void {
    const params = isIntentMode
      ? serializeIntentSearch(query, criteria)
      : getLookupParams(query, nextScope)

    setSearchParams(
      isIntentMode
        ? withScope(params, nextScope)
        : params,
    )
  }

  function updateCriteria(
    changes: Partial<IntentSearchCriteria>,
  ): void {
    setSearchParams(
      withScope(
        serializeIntentSearch(query, {
          ...criteria,
          ...changes,
        }),
        scope,
      ),
    )
  }

  function toggleGenre(genre: PreferenceGenreId): void {
    const genres = criteria.genres.includes(genre)
      ? criteria.genres.filter((value) => value !== genre)
      : [...criteria.genres, genre].slice(0, 4)

    updateCriteria({ genres })
  }

  function handleFamilyFriendlyChange(checked: boolean): void {
    updateCriteria({
      familyFriendly: checked,
      genres: checked
        ? [
            'family' as PreferenceGenreId,
            ...criteria.genres.filter((genre) => genre !== 'family'),
          ].slice(0, 4)
        : criteria.genres.filter((genre) => genre !== 'family'),
    })
  }

  function handleClear(): void {
    setDraftQuery('')
    setValidationMessage(null)
    setSearchParams(new URLSearchParams())
    inputRef.current?.focus()
  }

  let resultsContent

  if (isIntentMode && !supportedIntentMedia) {
    resultsContent = (
      <EmptyState
        title="This genre is not available"
        message="Choose another media type or remove the genre."
        actionLabel="Reset filters"
        onAction={() =>
          updateCriteria(createDefaultIntentCriteria())
        }
      />
    )
  } else if (activeSearch.isPending) {
    resultsContent = (
      <LoadingState
        title={
          isIntentMode
            ? 'Finding recommendations'
            : 'Searching the catalogue'
        }
        message={
          isIntentMode
            ? 'Searching TMDB with the filters shown above.'
            : `Searching TMDB for records matching “${query}”.`
        }
      />
    )
  } else if (activeSearch.isInitialError) {
    resultsContent = (
      <ErrorState
        title="Search could not finish"
        message={
          activeSearch.errorMessage ??
          'The requested results could not be retrieved.'
        }
        onRetry={activeSearch.retry}
        retryLabel="Search again"
      />
    )
  } else if (activeSearch.records.length === 0) {
    resultsContent = (
      <EmptyState
        title="No matching records were found"
        message={
          isIntentMode
            ? 'No titles match these filters. Remove or broaden one filter and try again.'
            : `TMDB returned no movies, television series, or people for “${query}”. Try another title or name.`
        }
        actionLabel={isIntentMode ? 'Reset filters' : 'Clear search'}
        onAction={
          isIntentMode
            ? () => updateCriteria(createDefaultIntentCriteria())
            : handleClear
        }
      />
    )
  } else if (filteredRecords.length === 0) {
    resultsContent = (
      <EmptyState
        title="No loaded records match this filter"
        message="Results exist in another category. Show all results or load more."
        actionLabel="Show all records"
        onAction={() => handleScopeChange('all')}
      />
    )
  } else {
    resultsContent = (
      <ul className="search-results__grid">
        {filteredRecords.map((record) => (
          <SearchResultCard
            key={`${record.mediaType}:${record.id}`}
            record={record}
          />
        ))}
      </ul>
    )
  }

  return (
    <div className="search-page">
      <header className="search-opening">
        <div>
          <p className="archive-label">Search</p>
          <h1 className="search-opening__title font-display text-balance">
            Search or describe what you want.
          </h1>
        </div>

        <div className="search-opening__copy">
          <p className="text-pretty">
            Find a title or person, or describe your mood for recommendations.
          </p>
        </div>
      </header>

      <section className="search-console" aria-labelledby="search-console-title">
        <div className="search-console__heading">
          <div>
            <p className="archive-label">Search coordinates</p>
            <h2 className="search-console__title font-display" id="search-console-title">
              Search CineScope.
            </h2>
          </div>
        </div>

        <form className="search-form" noValidate onSubmit={handleSubmit}>
          <label htmlFor="archive-search-query">Title, name, or viewing request</label>
          <div className="search-form__control">
            <Search aria-hidden="true" />
            <input
              aria-describedby={validationMessage ? 'archive-search-query-error' : 'archive-search-query-help'}
              aria-invalid={Boolean(validationMessage)}
              autoComplete="off"
              id="archive-search-query"
              maxLength={100}
              onChange={(event) => {
                setDraftQuery(event.target.value)
                setValidationMessage(null)
              }}
              placeholder="Dune, Zendaya, or a cozy mystery series..."
              ref={inputRef}
              spellCheck="false"
              type="search"
              value={draftQuery}
            />
            {draftQuery ? (
              <button aria-label="Clear archive query" className="search-form__clear" onClick={handleClear} type="button">
                <X aria-hidden="true" />
              </button>
            ) : null}
            <button className="search-form__submit" type="submit">
              Search or recommend
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
          <p className="search-form__help" id="archive-search-query-help">
            CineScope automatically chooses title search or recommendations.
          </p>
          <p className="search-form__validation" id="archive-search-query-error" aria-live="polite">
            {validationMessage ?? ''}
          </p>
          {draftQuery.length >= SEARCH_MINIMUM_LENGTH ? (
            <div className="search-form__modes" aria-label="Choose search interpretation">
              <button onClick={() => commitSearch(draftQuery, 'lookup')} type="button">
                Search exact title or name
              </button>
              <button onClick={() => commitSearch(draftQuery, 'intent')} type="button">
                <Sparkles aria-hidden="true" />
                Treat as a viewing request
              </button>
            </div>
          ) : null}
        </form>

        <div className="search-suggestions">
          <p>Try an example</p>
          <div>
            {SEARCH_SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} onClick={() => commitSearch(suggestion)} type="button">
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      {query && isIntentMode ? (
        <section className="intent-interpretation" aria-labelledby="intent-interpretation-title">
          <header>
            <div>
              <p className="archive-label">Your request</p>
              <h2 className="intent-interpretation__title font-display" id="intent-interpretation-title">
                Review the filters.
              </h2>
            </div>
            <div>
              <p>
                Check what CineScope understood. Change any filter before viewing results.
              </p>
              <button onClick={() => commitSearch(query, 'lookup')} type="button">
                Search these words as a title or name
              </button>
            </div>
          </header>

          <div className="intent-controls">
            <label>
              <span>Medium</span>
              <select value={criteria.media} onChange={(event) => updateCriteria({ media: event.target.value as IntentSearchCriteria['media'] })}>
                {intentMediaOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Mood</span>
              <select value={criteria.mood} onChange={(event) => updateCriteria({ mood: event.target.value as IntentSearchCriteria['mood'] })}>
                {recommendationMoodDefinitions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Original language</span>
              <select value={criteria.language} onChange={(event) => updateCriteria({ language: event.target.value as IntentSearchCriteria['language'] })}>
                {preferredLanguageOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Release decade</span>
              <select value={criteria.decade ?? ''} onChange={(event) => updateCriteria({ decade: event.target.value ? Number(event.target.value) : null })}>
                <option value="">Any decade</option>
                {decadeOptions.map((decade) => (
                  <option key={decade} value={decade}>{decade}s</option>
                ))}
              </select>
            </label>
            <label>
              <span>Maximum runtime</span>
              <select value={criteria.runtimeMaximum ?? ''} onChange={(event) => updateCriteria({ runtimeMaximum: event.target.value ? Number(event.target.value) : null })}>
                <option value="">Any runtime</option>
                {runtimeOptions.map((runtime) => (
                  <option key={runtime} value={runtime}>{runtime} minutes</option>
                ))}
              </select>
            </label>
            <label className="intent-controls__checkbox">
              <input checked={criteria.familyFriendly} onChange={(event) => handleFamilyFriendlyChange(event.target.checked)} type="checkbox" />
              <span>Family-friendly</span>
            </label>
          </div>

          {limitedIntentMessage ? (
            <p className="intent-interpretation__mapping" role="status">
              {limitedIntentMessage}
            </p>
          ) : null}

          <fieldset className="intent-genres">
            <legend>Genres · choose up to four</legend>
            <div>
              {preferenceGenreDefinitions.map((genre) => (
                <button
                  aria-pressed={criteria.genres.includes(genre.id)}
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  type="button"
                >
                  {genre.label}
                </button>
              ))}
            </div>
          </fieldset>

          <button className="intent-interpretation__reset" onClick={() => updateCriteria(createDefaultIntentCriteria())} type="button">
            Reset filters
          </button>
        </section>
      ) : null}

      {query ? (
        <section className="search-results" aria-labelledby="search-results-title">
          <header className="search-results__heading">
            <div>
              <p className="archive-label">
                {isIntentMode ? 'Recommendations' : 'Search results'}
              </p>
              <h2 className="search-results__title font-display" id="search-results-title">
                {isIntentMode ? 'Matches for' : 'Results for'} “{query}”
              </h2>
            </div>
            <p aria-live="polite">
              <strong>{activeSearch.records.length.toLocaleString()}</strong>{' '}
              results loaded from{' '}
              <strong>{activeSearch.totalResults.toLocaleString()}</strong>{' '}
              reported catalogue matches.
            </p>
          </header>

          <div className={`search-scope search-scope--${visibleScopeOptions.length}`} aria-label="Filter loaded search results" role="group">
            {visibleScopeOptions.map((option) => (
              <button aria-pressed={scope === option.value} key={option.value} onClick={() => handleScopeChange(option.value)} type="button">
                <span>{option.label}</span>
                <strong>{scopeCounts[option.value]}</strong>
              </button>
            ))}
          </div>

          <div className="search-results__content">{resultsContent}</div>

          {activeSearch.records.length > 0 ? (
            <section className="search-continuation" aria-labelledby="search-continuation-title">
              <div>
                <p className="archive-label">More results</p>
                <h3 className="search-continuation__title font-display" id="search-continuation-title">
                  Continue searching.
                </h3>
                <p aria-live="polite">
                  {activeSearch.isFetchingNextPage
                    ? `Retrieving catalogue page ${activeSearch.loadedPageCount + 1}.`
                    : `${activeSearch.records.length.toLocaleString()} results are loaded.`}
                </p>
              </div>
              <div className="search-continuation__action">
                {activeSearch.isNextPageError ? (
                  <div role="alert">
                    <p>The next page could not be retrieved. Existing results remain available.</p>
                    {activeSearch.errorMessage ? <p>{activeSearch.errorMessage}</p> : null}
                  </div>
                ) : null}
                {activeSearch.hasNextPage ? (
                  <button aria-busy={activeSearch.isFetchingNextPage} disabled={activeSearch.isFetchingNextPage} onClick={activeSearch.loadNextPage} type="button">
                    {activeSearch.isFetchingNextPage
                      ? 'Loading more'
                      : activeSearch.isNextPageError
                        ? 'Retry next page'
                        : 'Load more records'}
                    <ArrowRight aria-hidden="true" />
                  </button>
                ) : (
                  <p className="search-continuation__complete">All available results are loaded.</p>
                )}
              </div>
            </section>
          ) : null}
        </section>
      ) : (
        <section className="search-idle" aria-labelledby="search-idle-title">
          <p className="archive-label">Start searching</p>
          <h2 className="search-idle__title font-display" id="search-idle-title">
            What do you want to watch?
          </h2>
          <p>
            Enter a title, person, mood, or viewing request above.
          </p>
        </section>
      )}
    </div>
  )
}
