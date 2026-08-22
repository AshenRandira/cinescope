// @vitest-environment jsdom

import '../../test/setup-dom'

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { DocumentMetadata } from './DocumentMetadata'

function renderMetadata(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <DocumentMetadata />
    </MemoryRouter>,
  )
}

function getNamedMeta(name: string) {
  return document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`,
  )
}

function getPropertyMeta(property: string) {
  return document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  )
}

describe('DocumentMetadata', () => {
  beforeEach(() => {
    document.head.innerHTML = '<title>Movie record — CineScope</title>'
  })

  it('publishes indexable canonical and social metadata for public routes', () => {
    renderMetadata('/movies/550')

    expect(getNamedMeta('description')?.content).toContain(
      'movie records',
    )
    expect(getNamedMeta('robots')?.content).toBe(
      'index, follow, max-image-preview:large',
    )
    expect(getNamedMeta('twitter:card')?.content).toBe(
      'summary_large_image',
    )
    expect(getPropertyMeta('og:url')?.content).toBe(
      'http://localhost:3000/movies/550',
    )
    expect(
      document.head.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
      )?.href,
    ).toBe('http://localhost:3000/movies/550')
    expect(getPropertyMeta('og:title')?.content).toBe(
      'Movie record — CineScope',
    )
  })

  it('keeps private or transient routes out of search indexes', () => {
    renderMetadata('/profile')

    expect(getNamedMeta('robots')?.content).toBe(
      'noindex, follow',
    )
  })

  it('keeps social titles synchronized with route title changes', async () => {
    renderMetadata('/privacy')

    document.title = 'Privacy — CineScope'

    await waitFor(() => {
      expect(getNamedMeta('twitter:title')?.content).toBe(
        'Privacy — CineScope',
      )
      expect(getPropertyMeta('og:title')?.content).toBe(
        'Privacy — CineScope',
      )
    })
  })
})
