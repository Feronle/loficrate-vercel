import { NextRequest, NextResponse } from 'next/server'
 
const TAVILY_API_URL = 'https://api.tavily.com/search'
 
const DEFAULT_DOMAINS = [
  'freemusicarchive.org',
  'soundcloud.com',
  'pixabay.com',
  'incompetech.com',
  'bensound.com',
  'chosic.com',
  'ccmixter.org',
  'freesound.org',
  'jamendo.com',
  'bandcamp.com',
  'youtube.com',
  'music.youtube.com',
  'audionautix.com',
  'mixkit.co',
]
 
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const query = searchParams.get('q')
    const platform = searchParams.get('platform')
    const excludePlatforms = searchParams.get('exclude')?.split(',').filter(Boolean) || []
 
    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }
 
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Search API not configured', results: [] }, { status: 500 })
    }
 
    let domains: string[]
    if (platform) {
      domains = [platform]
    } else {
      domains = DEFAULT_DOMAINS.filter(d => !excludePlatforms.includes(d))
    }
 
    const isYTPlatform = platform === 'youtube.com' || platform === 'music.youtube.com'
    let searchQuery = query
 
    if (isYTPlatform) {
      searchQuery = `${query} "creative commons" OR "CC BY" artist license attribution`
    } else {
      searchQuery = `${query} track download "by" artist license -playlist -category`
    }
 
    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: searchQuery,
        search_depth: 'advanced',
        include_answer: true,
        include_raw_content: false,
        max_results: 12,
        include_domains: domains,
      }),
    })
 
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Tavily API error:', response.status, errorText)
      return NextResponse.json({ error: 'Search API request failed', results: [] }, { status: 500 })
    }
 
    const data = await response.json()
 
    const catalogPatterns = [
      /\/page\/\d+$/,
      /\/free-music\/?$/,
      /\/royalty-free\/?$/,
      /\/search\?/,
      /\/tag\//,
      /\/category\//,
      /\/genre\//,
      /\/browse/,
      /\/collection/,
      /\/sets\//,
    ]
 
    const isCatalogPage = (url: string) => {
      if (url.includes('soundcloud.com') && url.split('/').length >= 5) return false
      if (url.includes('freemusicarchive.org/music/') && url.split('/').length >= 7) return false
      if (url.includes('freesound.org/people/') || url.includes('freesound.org/sounds/')) return false
      if (url.includes('youtube.com/watch')) return false
      if (url.includes('pixabay.com/music/') && !url.match(/pixabay\.com\/music\/?$/)) return false
      return catalogPatterns.some(p => p.test(url))
    }
 
    const results = (data.results || [])
      .filter((r: { url: string }) => !isCatalogPage(r.url))
      .map((r: { title?: string; url?: string; content?: string; score?: number }) => {
        const title = r.title || ''
        const content = r.content || ''
 
        let artist = ''
        const byMatch = title.match(/\sby\s+([^|–\-\[\(]+)/i)
        const dashMatch = title.match(/^(.+?)\s*[–\-]\s*(.+)/)
        if (byMatch) artist = byMatch[1].trim()
        else if (dashMatch && dashMatch[1].length < 50) artist = dashMatch[1].trim()
        if (!artist) {
          const contentBy = content.match(/by\s+([A-Z][a-zA-Z\s]{2,30})(?:\s|$)/m)
          if (contentBy) artist = contentBy[1].trim()
        }
 
        let license = 'verify license'
        const combined = content + title
        if (/CC0|public.?domain/i.test(combined)) license = 'CC0'
        else if (/CC.BY.SA.4/i.test(combined)) license = 'CC-BY-SA 4.0'
        else if (/CC.BY.SA.3/i.test(combined)) license = 'CC-BY-SA 3.0'
        else if (/CC.BY.SA/i.test(combined)) license = 'CC-BY-SA'
        else if (/CC.BY.NC.ND/i.test(combined)) license = 'CC-BY-NC-ND'
        else if (/CC.BY.NC.SA/i.test(combined)) license = 'CC-BY-NC-SA'
        else if (/CC.BY.NC/i.test(combined)) license = 'CC-BY-NC'
        else if (/CC.BY.4/i.test(combined)) license = 'CC-BY 4.0'
        else if (/CC.BY.3/i.test(combined)) license = 'CC-BY 3.0'
        else if (/CC.BY/i.test(combined)) license = 'CC-BY'
        else if (/creative.commons/i.test(combined)) license = 'CC'
        else if (/royalty.free/i.test(combined)) license = 'Royalty-Free'
 
        let licenseUrl = ''
        const licUrlMatch = content.match(/https:\/\/creativecommons\.org\/licenses\/[^\s"')]+/)
        if (licUrlMatch) licenseUrl = licUrlMatch[0]
 
        let source = ''
        try { source = new URL(r.url || '').hostname.replace('www.', '') } catch { /* empty */ }
 
        return {
          name: title || 'Untitled',
          url: r.url || '',
          snippet: content,
          artist,
          license,
          licenseUrl,
          source,
          score: r.score || 0,
        }
      })
 
    return NextResponse.json({ results, answer: data.answer || null })
  } catch (error) {
    console.error('Web search error:', error)
    return NextResponse.json({ error: 'Web search failed', results: [] }, { status: 500 })
  }
}
