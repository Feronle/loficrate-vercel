import { NextRequest, NextResponse } from 'next/server'

const TAVILY_API_URL = 'https://api.tavily.com/search'

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')
    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      console.error('TAVILY_API_KEY is not set')
      return NextResponse.json({ error: 'Search API not configured', results: [] }, { status: 500 })
    }

    // Build a search query optimized for finding CC-licensed lofi music
    const searchQuery = `${query} free lofi music creative commons CC license download`

    const response = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: searchQuery,
        search_depth: 'advanced',
        include_answer: true,
        include_raw_content: false,
        max_results: 10,
        // Focus on music-related sites
        include_domains: [
          'freemusicarchive.org',
          'soundcloud.com',
          'pixabay.com',
          'mixkit.co',
          'incompetech.com',
          'bensound.com',
          'chosic.com',
          'youtube.com',
          'bandcamp.com',
          'ccmixter.org',
          'freesound.org',
          'jamendo.com',
          'audionautix.com',
          'publicdomain4u.com',
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Tavily API error:', response.status, errorText)
      return NextResponse.json({ error: 'Search API request failed', results: [] }, { status: 500 })
    }

    const data = await response.json()

    // Transform Tavily results to our format
    const results = (data.results || []).map(
      (r: { title?: string; url?: string; content?: string; score?: number }) => ({
        name: r.title || 'Untitled',
        url: r.url || '',
        snippet: r.content || '',
        score: r.score || 0,
      })
    )

    // Include the AI answer if available
    const answer = data.answer || null

    return NextResponse.json({ results, answer })
  } catch (error) {
    console.error('Web search error:', error)
    return NextResponse.json(
      { error: 'Web search failed', results: [] },
      { status: 500 }
    )
  }
}
