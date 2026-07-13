import {
  useCallback,
  useMemo,
} from 'react'
import { useSearchParams } from 'react-router'
import type {
  MovieDiscoveryFilters,
  MovieDiscoverySort,
  MovieMinimumScore,
  MovieReleasePeriod,
  MovieRuntimeRange,
} from '../data/movieDiscovery'
import {
  isDefaultMovieDiscoveryFilters,
  parseMovieDiscoveryFilters,
  serializeMovieDiscoveryFilters,
} from '../data/movieDiscoveryUrl'

export function useMovieDiscoveryFilters() {
  const [searchParams, setSearchParams] =
    useSearchParams()

  const filters = useMemo(
    () =>
      parseMovieDiscoveryFilters(searchParams),
    [searchParams],
  )

  const updateFilters = useCallback(
    (
      changes: Partial<MovieDiscoveryFilters>,
    ): void => {
      const nextFilters = {
        ...filters,
        ...changes,
      }

      setSearchParams(
        serializeMovieDiscoveryFilters(
          nextFilters,
        ),
      )
    },
    [filters, setSearchParams],
  )

  const setGenreId = useCallback(
    (genreId: number | null): void => {
      updateFilters({ genreId })
    },
    [updateFilters],
  )

  const setSort = useCallback(
    (sort: MovieDiscoverySort): void => {
      updateFilters({ sort })
    },
    [updateFilters],
  )

  const setReleasePeriod = useCallback(
    (
      releasePeriod: MovieReleasePeriod,
    ): void => {
      updateFilters({ releasePeriod })
    },
    [updateFilters],
  )

  const setRuntime = useCallback(
    (runtime: MovieRuntimeRange): void => {
      updateFilters({ runtime })
    },
    [updateFilters],
  )

  const setMinimumScore = useCallback(
    (
      minimumScore: MovieMinimumScore,
    ): void => {
      updateFilters({ minimumScore })
    },
    [updateFilters],
  )

  const resetFilters = useCallback((): void => {
    setSearchParams(new URLSearchParams())
  }, [setSearchParams])

  return {
    filters,
    isDefault:
      isDefaultMovieDiscoveryFilters(filters),
    resetFilters,
    setGenreId,
    setMinimumScore,
    setReleasePeriod,
    setRuntime,
    setSort,
  }
}
