import type { LibraryCandidate } from '../data/library'
import {
  isTvEpisodeWatched,
  setTvEpisodeWatched,
  type TvEpisodePointer,
} from '../data/tvProgress'
import { useLibrary } from '../hooks/useLibrary'

import './EpisodeProgressControl.css'

export function EpisodeProgressControl({
  candidate,
  episode,
  nextEpisode,
  variant = 'default',
}: {
  candidate: LibraryCandidate
  episode: TvEpisodePointer
  nextEpisode: TvEpisodePointer | null
  variant?: 'compact' | 'default'
}) {
  const { getRecord, updateRecord } = useLibrary()
  const record = getRecord('tv', candidate.id)
  const isWatched = isTvEpisodeWatched(
    record?.tvProgress,
    episode.seasonNumber,
    episode.episodeNumber,
  )
  const episodeCode = `S${String(
    episode.seasonNumber,
  ).padStart(2, '0')}E${String(
    episode.episodeNumber,
  ).padStart(2, '0')}`

  function handleProgressToggle(): void {
    updateRecord(candidate, {
      isWatched: isWatched
        ? false
        : record?.isWatched ?? false,
      tvProgress: setTvEpisodeWatched(
        record?.tvProgress,
        episode,
        nextEpisode,
        !isWatched,
      ),
    })
  }

  return (
    <button
      aria-label={`${
        isWatched ? 'Mark' : 'Record'
      } ${episodeCode} ${
        isWatched ? 'unwatched' : 'watched'
      }`}
      aria-pressed={isWatched}
      className={`episode-progress-control episode-progress-control--${variant}`}
      onClick={handleProgressToggle}
      type="button"
    >
      <span aria-hidden="true">
        {isWatched ? '✓' : '+'}
      </span>
      <strong>
        {isWatched
          ? 'Episode watched'
          : 'Mark episode watched'}
      </strong>
      <small>{episodeCode}</small>
    </button>
  )
}
