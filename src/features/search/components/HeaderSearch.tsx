import {
  Search,
  X,
} from 'lucide-react'
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  useLocation,
  useNavigate,
} from 'react-router'

import {
  getTmdbPosterUrl,
  getTmdbProfileUrl,
} from '../../../lib/tmdb/image'

import {
  normalizeSearchQuery,
  SEARCH_MAXIMUM_LENGTH,
  SEARCH_MINIMUM_LENGTH,
  type SearchRecord,
} from '../data/search'
import {
  parseNaturalLanguageIntent,
  serializeIntentSearch,
} from '../data/intentSearch'
import { useCineScopeSearch } from '../hooks/useCineScopeSearch'

import './HeaderSearch.css'

const HEADER_SEARCH_DEBOUNCE = 250
const HEADER_SUGGESTION_LIMIT = 6

function getLookupTarget(query: string): string {
  const searchParams = new URLSearchParams({
    q: query,
  })

  return `/search?${searchParams.toString()}`
}

function getIntentTarget(query: string): string {
  const parsed = parseNaturalLanguageIntent(query)

  return `/search?${serializeIntentSearch(
    query,
    parsed.criteria,
  ).toString()}`
}

function getSuggestionTarget(
  record: SearchRecord,
): string {
  if (record.mediaType === 'movie') {
    return `/movies/${record.id}`
  }

  if (record.mediaType === 'tv') {
    return `/tv/${record.id}`
  }

  return `/people/${record.id}`
}

function getSuggestionImage(
  record: SearchRecord,
): string | null {
  return record.imageType === 'profile'
    ? getTmdbProfileUrl(record.imagePath, 'w185')
    : getTmdbPosterUrl(record.imagePath, 'w185')
}

function getSuggestionType(
  record: SearchRecord,
): string {
  if (record.mediaType === 'movie') {
    return 'Film'
  }

  if (record.mediaType === 'tv') {
    return 'TV series'
  }

  return record.knownForDepartment
    ? `Person / ${record.knownForDepartment}`
    : 'Person'
}

