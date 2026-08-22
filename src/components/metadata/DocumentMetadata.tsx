import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { getRouteMetadata } from '../../lib/documentMetadata'

function setNamedMeta(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`,
  )

  if (!element) {
    element = document.createElement('meta')
    element.name = name
    document.head.append(element)
  }

  element.content = content
}

function setPropertyMeta(property: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  )

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.append(element)
  }

  element.content = content
}

function setCanonicalUrl(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )

  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.append(element)
  }

  element.href = url
}

export function DocumentMetadata() {
  const { pathname } = useLocation()

  useEffect(() => {
    const metadata = getRouteMetadata(pathname)
    const canonicalUrl = new URL(
      pathname,
      window.location.origin,
    ).toString()
    const socialImageUrl = new URL(
      '/branding/social-preview.png',
      window.location.origin,
    ).toString()

    setNamedMeta('description', metadata.description)
    setNamedMeta(
      'robots',
      metadata.indexable
        ? 'index, follow, max-image-preview:large'
        : 'noindex, follow',
    )
    setNamedMeta('twitter:card', 'summary_large_image')
    setNamedMeta('twitter:description', metadata.description)
    setNamedMeta('twitter:image', socialImageUrl)
    setPropertyMeta('og:description', metadata.description)
    setPropertyMeta('og:image', socialImageUrl)
    setPropertyMeta('og:site_name', 'CineScope')
    setPropertyMeta('og:type', 'website')
    setPropertyMeta('og:url', canonicalUrl)
    setCanonicalUrl(canonicalUrl)

    const syncTitle = () => {
      setNamedMeta('twitter:title', document.title)
      setPropertyMeta('og:title', document.title)
    }
    const titleElement = document.head.querySelector('title')
    const titleObserver = titleElement
      ? new MutationObserver(syncTitle)
      : null

    syncTitle()
    if (titleElement && titleObserver) {
      titleObserver.observe(titleElement, {
        childList: true,
        subtree: true,
      })
    }

    return () => titleObserver?.disconnect()
  }, [pathname])

  return null
}
