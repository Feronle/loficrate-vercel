'use client'

import { useState, useRef } from 'react'

const GENRES = ['lofi-hiphop','chillhop','lofi-jazz','lofi-ambient','lofi-chill','lofi-study','vaporwave','downtempo','dream-pop','ambient']
const MOODS = ['calm','dreamy','nostalgic','cozy','focused','romantic','melancholic','peaceful','sad','uplifting']
const TEMPOS = ['slow','medium','fast']
const INSTRS = ['piano','guitar','synth','drums','sax','flute','violin','mixed']
const LICS = ['CC0','CC-BY-3.0','CC-BY-4.0','CC-BY-SA','CC-BY-NC','Royalty-Free']
const PLATFORMS = [
  { value: '', label: 'All platforms' },
  { value: 'youtube.com', label: 'YouTube' },
  { value: 'music.youtube.com', label: 'YouTube Music' },
  { value: 'freemusicarchive.org', label: 'Free Music Archive' },
  { value: 'soundcloud.com', label: 'SoundCloud' },
  { value: 'pixabay.com', label: 'Pixabay' },
  { value: 'incompetech.com', label: 'Incompetech' },
  { value: 'bensound.com', label: 'Bensound' },
  { value: 'chosic.com', label: 'Chosic' },
  { value: 'ccmixter.org', label: 'ccMixter' },
  { value: 'freesound.org', label: 'Freesound' },
  { value: 'jamendo.com', label: 'Jamendo' },
  { value: 'bandcamp.com', label: 'Bandcamp' },
]

interface Track {
  id: string
  title: string
  artist: string
  url: string
  license: string
  source: string
  duration: number
  genre: string
  mood: string
  ytId?: string
  snippet?: string
}

function fmtTime(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}` : `${m}:${String(ss).padStart(2,'0')}`
}

function isYT(url: string) {
  try { const h = new URL(url).hostname.replace('www.',''); return h === 'youtube.com' || h === 'music.youtube.com' || h === 'youtu.be' } catch { return false }
}

function getYTId(url: string) {
  try { const u = new URL(url); return u.searchParams.get('v') || (u.hostname === 'youtu.be' ? u.pathname.slice(1) : '') } catch { return '' }
}

function guesslicense(t: string) {
  if (/CC0|public.?domain/i.test(t)) return 'CC0'
  if (/CC.BY.SA/i.test(t)) return 'CC-BY-SA'
  if (/CC.BY.NC/i.test(t)) return 'CC-BY-NC'
  if (/CC.BY.4/i.test(t)) return 'CC-BY-4.0'
  if (/CC.BY.3/i.test(t)) return 'CC-BY-3.0'
  if (/CC.BY/i.test(t)) return 'CC-BY'
  if (/creative.commons/i.test(t)) return 'CC'
  if (/royalty.free/i.test(t)) return 'Royalty-Free'
  return 'verify license'
}

function extractArtist(title: string) {
  const m = title.match(/\sby\s+([^|–\-\[\(]+)/i)
  if (m) return m[1].trim()
  const d = title.match(/^(.+?)\s*[–\-]\s*/)
  if (d && d[1].length < 40) return d[1].trim()
  return ''
}

function licColor(lic: string) {
  if (lic === 'verify license') return 'bg-amber-100 text-amber-800'
  if (lic.startsWith('CC') || lic === 'Royalty-Free') return 'bg-green-100 text-green-800'
  return 'bg-gray-100 text-gray-600'
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
      active ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800'
    }`}>{label}</button>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>
}

