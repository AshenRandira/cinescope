import {
  Bookmark,
  BookmarkCheck,
  Check,
  Heart,
} from 'lucide-react'

import type {
  LibraryCandidate,
} from '../data/library'
import { useLibrary } from '../hooks/useLibrary'

import './LibraryControls.css'

type LibraryControlsProps = {
  candidate: LibraryCandidate
  variant?: 'full' | 'save'
}

const RATING_OPTIONS = Array.from(
  { length: 10 },
  (_, index) => index + 1,
)

export function LibraryControls({
  candidate,
  variant = 'full',
}: LibraryControlsProps) {
  const {
    getRecord,
    removeRecord,
    updateRecord,
  } = useLibrary()
  const record = getRecord(
    candidate.mediaType,
    candidate.id,
  )
  const isSaved = Boolean(record)

  function toggleSaved(): void {
    if (record) {
      removeRecord(
        candidate.mediaType,
        candidate.id,
      )
      return
    }

    updateRecord(candidate)
  }

  if (variant === 'save') {
    return (
      <button
        aria-label={`${
          isSaved ? 'Remove' : 'Save'
        } ${candidate.title} ${
          isSaved ? 'from' : 'to'
        } library`}
        aria-pressed={isSaved}
        className="library-save-control"
        onClick={toggleSaved}
        type="button"
      >
        {isSaved ? (
          <BookmarkCheck aria-hidden="true" />
        ) : (
          <Bookmark aria-hidden="true" />
        )}

        {isSaved ? 'Saved' : 'Save'}
      </button>
    )
  }

  return (
    <div
      className="library-controls"
      aria-label={`Library controls for ${candidate.title}`}
      role="group"
    >
      <button
        aria-pressed={isSaved}
        onClick={toggleSaved}
        type="button"
      >
        {isSaved ? (
          <BookmarkCheck aria-hidden="true" />
        ) : (
          <Bookmark aria-hidden="true" />
        )}

        {isSaved
          ? 'Saved to library'
          : 'Save to library'}
      </button>

      <button
        aria-pressed={
          record?.isWatched ?? false
        }
        onClick={() =>
          updateRecord(candidate, {
            isWatched:
              !(record?.isWatched ?? false),
          })
        }
        type="button"
      >
        <Check aria-hidden="true" />
        {record?.isWatched
          ? 'Watched'
          : 'Mark watched'}
      </button>

      <button
        aria-pressed={
          record?.isFavorite ?? false
        }
        onClick={() =>
          updateRecord(candidate, {
            isFavorite:
              !(record?.isFavorite ?? false),
          })
        }
        type="button"
      >
        <Heart aria-hidden="true" />
        {record?.isFavorite
          ? 'Favourite'
          : 'Mark favourite'}
      </button>

      <label>
        <span>Your rating</span>

        <select
          aria-label={`Your rating for ${candidate.title}`}
          onChange={(event) =>
            updateRecord(candidate, {
              userRating: event.target.value
                ? Number(event.target.value)
                : null,
            })
          }
          value={record?.userRating ?? ''}
        >
          <option value="">Not rated</option>

          {RATING_OPTIONS.map((rating) => (
            <option
              key={rating}
              value={rating}
            >
              {rating} / 10
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