export function HeaderSearch() {
  const location = useLocation()
  const navigate = useNavigate()
  const listboxId = useId()
  const rootRef = useRef<HTMLLIElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [draftQuery, setDraftQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] =
    useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] =
    useState(-1)
  const [validationMessage, setValidationMessage] =
    useState<string | null>(null)

  const normalizedQuery = normalizeSearchQuery(
    draftQuery,
  )
  const parsedIntent = useMemo(
    () => parseNaturalLanguageIntent(normalizedQuery),
    [normalizedQuery],
  )
  const search = useCineScopeSearch(
    debouncedQuery,
    isOpen,
  )
  const suggestions = useMemo(
    () =>
      search.records.slice(
        0,
        HEADER_SUGGESTION_LIMIT,
      ),
    [search.records],
  )
  const isSearchRoute =
    location.pathname === '/search'
  const canSearch =
    normalizedQuery.length >=
    SEARCH_MINIMUM_LENGTH
  const isPreparing =
    canSearch &&
    debouncedQuery !== normalizedQuery
  const isExpanded =
    isOpen &&
    (canSearch || Boolean(validationMessage))

  useEffect(() => {
    if (location.pathname !== '/search') {
      setDraftQuery('')
      setDebouncedQuery('')
      setValidationMessage(null)
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    const searchParams = new URLSearchParams(
      location.search,
    )
    const routeQuery = normalizeSearchQuery(
      searchParams.get('q') ?? '',
    )

    setDraftQuery(routeQuery)
    setDebouncedQuery(
      routeQuery.length >= SEARCH_MINIMUM_LENGTH
        ? routeQuery
        : '',
    )
    setValidationMessage(null)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!canSearch) {
      setDebouncedQuery('')
      return
    }

    const timeout = window.setTimeout(() => {
      setDebouncedQuery(normalizedQuery)
    }, HEADER_SEARCH_DEBOUNCE)

    return () => window.clearTimeout(timeout)
  }, [canSearch, normalizedQuery])

  useEffect(() => {
    setActiveIndex(-1)
  }, [debouncedQuery])

  useEffect(() => {
    function handlePointerDown(
      event: PointerEvent,
    ): void {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener(
      'pointerdown',
      handlePointerDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )
    }
  }, [])

  function openTarget(target: string): void {
    setIsOpen(false)
    setActiveIndex(-1)
    navigate(target)
  }

  function commitSearch(
    mode: 'auto' | 'lookup' = 'auto',
  ): void {
    if (!normalizedQuery) {
      openTarget('/search')
      return
    }

    if (!canSearch) {
      setValidationMessage(
        `Enter at least ${SEARCH_MINIMUM_LENGTH} characters.`,
      )
      setIsOpen(true)
      inputRef.current?.focus()
      return
    }

    setValidationMessage(null)
    openTarget(
      mode === 'auto' && parsedIntent.isIntent
        ? getIntentTarget(normalizedQuery)
        : getLookupTarget(normalizedQuery),
    )
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault()
    commitSearch('auto')
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    setDraftQuery(
      event.target.value.slice(
        0,
        SEARCH_MAXIMUM_LENGTH,
      ),
    )
    setValidationMessage(null)
    setActiveIndex(-1)
    setIsOpen(true)
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ): void {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (
      event.key === 'Enter' &&
      activeIndex >= 0
    ) {
      const suggestion = suggestions[activeIndex]

      if (suggestion) {
        event.preventDefault()
        openTarget(
          getSuggestionTarget(suggestion),
        )
      }

      return
    }

    if (
      event.key !== 'ArrowDown' &&
      event.key !== 'ArrowUp'
    ) {
      return
    }

    if (suggestions.length === 0) {
      return
    }

    event.preventDefault()
    setIsOpen(true)
    setActiveIndex((currentIndex) => {
      if (event.key === 'ArrowDown') {
        return currentIndex >=
          suggestions.length - 1
          ? 0
          : currentIndex + 1
      }

      return currentIndex <= 0
        ? suggestions.length - 1
        : currentIndex - 1
    })
  }

  function handleClear(): void {
    setDraftQuery('')
    setDebouncedQuery('')
    setValidationMessage(null)
    setActiveIndex(-1)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <li
      className={[
        'header-search',
        isSearchRoute
          ? 'header-search--route-active'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={rootRef}
    >
      <span
        aria-hidden="true"
        className="header-search__index"
      >
        04
      </span>

      <form
        aria-label="Search CineScope"
        className="header-search__form"
        onSubmit={handleSubmit}
        role="search"
      >
        <Search aria-hidden="true" />

        <input
          aria-activedescendant={
            activeIndex >= 0
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={
            isExpanded ? listboxId : undefined
          }
          aria-expanded={isExpanded}
          aria-label="Search titles and people, or describe what you want to watch"
          autoComplete="off"
          maxLength={SEARCH_MAXIMUM_LENGTH}
          onChange={handleChange}
          onFocus={() => {
            if (canSearch || validationMessage) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          ref={inputRef}
          role="combobox"
          spellCheck="false"
          type="search"
          value={draftQuery}
        />

        {draftQuery ? (
          <button
            aria-label="Clear header search"
            className="header-search__clear"
            onClick={handleClear}
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        ) : null}

        <button
          aria-label="Search or recommend"
          className="header-search__submit"
          type="submit"
        >
          <Search aria-hidden="true" />
        </button>
      </form>

      <span
        aria-hidden="true"
        className="header-search__route-line"
      />

      {isExpanded ? (
        <div className="header-search__panel">
          <div className="header-search__panel-heading">
            <span>Live archive suggestions</span>
            <span>
              {isPreparing || search.isPending
                ? 'Scanning'
                : `${suggestions.length} shown`}
            </span>
          </div>

          <div
            aria-busy={
              isPreparing || search.isPending
            }
            aria-label="Search suggestions"
            aria-live="polite"
            id={listboxId}
            role="listbox"
          >
            {validationMessage ? (
              <div
                aria-disabled="true"
                aria-selected="false"
                className="header-search__message header-search__message--warning"
                role="option"
              >
                {validationMessage}
              </div>
            ) : isPreparing || search.isPending ? (
              <div
                aria-disabled="true"
                aria-selected="false"
                className="header-search__message"
                role="option"
              >
                Matching records in the living archive.
              </div>
            ) : search.isInitialError ? (
              <div
                aria-disabled="true"
                aria-selected="false"
                className="header-search__message header-search__message--error"
                role="option"
              >
                Suggestions are unavailable. Full search is still available.
              </div>
            ) : suggestions.length > 0 ? (
              <div className="header-search__suggestions">
                {suggestions.map((record, index) => {
                  const imageUrl =
                    getSuggestionImage(record)
                  const isActive =
                    activeIndex === index

                  return (
                    <button
                      aria-selected={isActive}
                      className="header-search__suggestion"
                      id={`${listboxId}-option-${index}`}
                      key={`${record.mediaType}:${record.id}`}
                      onClick={() =>
                        openTarget(
                          getSuggestionTarget(record),
                        )
                      }
                      onMouseEnter={() =>
                        setActiveIndex(index)
                      }
                      role="option"
                      tabIndex={-1}
                      type="button"
                    >
                      <span className="header-search__artwork">
                        {imageUrl ? (
                          <img
                            alt=""
                            decoding="async"
                            loading="lazy"
                            src={imageUrl}
                          />
                        ) : (
                          <span aria-hidden="true">
                            {record.title
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        )}
                      </span>

                      <span className="header-search__record">
                        <strong>{record.title}</strong>
                        <span>
                          {getSuggestionType(record)}
                          {record.dateYear
                            ? ` / ${record.dateYear}`
                            : ''}
                        </span>
                      </span>

                      <span
                        aria-hidden="true"
                        className="header-search__record-index"
                      >
                        {String(index + 1).padStart(
                          2,
                          '0',
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div
                aria-disabled="true"
                aria-selected="false"
                className="header-search__message"
                role="option"
              >
                No names matched this projection.
              </div>
            )}
          </div>

          {canSearch && parsedIntent.isIntent ? (
            <div className="header-search__intent-preview">
              <div>
                <strong>Viewing request detected</strong>
                <span>
                  {parsedIntent.recognizedSignals.length > 0
                    ? parsedIntent.recognizedSignals.join(' / ')
                    : 'Open catalogue request'}
                </span>
              </div>

              <button
                onClick={() => commitSearch('lookup')}
                type="button"
              >
                Search names instead
              </button>
            </div>
          ) : null}

          {canSearch ? (
            <button
              className="header-search__all-results"
              onClick={() => commitSearch('auto')}
              type="button"
            >
              <span>
                {parsedIntent.isIntent
                  ? `Recommend for “${normalizedQuery}”`
                  : `Show all results for “${normalizedQuery}”`}
              </span>
              <Search aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