export default function LofiCrateApp() {
  const [tab, setTab] = useState<'search' | 'upload' | 'playlist'>('search')
  const [filters, setFilters] = useState({ genre: '', mood: '', tempo: '', instrument: '', license: '', platform: '', ytSafe: true })
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Track[]>([])
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [excludedUrls, setExcludedUrls] = useState<Set<string>>(new Set())
  const [uploadedTracks, setUploadedTracks] = useState<Track[]>([])
  const [playlistName, setPlaylistName] = useState('My Lofi Playlist')
  const [targetMin, setTargetMin] = useState(60)
  const [showExport, setShowExport] = useState(false)
  const [exportText, setExportText] = useState('')
  const [copied, setCopied] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const setFilter = (k: string, v: string | boolean) => setFilters(f => ({ ...f, [k]: v }))

  const buildQuery = () => {
    let q = query || 'lofi music'
    if (filters.genre) q += ' ' + filters.genre.replace(/-/g, ' ')
    if (filters.mood) q += ' ' + filters.mood + ' mood'
    if (filters.tempo) q += ' ' + filters.tempo + ' tempo'
    if (filters.instrument) q += ' ' + filters.instrument
    if (filters.license) q += ' "' + filters.license + '" license'
    const isYTPlatform = filters.platform === 'youtube.com' || filters.platform === 'music.youtube.com'
    if (isYTPlatform) {
      q += ' creative commons license lofi music curator playlist'
    } else {
      q += ' free download creative commons'
      if (filters.ytSafe) q += ' royalty free youtube safe'
    }
    return q
  }

  const doSearch = async () => {
    setSearching(true)
    setError('')
    setResults([])
    setSummary('')
    try {
      const q = buildQuery()
      const params = new URLSearchParams({ q })
      if (filters.platform) params.set('platform', filters.platform)
      const resp = await fetch(`/api/search-web?${params}`)
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Search failed')
      if (data.answer) setSummary(data.answer)
      const mapped: Track[] = (data.results || [])
        .filter((r: { url: string }) => !excludedUrls.has(r.url))
        .map((r: { name?: string; url: string; snippet?: string }, i: number) => {
          const artist = extractArtist(r.name || '')
          const lic = guesslicense((r.snippet || '') + (r.name || ''))
          const src = (() => { try { return new URL(r.url).hostname.replace('www.', '') } catch { return '' } })()
          const ytId = isYT(r.url) ? getYTId(r.url) : ''
          return { id: 'r' + Date.now() + i, title: r.name || 'Track', artist, url: r.url, snippet: r.snippet || '', license: lic, source: src, duration: 0, genre: filters.genre, mood: filters.mood, ytId }
        })
      setResults(mapped)
      if (!mapped.length) setError('No results found. Try different keywords or filters.')
    } catch (e: unknown) {
      setError('Error: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
    setSearching(false)
  }

  const addToPlaylist = (t: Track) => {
    if (playlist.some(p => p.url === t.url && t.url)) return
    setPlaylist(p => [...p, { ...t, id: 'p' + Date.now() }])
  }

  const removeFromPlaylist = (id: string) => setPlaylist(p => p.filter(t => t.id !== id))
  const moveTrack = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= playlist.length) return
    const p = [...playlist];
    [p[i], p[j]] = [p[j], p[i]]
    setPlaylist(p)
  }
  const shuffle = () => {
    const a = [...playlist]
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
    setPlaylist(a)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      const lines = (ev.target?.result as string).split('\n').map(l => l.trim()).filter(Boolean)
      const tracks: Track[] = lines.map((line, i) => {
        const ts = line.match(/^(\d+:\d+(?::\d+)?)\s+(.+)$/)
        const rest = ts ? ts[2] : line
        const byM = rest.match(/^(.+?)\s+by\s+(.+)$/i)
        const dashM = rest.match(/^(.+?)\s+-\s+(.+)$/)
        let title = rest, artist = ''
        if (byM) { title = byM[1].trim(); artist = byM[2].trim() }
        else if (dashM) { artist = dashM[1].trim(); title = dashM[2].trim() }
        return { id: 'u' + i + Date.now(), title, artist, url: '', license: 'CC', source: 'uploaded', duration: 0, genre: '', mood: '' }
      })
      setUploadedTracks(tracks)
      setExcludedUrls(s => { const n = new Set(s); tracks.forEach(t => { if (t.url) n.add(t.url) }); return n })
    }
    reader.readAsText(f)
  }

  const totalSec = playlist.reduce((s, t) => s + (t.duration || 0), 0)
  const targetSec = targetMin * 60

  const generateExport = () => {
    const genre = playlist.map(t => t.genre).filter(Boolean)[0] || 'lofi'
    const mood = playlist.map(t => t.mood).filter(Boolean)[0] || 'chill'
    let ts = 0
    const tracklist = playlist.map(t => { const time = fmtTime(ts); ts += t.duration || 180; return `${time} ${t.title}${t.artist ? ' – ' + t.artist : ''}` }).join('\n')
    const credits = playlist.map(t => `• ${t.title}${t.artist ? ' by ' + t.artist : ''} [${t.license || 'CC'}]${t.url ? '\n  ' + t.url : ''}`).join('\n')
    const tags = [...new Set(['#lofi', '#lofihiphop', '#chillhop', '#' + genre.replace(/-/g, ''), '#' + mood, '#studymusic', '#relaxingmusic', '#creativecommons', '#copyrightfree', '#nocopyright'])].join(' ')
    setExportText([`🎵 ${playlistName}`, '', `Perfect ${mood} ${genre.replace(/-/g, ' ')} music for studying, working, or relaxing.`, '', '📋 TRACKLIST:', tracklist, '', '📜 CREDITS & LICENSES:', credits, '', '⚠️ Please verify each track\'s license before monetizing.', '', '━━━━━━━━━━━━━━━━━━━━━━━', tags].join('\n'))
    setShowExport(true)
  }

  const copyExport = () => {
    navigator.clipboard.writeText(exportText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm">L</div>
        <span className="font-semibold text-lg">LofiCrate</span>
        <span className="text-sm text-gray-400">CC music finder & playlist builder</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {(['search', 'upload', 'playlist'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'playlist' ? `Playlist${playlist.length ? ` (${playlist.length})` : ''}` : t === 'search' ? '🔍 Search' : '📄 Upload .txt'}
            </button>
          ))}
        </div>

        {tab === 'search' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="flex gap-3">
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
                  placeholder='Search CC lofi music... e.g. "rainy jazz piano"'
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                <button onClick={doSearch} disabled={searching}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all">
                  {searching ? 'Searching...' : 'Search web'}
                </button>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Genre</label>
                <div className="flex flex-wrap gap-1.5">{GENRES.map(g => <Chip key={g} label={g} active={filters.genre === g} onClick={() => setFilter('genre', filters.genre === g ? '' : g)} />)}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Mood</label>
                <div className="flex flex-wrap gap-1.5">{MOODS.map(m => <Chip key={m} label={m} active={filters.mood === m} onClick={() => setFilter('mood', filters.mood === m ? '' : m)} />)}</div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Tempo</label>
                  <div className="flex gap-1.5">{TEMPOS.map(t => <Chip key={t} label={t} active={filters.tempo === t} onClick={() => setFilter('tempo', filters.tempo === t ? '' : t)} />)}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Instrument</label>
                  <div className="flex flex-wrap gap-1.5">{INSTRS.map(i => <Chip key={i} label={i} active={filters.instrument === i} onClick={() => setFilter('instrument', filters.instrument === i ? '' : i)} />)}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">License</label>
                  <div className="flex flex-wrap gap-1.5">{LICS.map(l => <Chip key={l} label={l} active={filters.license === l} onClick={() => setFilter('license', filters.license === l ? '' : l)} />)}</div>
                </div>
              </div>
              <div className="flex gap-6 items-center flex-wrap">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Platform</label>
                  <select value={filters.platform} onChange={e => setFilter('platform', e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <div className="relative">
                    <input type="checkbox" checked={filters.ytSafe} onChange={e => setFilter('ytSafe', e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-checked:bg-teal-600 rounded-full transition-all" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-gray-600">YouTube safe only</span>
                </label>
              </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}
            {summary && <div className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3"><strong className="text-gray-800">Summary: </strong>{summary}</div>}

            <div className="space-y-3">
              {results.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {r.ytId && <Badge label="YouTube" color="bg-red-100 text-red-700" />}
                        <span className="font-semibold text-sm">{r.title}</span>
                      </div>
                      {r.artist && <div className="text-xs text-gray-500 mb-2">by {r.artist}</div>}
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:text-teal-800 block truncate mb-2">{r.url}</a>
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {r.source && <Badge label={r.source} color="bg-gray-100 text-gray-600" />}
                        <Badge label={r.license} color={licColor(r.license)} />
                        {r.genre && <Badge label={r.genre} color="bg-blue-100 text-blue-700" />}
                        {r.mood && <Badge label={r.mood} color="bg-amber-100 text-amber-700" />}
                      </div>
                      {r.snippet && <p className="text-xs text-gray-400 line-clamp-2">{r.snippet}</p>}
                      {r.ytId && (
                        <button onClick={() => setPreviewId(previewId === r.id ? null : r.id)} className="mt-2 text-xs text-teal-600 hover:text-teal-800">
                          {previewId === r.id ? 'Hide preview' : 'Preview on YouTube'}
                        </button>
                      )}
                      {previewId === r.id && r.ytId && (
                        <div className="mt-2 rounded-xl overflow-hidden">
                          <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${r.ytId}`} frameBorder="0" allowFullScreen />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => addToPlaylist(r)} disabled={playlist.some(p => p.url === r.url)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg text-xs transition-all">
                        {playlist.some(p => p.url === r.url) ? '✓ Added' : '+ Playlist'}
                      </button>
                      <button onClick={() => { setExcludedUrls(s => new Set([...s, r.url])); setResults(rs => rs.filter(x => x.url !== r.url)) }}
                        className="px-3 py-1.5 text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg text-xs transition-all">
                        Exclude
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'upload' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-sm font-medium mb-1">Upload .txt tracklist</p>
              <p className="text-xs text-gray-400 mb-4">Formats: "0:00 Title by Artist", "Artist - Title", or one track per line. Uploaded tracks are excluded from searches to avoid duplicates.</p>
              <input ref={fileRef} type="file" accept=".txt,.csv" onChange={handleFile} className="text-sm" />
              {uploadedTracks.length > 0 && <p className="mt-3 text-xs text-teal-700 bg-teal-50 px-3 py-2 rounded-lg">{uploadedTracks.length} tracks parsed — excluded from new searches</p>}
            </div>
            {uploadedTracks.map((t, i) => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium text-sm">{t.title}</div>
                  {t.artist && <div className="text-xs text-gray-500">{t.artist}</div>}
                </div>
                <button onClick={() => addToPlaylist({ ...t, id: 'u' + Date.now() + i })} className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs">+ Playlist</button>
                <button onClick={() => setUploadedTracks(u => u.filter((_, j) => j !== i))} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'playlist' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex gap-3 mb-4 flex-wrap">
                <input value={playlistName} onChange={e => setPlaylistName(e.target.value)}
                  className="flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <select value={targetMin} onChange={e => setTargetMin(+e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
              <div className="flex justify-between items-center flex-wrap gap-3">
                <span className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">{playlist.length}</span> tracks ·{' '}
                  <span className={totalSec > targetSec ? 'text-amber-600' : 'text-gray-500'}>{fmtTime(totalSec)}</span>
                  <span className="text-gray-300"> / {fmtTime(targetSec)}</span>
                </span>
                <div className="flex gap-2">
                  <button onClick={shuffle} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">Shuffle</button>
                  <button onClick={() => { if (confirm('Clear playlist?')) setPlaylist([]) }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-red-500 hover:bg-red-50">Clear</button>
                  <button onClick={generateExport} disabled={!playlist.length}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-medium rounded-lg text-xs">
                    Export for YouTube
                  </button>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${Math.min((totalSec / targetSec) * 100, 100)}%` }} />
              </div>
            </div>

            {playlist.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">🎧</div>
                <div className="text-sm">No tracks yet</div>
                <div className="text-xs mt-1">Search for music or upload a tracklist</div>
                <button onClick={() => setTab('search')} className="mt-4 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm hover:bg-teal-100">Go to Search →</button>
              </div>
            ) : (
              <div className="space-y-2">
                {playlist.map((t, i) => (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {t.artist && <span className="text-xs text-gray-400">{t.artist}</span>}
                        {t.url && <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">{t.ytId ? 'YouTube' : 'link'}</a>}
                        <Badge label={t.license || 'CC'} color={licColor(t.license)} />
                        {t.source && <Badge label={t.source} color="bg-gray-100 text-gray-500" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input type="number" min="0" placeholder="sec" value={t.duration || ''}
                        onChange={e => setPlaylist(p => p.map((x, j) => j === i ? { ...x, duration: +e.target.value } : x))}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none" title="Duration in seconds" />
                      <button onClick={() => moveTrack(i, -1)} className="p-1 text-gray-400 hover:text-gray-700">↑</button>
                      <button onClick={() => moveTrack(i, 1)} className="p-1 text-gray-400 hover:text-gray-700">↓</button>
                      <button onClick={() => removeFromPlaylist(t.id)} className="p-1 text-gray-400 hover:text-red-500">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">YouTube description</span>
              <div className="flex gap-2">
                <button onClick={copyExport} className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-sm">{copied ? '✓ Copied!' : 'Copy all'}</button>
                <button onClick={() => setShowExport(false)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">Close</button>
              </div>
            </div>
            <textarea value={exportText} readOnly rows={16}
              className="font-mono text-xs border border-gray-200 rounded-xl p-4 bg-gray-50 resize-none flex-1 focus:outline-none" />
          </div>
        </div>
      )}
    </div>
  )
}
