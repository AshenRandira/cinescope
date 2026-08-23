import {
  type FormEvent,
  useEffect,
  useState,
} from 'react'

import {
  PREFERENCE_GENRE_LIMIT,
  preferenceGenreDefinitions,
  preferredLanguageOptions,
  type PreferenceGenreId,
  type PreferredLanguage,
  type PreferredMedia,
  type UserPreferenceInput,
} from '../data/preferences'
import { usePreferences } from '../hooks/usePreferences'

import './PreferencesEditor.css'

type PreferenceMessage = {
  kind: 'error' | 'success'
  text: string
}

function toPreferenceInput({
  favoriteGenres,
  preferredLanguage,
  preferredMedia,
}: UserPreferenceInput): UserPreferenceInput {
  return {
    favoriteGenres: [...favoriteGenres],
    preferredLanguage,
    preferredMedia,
  }
}

export function PreferencesEditor() {
  const {
    preferences,
    retrySync,
    savePreferences,
    syncError,
    syncStatus,
  } = usePreferences()
  const [draft, setDraft] = useState<UserPreferenceInput>(
    () => toPreferenceInput(preferences),
  )
  const [message, setMessage] =
    useState<PreferenceMessage | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const genreLimitReached =
    draft.favoriteGenres.length >= PREFERENCE_GENRE_LIMIT

  useEffect(() => {
    setDraft(toPreferenceInput(preferences))
  }, [preferences])

  function toggleGenre(genreId: PreferenceGenreId): void {
    setMessage(null)
    setDraft((current) => {
      const isSelected =
        current.favoriteGenres.includes(genreId)

      if (!isSelected && genreLimitReached) return current

      return {
        ...current,
        favoriteGenres: isSelected
          ? current.favoriteGenres.filter(
              (currentGenre) => currentGenre !== genreId,
            )
          : [...current.favoriteGenres, genreId],
      }
    })
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setMessage(null)
    setIsSaving(true)

    try {
      await savePreferences(draft)
      setMessage({
        kind: 'success',
        text: 'Your discovery preferences were saved.',
      })
    } catch {
      setMessage({
        kind: 'error',
        text: 'Saved on this device. Cloud sync is unavailable; try again later.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section
      className="profile-preferences"
      aria-labelledby="profile-preferences-heading"
    >
      <header className="profile-section-heading">
        <div>
          <p className="archive-label">
            Discovery preferences
          </p>
          <h2
            className="font-display"
            id="profile-preferences-heading"
          >
            Personalize recommendations.
          </h2>
        </div>
        <aside
          className={`profile-section-heading__note profile-section-heading__note--${syncStatus}`}
          role="status"
        >
          <p className="archive-label">
            {syncStatus === 'error'
              ? 'Preference sync paused'
              : syncStatus === 'connecting' ||
                  syncStatus === 'syncing'
                ? 'Saving preferences'
                : syncStatus === 'local'
                  ? 'Saved on this device'
                  : 'Saved to your account'}
          </p>
          <p>
            {syncError ??
              'These choices prioritize matching recommendations without hiding other titles.'}
          </p>
          {syncStatus === 'error' ? (
            <button onClick={retrySync} type="button">
              Retry preference sync
            </button>
          ) : null}
        </aside>
      </header>

      <form
        className="profile-preferences__form"
        onSubmit={handleSubmit}
      >
        <fieldset className="profile-preferences__genres">
          <legend>
            <span>Favourite genres</span>
            <small>
              Choose up to {PREFERENCE_GENRE_LIMIT}.{' '}
              {draft.favoriteGenres.length} selected.
            </small>
          </legend>

          <div className="profile-preferences__genre-grid">
            {preferenceGenreDefinitions.map(
              ({ id, label }) => {
                const isSelected =
                  draft.favoriteGenres.includes(id)

                return (
                  <label key={id}>
                    <input
                      checked={isSelected}
                      disabled={
                        isSaving ||
                        (!isSelected && genreLimitReached)
                      }
                      onChange={() => toggleGenre(id)}
                      type="checkbox"
                    />
                    <span>{label}</span>
                  </label>
                )
              },
            )}
          </div>
        </fieldset>

        <div className="profile-preferences__registers">
          <fieldset>
            <legend>Preferred media</legend>
            <div className="profile-preferences__radio-grid">
              {(
                [
                  ['balanced', 'Balanced film and television'],
                  ['movie', 'Film leaning'],
                  ['tv', 'Series leaning'],
                ] as const satisfies ReadonlyArray<
                  readonly [PreferredMedia, string]
                >
              ).map(([value, label]) => (
                <label key={value}>
                  <input
                    checked={draft.preferredMedia === value}
                    disabled={isSaving}
                    name="preferred-media"
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        preferredMedia: value,
                      }))
                    }
                    type="radio"
                    value={value}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="profile-preferences__language">
            <span>Preferred original language</span>
            <small>
              Matching titles appear sooner. Other languages remain available.
            </small>
            <select
              aria-label="Preferred original language"
              disabled={isSaving}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  preferredLanguage: event.target
                    .value as PreferredLanguage,
                }))
              }
              value={draft.preferredLanguage}
            >
              {preferredLanguageOptions.map(
                ({ label, value }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        {message ? (
          <p
            aria-live={
              message.kind === 'success' ? 'polite' : undefined
            }
            className={`profile-account__message profile-account__message--${message.kind}`}
            role={message.kind === 'error' ? 'alert' : undefined}
          >
            {message.text}
          </p>
        ) : null}

        <button disabled={isSaving} type="submit">
          {isSaving
            ? 'Saving discovery profile…'
            : 'Save discovery preferences'}
        </button>
      </form>
    </section>
  )
}
