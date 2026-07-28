import {
    useEffect,
    useMemo,
    useState,
  } from 'react'

  import {
    ExternalLink,
    RefreshCw,
  } from 'lucide-react'

  import {
    getTmdbLogoUrl,
  } from '../../../lib/tmdb/image'

  import type {
    TmdbWatchProvider,
    TmdbWatchProviderResponse,
  } from '../../../types/tmdb'

  import './MovieAvailabilitySection.css'

  type WatchProviderQueryState = {
    data: TmdbWatchProviderResponse | null
    errorMessage: string | null
    isError: boolean
    isPending: boolean
    retry: () => void
  }

  type MovieAvailabilitySectionProps = {
    movieTitle: string
    watchProviders: WatchProviderQueryState
  }

  type ProviderCategoryKey =
    | 'flatrate'
    | 'free'
    | 'ads'
    | 'rent'
    | 'buy'

  type ProviderCategory = {
    key: ProviderCategoryKey
    label: string
    note: string
  }

  const PROVIDER_CATEGORIES:
    readonly ProviderCategory[] = [
      {
        key: 'flatrate',
        label: 'Streaming',
        note: 'Included with a subscription',
      },
      {
        key: 'free',
        label: 'Free',
        note: 'Available without a purchase',
      },
      {
        key: 'ads',
        label: 'With ads',
        note: 'Ad-supported viewing',
      },
      {
        key: 'rent',
        label: 'Rent',
        note: 'Time-limited digital access',
      },
      {
        key: 'buy',
        label: 'Buy',
        note: 'Digital purchase availability',
      },
    ]

  function getBrowserRegion(): string | null {
    if (typeof navigator === 'undefined') {
      return null
    }

    const locales = [
      ...navigator.languages,
      navigator.language,
    ]

    for (const locale of locales) {
      const match = locale.match(
        /[-_]([A-Za-z]{2}|\d{3})(?:$|[-_])/,
      )

      if (match?.[1]) {
        return match[1].toUpperCase()
      }
    }

    return null
  }

  function getRegionLabel(
    regionCode: string,
  ): string {
    try {
      const displayNames = new Intl.DisplayNames(
        ['en'],
        {
          type: 'region',
        },
      )

      return (
        displayNames.of(regionCode) ??
        regionCode
      )
    } catch {
      return regionCode
    }
  }

  function getProviderInitials(
    providerName: string,
  ): string {
    const initials = providerName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('')

    return initials || 'CS'
  }

  function sortProviders(
    providers: TmdbWatchProvider[],
  ): TmdbWatchProvider[] {
    return [...providers].sort(
      (firstProvider, secondProvider) =>
        firstProvider.display_priority -
          secondProvider.display_priority ||
        firstProvider.provider_name.localeCompare(
          secondProvider.provider_name,
        ),
    )
  }

  export function MovieAvailabilitySection({
    movieTitle,
    watchProviders,
  }: MovieAvailabilitySectionProps) {
    const browserRegion =
      getBrowserRegion() ?? 'US'

    const [
      selectedRegion,
      setSelectedRegion,
    ] = useState(browserRegion)

    const availableRegions = useMemo(() => {
      const regionCodes = Object.keys(
        watchProviders.data?.results ?? {},
      )

      return regionCodes.sort((first, second) =>
        getRegionLabel(first).localeCompare(
          getRegionLabel(second),
        ),
      )
    }, [watchProviders.data])

    useEffect(() => {
      if (
        availableRegions.length === 0 ||
        availableRegions.includes(
          selectedRegion,
        )
      ) {
        return
      }

      if (
        availableRegions.includes(browserRegion)
      ) {
        setSelectedRegion(browserRegion)
        return
      }

      if (availableRegions.includes('US')) {
        setSelectedRegion('US')
        return
      }

      setSelectedRegion(availableRegions[0])
    }, [
      availableRegions,
      browserRegion,
      selectedRegion,
    ])

    const selectedAvailability =
      watchProviders.data?.results[
        selectedRegion
      ] ?? null

    const providerGroups =
      selectedAvailability
        ? PROVIDER_CATEGORIES
            .map((category) => ({
              ...category,
              providers: sortProviders(
                selectedAvailability[
                  category.key
                ] ?? [],
              ),
            }))
            .filter(
              (category) =>
                category.providers.length > 0,
            )
        : []

    const regionLabel =
      getRegionLabel(selectedRegion)

    return (
      <section
        className="movie-availability"
        aria-labelledby="movie-availability-heading"
      >
        <header className="movie-availability__heading">
          <div>
            <p className="archive-label">
              05 / Viewing coordinates
            </p>

            <h2
              className="movie-availability__title font-display text-balance"
              id="movie-availability-heading"
            >
              Where the feature may be projected.
            </h2>
          </div>

          <div className="movie-availability__introduction">
            <p className="text-pretty">
              Availability varies by territory and may
              change without notice. Select a country to
              inspect the current provider record.
            </p>

            {availableRegions.length > 0 ? (
              <label className="movie-availability__region-control">
                <span>Viewing country</span>

                <select
                  value={selectedRegion}
                  onChange={(event) => {
                    setSelectedRegion(
                      event.target.value,
                    )
                  }}
                >
                  {availableRegions.map(
                    (regionCode) => (
                      <option
                        key={regionCode}
                        value={regionCode}
                      >
                        {getRegionLabel(
                          regionCode,
                        )}{' '}
                        ({regionCode})
                      </option>
                    ),
                  )}
                </select>
              </label>
            ) : null}
          </div>
        </header>

        {watchProviders.isPending ? (
          <div
            className="movie-availability-state"
            aria-live="polite"
          >
            <p className="movie-availability-state__index">
              Reading territory records
            </p>

            <h3 className="font-display">
              Locating viewing providers.
            </h3>

            <p>
              CineScope is retrieving regional
              availability for {movieTitle}.
            </p>
          </div>
        ) : null}

        {watchProviders.isError ? (
          <div
            className="movie-availability-state"
            role="alert"
          >
            <p className="movie-availability-state__index">
              Provider record interrupted
            </p>

            <h3 className="font-display">
              Availability could not be retrieved.
            </h3>

            <p>
              {watchProviders.errorMessage ??
                'The provider catalogue is temporarily unavailable.'}
            </p>

            <button
              type="button"
              onClick={watchProviders.retry}
            >
              <RefreshCw aria-hidden="true" />
              Retry provider record
            </button>
          </div>
        ) : null}

        {!watchProviders.isPending &&
        !watchProviders.isError &&
        availableRegions.length === 0 ? (
          <div className="movie-availability-state">
            <p className="movie-availability-state__index">
              No territory records
            </p>

            <h3 className="font-display">
              Availability is not catalogued.
            </h3>

            <p>
              No country-specific provider records are
              attached to this movie at present.
            </p>
          </div>
        ) : null}

        {!watchProviders.isPending &&
        !watchProviders.isError &&
        availableRegions.length > 0 &&
        providerGroups.length === 0 ? (
          <div className="movie-availability-state">
            <p className="movie-availability-state__index">
              {regionLabel} / No current listings
            </p>

            <h3 className="font-display">
              No providers are recorded for this country.
            </h3>

            <p>
              Try another viewing country or return later
              as regional availability changes.
            </p>
          </div>
        ) : null}

        {!watchProviders.isPending &&
        !watchProviders.isError &&
        providerGroups.length > 0 ? (
          <div className="movie-availability__record">
            <div className="movie-availability__region-index">
              <p>Selected territory</p>

              <strong className="font-display">
                {regionLabel}
              </strong>

              <span>{selectedRegion}</span>
            </div>

            <div className="movie-availability__groups">
              {providerGroups.map((group) => (
                <section
                  className="movie-provider-group"
                  key={group.key}
                  aria-labelledby={`provider-group-${group.key}`}
                >
                  <header>
                    <div>
                      <p>{group.note}</p>

                      <h3
                        className="font-display"
                        id={`provider-group-${group.key}`}
                      >
                        {group.label}
                      </h3>
                    </div>

                    <span>
                      {group.providers.length}{' '}
                      {group.providers.length === 1
                        ? 'provider'
                        : 'providers'}
                    </span>
                  </header>

                  <ul>
                    {group.providers.map(
                      (provider) => {
                        const logoUrl =
                          getTmdbLogoUrl(
                            provider.logo_path,
                            'w92',
                          )

                        return (
                          <li
                            key={
                              provider.provider_id
                            }
                          >
                            <div className="movie-provider-card__logo">
                              {logoUrl ? (
                                <img
                                  alt=""
                                  decoding="async"
                                  loading="lazy"
                                  src={logoUrl}
                                />
                              ) : (
                                <span
                                  aria-hidden="true"
                                >
                                  {getProviderInitials(
                                    provider.provider_name,
                                  )}
                                </span>
                              )}
                            </div>

                            <p>
                              {
                                provider.provider_name
                              }
                            </p>
                          </li>
                        )
                      },
                    )}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        ) : null}

        {!watchProviders.isPending &&
        !watchProviders.isError &&
        selectedAvailability?.link ? (
          <footer className="movie-availability__footer">
            <p>
              Availability data supplied by{' '}
              <strong>JustWatch</strong> through TMDB.
            </p>

            <a
              href={selectedAvailability.link}
              rel="noreferrer"
              target="_blank"
            >
              View current provider links
              <ExternalLink aria-hidden="true" />
            </a>
          </footer>
        ) : null}
      </section>
    )
  }