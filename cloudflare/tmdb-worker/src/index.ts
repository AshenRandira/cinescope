interface Env {
  TMDB_READ_ACCESS_TOKEN: string
  TMDB_ORIGIN: string
}

const allowedPath = /^\/(?:genre\/(?:movie|tv)\/list|search\/multi|discover\/(?:movie|tv)|trending\/(?:all|movie|tv)\/week|movie\/(?:popular|now_playing|upcoming|[1-9]\d*(?:\/watch\/providers|\/recommendations)?)|tv\/(?:popular|top_rated|on_the_air|airing_today|[1-9]\d*(?:\/watch\/providers|\/recommendations|\/season\/(?:0|[1-9]\d*)(?:\/episode\/[1-9]\d*)?)?)|person\/[1-9]\d*)$/
const allowedQuery = new Set([
  'language', 'page', 'query', 'include_adult', 'include_video',
  'sort_by', 'with_genres', 'without_genres', 'with_original_language',
  'with_runtime.gte', 'with_runtime.lte', 'vote_average.gte',
  'vote_count.gte', 'primary_release_date.gte', 'primary_release_date.lte',
  'first_air_date.gte', 'first_air_date.lte', 'timezone',
])

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'GET') return json({ error: { code: 'method_not_allowed', message: 'Only GET requests are supported.' } }, 405)
    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/api\/tmdb/, '')
    if (!allowedPath.test(path)) return json({ error: { code: 'not_found', message: 'This catalogue route is not available.' } }, 404)
    const query = new URLSearchParams()
    for (const [key, value] of url.searchParams) {
      if (!allowedQuery.has(key) || value.length > 200) return json({ error: { code: 'invalid_request', message: 'The catalogue request is not valid.' } }, 400)
      query.set(key, value)
    }
    if (/^\/movie\/\d+$/.test(path)) query.set('append_to_response', 'credits,videos,recommendations')
    if (/^\/tv\/\d+$/.test(path)) query.set('append_to_response', 'credits,videos,recommendations')
    const upstream = `${env.TMDB_ORIGIN}${path}?${query.toString()}`
    const response = await fetch(upstream, { headers: { Authorization: `Bearer ${env.TMDB_READ_ACCESS_TOKEN}`, Accept: 'application/json' } })
    const body = await response.text()
    return new Response(body, { status: response.status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } })
  },
}
