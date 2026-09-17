interface Env { TMDB_READ_ACCESS_TOKEN: string; TMDB_ORIGIN: string }

const allowedPaths = /^\/(?:movie\/(?:popular|now_playing|upcoming|[1-9]\d*(?:\/watch\/providers|\/recommendations)?)|tv\/(?:popular|top_rated|on_the_air|airing_today|[1-9]\d*(?:\/watch\/providers|\/recommendations|\/season\/\d+(?:\/episode\/\d+)?)?)|discover\/(?:movie|tv)|trending\/(?:all|movie|tv)\/week|search\/multi|genre\/(?:movie|tv)\/list|person\/[1-9]\d*)$/
const allowedQuery = new Set(['language','page','query','include_adult','include_video','sort_by','with_genres','without_genres','with_original_language','with_runtime.gte','with_runtime.lte','vote_average.gte','vote_count.gte','primary_release_date.gte','primary_release_date.lte','first_air_date.gte','first_air_date.lte','timezone','append_to_response'])
const cors = {'access-control-allow-origin':'*','access-control-allow-methods':'GET, OPTIONS','access-control-allow-headers':'content-type'}
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), {status, headers:{...cors,'content-type':'application/json'}}) }
export default { async fetch(request: Request, env: Env) {
  if (request.method === 'OPTIONS') return new Response(null, {headers:cors})
  if (request.method !== 'GET') return json({error:{code:'method_not_allowed',message:'Only GET requests are supported.'}},405)
  const url = new URL(request.url); const path = url.pathname.replace(/^\/api\/tmdb/, '')
  if (!allowedPaths.test(path)) return json({error:{code:'not_found',message:'This catalogue route is not available.'}},404)
  const query = new URLSearchParams()
  for (const [key,value] of url.searchParams) { if (!allowedQuery.has(key) || value.length > 200) return json({error:{code:'invalid_request',message:'The catalogue request is not valid.'}},400); query.set(key,value) }
  const upstream = `${env.TMDB_ORIGIN}${path}?${query}`
  const response = await fetch(upstream, {headers:{Authorization:`Bearer ${env.TMDB_READ_ACCESS_TOKEN}`,Accept:'application/json'}})
  return new Response(await response.text(), {status:response.status, headers:{...cors,'content-type':'application/json'}})
} }
