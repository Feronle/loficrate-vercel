'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Upload, Shuffle, Play, Pause, Plus, Trash2, Wand2,
  Clock, Music, ChevronDown, ChevronUp, Volume2, ExternalLink,
  Sparkles, RefreshCw, Download, Copy, Check, Layers
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useLofiCrateStore, Track, UploadedTrack } from '@/lib/store'
import { formatDuration, formatTimestamp, getLicenseColor, isLicenseIncompatible } from '@/lib/helpers'
import { toast } from 'sonner'

// --- Types ---
interface ParsedTrack {
  title: string
  artist: string
  source: string
  matchedTrack?: Track
  genre?: string
  mood?: string
  tempo?: string
  instrument?: string
  durationSec?: number
  licenseType?: string
  licenseUrl?: string
  sourceUrl?: string
  sourcePlatform?: string
  isYoutubeSafe?: boolean
}

interface GeneratedPlaylist {
  id: string
  name: string
  tracks: ParsedTrack[]
  totalDuration: number
  theme: string
  shuffled: boolean
}

// --- Helpers ---
const GENRES = ['lofi-hiphop', 'lofi-chill', 'lofi-ambient', 'lofi-jazz', 'lofi-study', 'chillhop', 'vaporwave', 'downtempo', 'dream-pop', 'ambient']
const MOODS = ['calm', 'melancholic', 'peaceful', 'dreamy', 'nostalgic', 'cozy', 'focused', 'romantic', 'sad', 'uplifting']
const TEMPOS = ['slow', 'medium', 'fast']
const INSTRUMENTS = ['piano', 'guitar', 'synth', 'drums', 'sax', 'flute', 'violin', 'mixed']

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function parsePlaylistFile(text: string, fileName: string): ParsedTrack[] {
  const lines = text.split('\n').filter((l) => l.trim())
  const parsed: ParsedTrack[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed.startsWith('===')) continue

    // "0:00 — Track by Artist"
    const tsMatch = trimmed.match(/^\d{1,2}:\d{2}(?::\d{2})?\s*[—\-–]\s*(.+)$/)
    if (tsMatch) {
      const rest = tsMatch[1].trim()
      const bySplit = rest.split(/\s+by\s+/i)
      if (bySplit.length >= 2) {
        parsed.push({ title: bySplit[0].trim().replace(/^["']|["']$/g, ''), artist: bySplit.slice(1).join(' by ').trim(), source: fileName })
        continue
      }
      const dashSplit = rest.split(/\s+[—\-–]\s+/)
      if (dashSplit.length >= 2) {
        parsed.push({ title: dashSplit[1].trim().replace(/^["']|["']$/g, ''), artist: dashSplit[0].trim(), source: fileName })
        continue
      }
      parsed.push({ title: rest.replace(/^["']|["']$/g, ''), artist: 'Unknown', source: fileName })
      continue
    }

    // "Track by Artist" without timestamp
    const byMatch = trimmed.match(/^(.+?)\s+by\s+(.+)$/i)
    if (byMatch && !trimmed.match(/^\d/)) {
      parsed.push({ title: byMatch[1].trim().replace(/^["']|["']$/g, ''), artist: byMatch[2].trim(), source: fileName })
      continue
    }

    // "Artist - Track" format
    const dashMatch = trimmed.match(/^(.+?)\s+[—\-–]\s+(.+)$/)
    if (dashMatch && !trimmed.match(/^\d/)) {
      parsed.push({ title: dashMatch[2].trim().replace(/^["']|["']$/g, ''), artist: dashMatch[1].trim(), source: fileName })
      continue
    }

    if (trimmed.length > 2 && trimmed.length < 200) {
      parsed.push({ title: trimmed.replace(/^["']|["']$/g, ''), artist: 'Unknown', source: fileName })
    }
  }

  return parsed
}

function matchTrackFromDB(pt: ParsedTrack, dbTracks: Track[]): Track | undefined {
  const titleLower = pt.title.toLowerCase().trim()
  const artistLower = pt.artist.toLowerCase().trim()

  // Exact match on title + artist
  let match = dbTracks.find(
    (t) => t.title.toLowerCase().trim() === titleLower && t.artist.toLowerCase().trim() === artistLower
  )
  if (match) return match

  // Fuzzy match on title (contains)
  match = dbTracks.find(
    (t) => t.title.toLowerCase().includes(titleLower) || titleLower.includes(t.title.toLowerCase())
  )
  if (match) return match

  // Fuzzy match on artist + partial title
  match = dbTracks.find(
    (t) => t.artist.toLowerCase().includes(artistLower) && (t.title.toLowerCase().includes(titleLower.substring(0, 5)) || titleLower.substring(0, 5).includes(t.title.toLowerCase().substring(0, 5)))
  )
  return match
}

function assignDefaults(pt: ParsedTrack): ParsedTrack {
  return {
    ...pt,
    genre: pt.genre || pt.matchedTrack?.genre || 'lofi-chill',
    mood: pt.mood || pt.matchedTrack?.mood || 'calm',
    tempo: pt.tempo || pt.matchedTrack?.tempo || 'slow',
    instrument: pt.instrument || pt.matchedTrack?.instrument || 'mixed',
    durationSec: pt.durationSec || pt.matchedTrack?.durationSec || 200,
    licenseType: pt.licenseType || pt.matchedTrack?.licenseType || 'CC-BY-4.0',
    licenseUrl: pt.licenseUrl || pt.matchedTrack?.licenseUrl || 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: pt.sourceUrl || pt.matchedTrack?.sourceUrl || '',
    sourcePlatform: pt.sourcePlatform || pt.matchedTrack?.sourcePlatform || 'Other',
    isYoutubeSafe: pt.isYoutubeSafe ?? pt.matchedTrack?.isYoutubeSafe ?? true,
  }
}

// --- Sub-components ---

function ParsedTrackRow({ pt, index, onPlay }: { pt: ParsedTrack; index: number; onPlay: (pt: ParsedTrack) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isMatched = !!pt.matchedTrack
  const hasFullInfo = pt.genre && pt.mood && pt.tempo && pt.durationSec

  return (
    <div className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
      isMatched
        ? 'border-emerald-900/30 bg-emerald-950/10'
        : 'border-amber-900/30 bg-amber-950/10'
    }`}>
      <div className="flex items-center gap-2">
        <span className="w-5 text-right tabular-nums text-purple-300/40">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-white">{pt.title}</span>
            {isMatched ? (
              <Badge variant="outline" className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-[8px] text-emerald-400">matched</Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 border-amber-500/30 bg-amber-500/10 text-[8px] text-amber-400">unmatched</Badge>
            )}
            {hasFullInfo && (
              <Badge variant="outline" className="shrink-0 border-purple-500/30 bg-purple-500/10 text-[8px] text-purple-300">enriched</Badge>
            )}
          </div>
          <p className="truncate text-[10px] text-purple-300/50">{pt.artist}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {pt.durationSec && (
            <span className="text-[10px] tabular-nums text-purple-300/50">{formatDuration(pt.durationSec)}</span>
          )}
          <button
            onClick={() => onPlay(pt)}
            className="flex h-5 w-5 items-center justify-center rounded text-emerald-400/60 hover:bg-emerald-500/10 hover:text-emerald-300"
            title="Listen (прослушать)"
          >
            <Play className="h-3 w-3" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-5 w-5 items-center justify-center rounded text-purple-400/50 hover:bg-purple-500/10 hover:text-purple-300"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-1.5 space-y-1 border-t border-purple-900/10 pt-1.5">
          <div className="flex flex-wrap gap-1">
            {pt.genre && <Badge variant="outline" className="border-purple-800/30 bg-purple-500/10 text-[9px] text-purple-300">{pt.genre}</Badge>}
            {pt.mood && <Badge variant="outline" className="border-purple-800/30 bg-purple-500/10 text-[9px] text-purple-300">{pt.mood}</Badge>}
            {pt.tempo && <Badge variant="outline" className="border-slate-700/30 bg-slate-500/10 text-[9px] text-slate-400">{pt.tempo}</Badge>}
            {pt.instrument && <Badge variant="outline" className="border-slate-700/30 bg-slate-500/10 text-[9px] text-slate-400">{pt.instrument}</Badge>}
            {pt.licenseType && <Badge variant="outline" className={`border text-[9px] ${getLicenseColor(pt.licenseType)}`}>{pt.licenseType}</Badge>}
          </div>
          {pt.sourceUrl && (
            <div className="text-[10px]">
              <span className="text-purple-300/40">Source:</span>{' '}
              <a href={pt.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400/70 hover:text-amber-300">
                Link <ExternalLink className="inline h-2 w-2" />
              </a>
            </div>
          )}
          <div className="text-[10px] text-purple-300/30">from: {pt.source}</div>
        </div>
      )}
    </div>
  )
}

function GeneratedPlaylistCard({
  playlist,
  onShuffle,
  onPlay,
  onExport,
  onAddToBuilder,
}: {
  playlist: GeneratedPlaylist
  onShuffle: (id: string) => void
  onPlay: (pt: ParsedTrack) => void
  onExport: (playlist: GeneratedPlaylist) => void
  onAddToBuilder: (playlist: GeneratedPlaylist) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const durationPercent = Math.min((playlist.totalDuration / 3600) * 100, 100)
  const getProgressColor = () => {
    if (playlist.totalDuration > 4320) return 'bg-rose-500'
    if (playlist.totalDuration > 3600) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="rounded-lg border border-purple-900/30 bg-slate-950/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-white">{playlist.name}</h4>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-purple-300/50">
            <Clock className="h-3 w-3" />
            <span className="tabular-nums">{formatDuration(playlist.totalDuration)}</span>
            <span>•</span>
            <span>{playlist.tracks.length} tracks</span>
            <span>•</span>
            <span className="text-purple-300/30">{playlist.theme}</span>
          </div>
          {/* Duration progress bar */}
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-900">
            <div className={`h-full rounded-full transition-all ${getProgressColor()}`} style={{ width: `${durationPercent}%` }} />
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-purple-400/50 hover:bg-purple-500/10 hover:text-purple-300"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {playlist.tracks.map((pt, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded bg-slate-950/40 px-2 py-1 text-[11px]">
              <span className="w-4 text-right tabular-nums text-purple-300/30">{i + 1}</span>
              <span className="w-8 tabular-nums text-amber-400/50">
                {(() => {
                  let t = 0
                  for (let j = 0; j < i; j++) t += playlist.tracks[j]?.durationSec || 0
                  return formatTimestamp(t)
                })()}
              </span>
              <span className="min-w-0 flex-1 truncate text-purple-200/80">{pt.title}</span>
              <span className="text-[10px] text-purple-300/40">{pt.artist}</span>
              <button onClick={() => onPlay(pt)} className="shrink-0 text-emerald-400/50 hover:text-emerald-300">
                <Play className="h-3 w-3" />
              </button>
            </div>
          ))}

          <div className="flex flex-wrap gap-1.5 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-purple-900/30 bg-slate-950/50 text-xs text-purple-300 hover:text-purple-100"
              onClick={() => onShuffle(playlist.id)}
            >
              <Shuffle className="mr-1 h-3 w-3" />
              Shuffle <span className="ml-0.5 text-[8px] text-purple-300/40">(перемешать)</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-purple-900/30 bg-slate-950/50 text-xs text-purple-300 hover:text-purple-100"
              onClick={() => onAddToBuilder(playlist)}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add to Builder <span className="ml-0.5 text-[8px] text-purple-300/40">(в конструктор)</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-amber-900/30 bg-slate-950/50 text-xs text-amber-400 hover:text-amber-300"
              onClick={() => onExport(playlist)}
            >
              <Download className="mr-1 h-3 w-3" />
              Export <span className="ml-0.5 text-[8px] text-amber-400/40">(экспорт)</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main Component ---
export function PlaylistGenerator() {
  const { tracks: dbTracks, fetchTracks } = useLofiCrateStore()
  const [parsedTracks, setParsedTracks] = useState<ParsedTrack[]>([])
  const [generatedPlaylists, setGeneratedPlaylists] = useState<GeneratedPlaylist[]>([])
  const [matchedCount, setMatchedCount] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [distributionMode, setDistributionMode] = useState<'mood' | 'genre' | 'tempo' | 'mixed'>('mixed')
  const [targetDuration, setTargetDuration] = useState(3600)
  const [numVariants, setNumVariants] = useState(3)
  const [shuffleOnGenerate, setShuffleOnGenerate] = useState(true)
  const [showTrackList, setShowTrackList] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [exportedPlaylist, setExportedPlaylist] = useState<GeneratedPlaylist | null>(null)
  const [copied, setCopied] = useState(false)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    let allParsed: ParsedTrack[] = []

    const processFile = (file: File) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          if (text) {
            const parsed = parsePlaylistFile(text, file.name)
            allParsed = [...allParsed, ...parsed]
          }
          resolve()
        }
        reader.readAsText(file)
      })
    }

    Promise.all(Array.from(files).map(processFile)).then(() => {
      if (allParsed.length > 0) {
        // Match against DB tracks
        let matchCount = 0
        const enriched = allParsed.map((pt) => {
          const match = matchTrackFromDB(pt, dbTracks)
          if (match) matchCount++
          const withMatch = { ...pt, matchedTrack: match }
          return assignDefaults(withMatch)
        })
        setParsedTracks(enriched)
        setMatchedCount(matchCount)
        setGeneratedPlaylists([])
        toast.success(`Loaded ${enriched.length} tracks (${matchCount} matched with DB)`)
      } else {
        toast.warning('Could not parse any tracks from the files')
      }
    })
  }, [dbTracks])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleEnrichWithAI = async () => {
    if (parsedTracks.length === 0) return
    setIsEnriching(true)

    try {
      // Enrich unmatched tracks using Tavily web search
      const unmatched = parsedTracks.filter((pt) => !pt.matchedTrack)
      if (unmatched.length === 0) {
        toast.info('All tracks are already matched!')
        setIsEnriching(false)
        return
      }

      let enrichedCount = 0
      for (const pt of unmatched.slice(0, 5)) {
        try {
          const searchQuery = `"${pt.title}" "${pt.artist}" free music creative commons license`
          const response = await fetch(`/api/search-web?q=${encodeURIComponent(searchQuery)}`)
          const data = await response.json()

          if (data.results && data.results.length > 0) {
            const bestResult = data.results[0]
            if (bestResult.url) {
              pt.sourceUrl = bestResult.url
              pt.sourcePlatform = new URL(bestResult.url).hostname.replace('www.', '').split('.')[0]
              enrichedCount++
            }
          }
        } catch {
          // Skip individual search failures
        }
      }

      setParsedTracks([...parsedTracks])
      toast.success(`Enriched ${enrichedCount} tracks with web search data`)
    } catch {
      toast.error('Failed to enrich tracks')
    } finally {
      setIsEnriching(false)
    }
  }

  const handleGenerate = () => {
    if (parsedTracks.length === 0) {
      toast.warning('Upload playlist files first')
      return
    }

    setIsGenerating(true)

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const playlists: GeneratedPlaylist[] = []
      const usableTracks = parsedTracks.filter((pt) => pt.durationSec && pt.durationSec > 0)

      if (usableTracks.length === 0) {
        toast.error('No tracks with duration info available')
        setIsGenerating(false)
        return
      }

      for (let v = 0; v < numVariants; v++) {
        let variantTracks: ParsedTrack[] = []

        if (distributionMode === 'mixed') {
          // Distribute tracks evenly across moods/genres for variety
          const byMood: Record<string, ParsedTrack[]> = {}
          for (const pt of usableTracks) {
            const mood = pt.mood || 'calm'
            if (!byMood[mood]) byMood[mood] = []
            byMood[mood].push(pt)
          }

          // Round-robin pick from each mood group
          const moodGroups = Object.values(byMood)
          const shuffledGroups = shuffleArray(moodGroups.map(g => shuffleArray(g)))

          let groupIdx = 0
          let totalSec = 0
          const used = new Set<string>()

          while (totalSec < targetDuration && used.size < usableTracks.length) {
            for (const group of shuffledGroups) {
              const available = group.filter((t) => !used.has(`${t.title}||${t.artist}`))
              if (available.length > 0) {
                const pick = available[v % available.length] || available[0]
                variantTracks.push(pick)
                used.add(`${pick.title}||${pick.artist}`)
                totalSec += pick.durationSec || 200
                if (totalSec >= targetDuration) break
              }
            }
            groupIdx++
            if (groupIdx > 100) break // Safety
          }
        } else if (distributionMode === 'mood') {
          // Create playlists grouped by mood
          const moods = [...new Set(usableTracks.map((t) => t.mood || 'calm'))]
          const selectedMood = moods[v % moods.length]
          const moodTracks = usableTracks.filter((t) => (t.mood || 'calm') === selectedMood)
          const shuffled = shuffleArray(moodTracks)
          let totalSec = 0
          for (const pt of shuffled) {
            if (totalSec + (pt.durationSec || 200) > targetDuration * 1.1) break
            variantTracks.push(pt)
            totalSec += pt.durationSec || 200
          }
        } else if (distributionMode === 'genre') {
          const genres = [...new Set(usableTracks.map((t) => t.genre || 'lofi-chill'))]
          const selectedGenre = genres[v % genres.length]
          const genreTracks = usableTracks.filter((t) => (t.genre || 'lofi-chill') === selectedGenre)
          const shuffled = shuffleArray(genreTracks)
          let totalSec = 0
          for (const pt of shuffled) {
            if (totalSec + (pt.durationSec || 200) > targetDuration * 1.1) break
            variantTracks.push(pt)
            totalSec += pt.durationSec || 200
          }
        } else if (distributionMode === 'tempo') {
          const tempos = [...new Set(usableTracks.map((t) => t.tempo || 'slow'))]
          const selectedTempo = tempos[v % tempos.length]
          const tempoTracks = usableTracks.filter((t) => (t.tempo || 'slow') === selectedTempo)
          const shuffled = shuffleArray(tempoTracks)
          let totalSec = 0
          for (const pt of shuffled) {
            if (totalSec + (pt.durationSec || 200) > targetDuration * 1.1) break
            variantTracks.push(pt)
            totalSec += pt.durationSec || 200
          }
        }

        // Fill remaining time with random tracks if needed
        let totalSec = variantTracks.reduce((s, t) => s + (t.durationSec || 200), 0)
        if (totalSec < targetDuration * 0.8) {
          const used = new Set(variantTracks.map((t) => `${t.title}||${t.artist}`))
          const remaining = shuffleArray(usableTracks.filter((t) => !used.has(`${t.title}||${t.artist}`)))
          for (const pt of remaining) {
            if (totalSec >= targetDuration) break
            variantTracks.push(pt)
            totalSec += pt.durationSec || 200
          }
        }

        if (shuffleOnGenerate) {
          variantTracks = shuffleArray(variantTracks)
        }

        const theme = distributionMode === 'mixed'
          ? 'Mixed Vibes'
          : distributionMode === 'mood'
            ? variantTracks[0]?.mood || 'Calm'
            : distributionMode === 'genre'
              ? variantTracks[0]?.genre || 'Lofi'
              : variantTracks[0]?.tempo || 'Slow'

        playlists.push({
          id: `gen-${v}-${Date.now()}`,
          name: `${theme} Mix #${v + 1}`,
          tracks: variantTracks,
          totalDuration: variantTracks.reduce((s, t) => s + (t.durationSec || 200), 0),
          theme,
          shuffled: shuffleOnGenerate,
        })
      }

      setGeneratedPlaylists(playlists)
      setIsGenerating(false)
      toast.success(`Generated ${playlists.length} playlist variants!`)
    }, 100)
  }

  const handleShufflePlaylist = (id: string) => {
    setGeneratedPlaylists((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, tracks: shuffleArray(p.tracks), shuffled: true }
          : p
      )
    )
    toast.success('Playlist shuffled!')
  }

  const handlePlayTrack = (pt: ParsedTrack) => {
    if (playingTrack === pt.title && audioRef.current) {
      audioRef.current.pause()
      setPlayingTrack(null)
      return
    }

    const url = pt.sourceUrl || pt.matchedTrack?.sourceUrl
    if (url) {
      if (audioRef.current) audioRef.current.pause()
      const directAudioPatterns = ['.mp3', '.wav', '.ogg', '.m4a', '/stream', '/download']
      const isDirectAudio = directAudioPatterns.some(p => url.toLowerCase().includes(p))

      if (isDirectAudio) {
        const audio = new Audio(url)
        audio.addEventListener('ended', () => setPlayingTrack(null))
        audio.addEventListener('error', () => {
          setPlayingTrack(null)
          window.open(url, '_blank')
        })
        audio.play().then(() => setPlayingTrack(pt.title)).catch(() => {
          setPlayingTrack(null)
          window.open(url, '_blank')
        })
        audioRef.current = audio
      } else {
        window.open(url, '_blank')
      }
    } else {
      toast.info('No source URL available for this track')
    }
  }

  const handleExport = (playlist: GeneratedPlaylist) => {
    setExportedPlaylist(playlist)
  }

  const generateExportText = (playlist: GeneratedPlaylist): string => {
    const lines: string[] = []
    lines.push(`🌙 Lofi Radio • ${playlist.theme} Beats to Study/Relax to [${formatDuration(playlist.totalDuration)}]`)
    lines.push('')
    lines.push(`A curated ${playlist.theme.toLowerCase()} playlist perfect for studying, relaxing, and chilling.`)
    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('🎵 TRACKLIST & CREDITS')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')

    let currentTime = 0
    for (const pt of playlist.tracks) {
      const timestamp = formatTimestamp(currentTime)
      lines.push(`${timestamp} — "${pt.title}" by ${pt.artist}`)
      if (pt.licenseType) {
        lines.push(`   📜 License: ${pt.licenseType}`)
      }
      if (pt.sourceUrl) {
        lines.push(`   🔗 ${pt.sourceUrl}`)
      }
      currentTime += pt.durationSec || 200
    }

    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('📎 All tracks used under their respective Creative Commons licenses.')
    lines.push('If you are the author of any track and wish it removed, please contact me.')
    lines.push('')
    lines.push('#lofi #lofimusic #chillbeats #studybeats #lofiradio')

    return lines.join('\n')
  }

  const handleCopyExport = async () => {
    if (!exportedPlaylist) return
    const text = generateExportText(exportedPlaylist)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleAddToBuilder = async (playlist: GeneratedPlaylist) => {
    const { createPlaylist, addTrackToPlaylist } = useLofiCrateStore.getState()

    try {
      const newPlaylist = await createPlaylist(playlist.name, playlist.totalDuration)

      // Add matched tracks from DB
      for (const pt of playlist.tracks) {
        if (pt.matchedTrack) {
          try {
            await addTrackToPlaylist(pt.matchedTrack.id)
          } catch {
            // Skip if already in playlist
          }
        }
      }

      toast.success(`Added "${playlist.name}" to builder (DB-matched tracks only)`)
    } catch {
      toast.error('Failed to add playlist to builder')
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <Card className="border-purple-900/30 bg-slate-950/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Layers className="h-5 w-5 text-amber-400" />
            Playlist Generator <span className="text-[9px] text-purple-300/40">(генератор плейлистов)</span>
          </h2>
          <p className="text-xs text-purple-300/50">
            Upload your playlist files and generate multiple 1-hour playlist variants with different moods and tempos
            <span className="text-[9px] text-purple-300/30"> (загрузите файлы и создайте варианты)</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-lg border border-dashed p-6 text-center transition-colors ${
              dragActive
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-purple-900/30 bg-slate-950/30 hover:border-purple-700/50'
            }`}
          >
            <Upload className="mx-auto mb-2 h-8 w-8 text-purple-400/50" />
            <p className="text-sm text-purple-300/60">
              Upload playlist files <span className="text-[9px] text-purple-300/30">(загрузить файлы плейлистов)</span>
            </p>
            <p className="mt-1 text-xs text-purple-300/30">
              .txt, .csv — supports multiple files — drop or click
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Parsed Tracks Summary */}
          {parsedTracks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-purple-300/60">
                  <span className="flex items-center gap-1">
                    <Music className="h-3 w-3" />
                    {parsedTracks.length} tracks loaded
                    <span className="text-[9px] text-purple-300/30">(загружено)</span>
                  </span>
                  <span className="text-emerald-400/60">{matchedCount} matched</span>
                  <span className="text-amber-400/60">{parsedTracks.length - matchedCount} unmatched</span>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 border-purple-900/30 bg-slate-950/50 text-[10px] text-purple-300 hover:text-purple-100"
                    onClick={handleEnrichWithAI}
                    disabled={isEnriching}
                  >
                    {isEnriching ? <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                    Enrich <span className="text-[8px] text-purple-300/40">(дополнить)</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] text-rose-400/60 hover:text-rose-400"
                    onClick={() => { setParsedTracks([]); setGeneratedPlaylists([]); setMatchedCount(0) }}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Toggle track list */}
              <button
                onClick={() => setShowTrackList(!showTrackList)}
                className="flex w-full items-center justify-between rounded border border-purple-900/20 bg-slate-950/40 px-2 py-1 text-xs text-purple-300/50 transition-colors hover:text-purple-200"
              >
                <span>Track List ({parsedTracks.length})</span>
                {showTrackList ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showTrackList && (
                <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                  {parsedTracks.map((pt, i) => (
                    <ParsedTrackRow key={`${pt.title}-${pt.artist}-${i}`} pt={pt} index={i} onPlay={handlePlayTrack} />
                  ))}
                </div>
              )}

              <Separator className="bg-purple-900/20" />

              {/* Generation Options */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-purple-300/60">
                  Generation Options <span className="normal-case text-purple-300/30">(настройки генерации)</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 text-[10px] text-purple-300/50">Distribution <span className="text-purple-300/30">(распределение)</span></Label>
                    <Select value={distributionMode} onValueChange={(v) => setDistributionMode(v as typeof distributionMode)}>
                      <SelectTrigger className="h-7 border-purple-900/30 bg-slate-950/50 text-xs text-purple-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                        <SelectItem value="mixed" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">Mixed (variety)</SelectItem>
                        <SelectItem value="mood" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">By Mood</SelectItem>
                        <SelectItem value="genre" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">By Genre</SelectItem>
                        <SelectItem value="tempo" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">By Tempo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1 text-[10px] text-purple-300/50">Duration <span className="text-purple-300/30">(длительность)</span></Label>
                    <Select value={String(targetDuration)} onValueChange={(v) => setTargetDuration(parseInt(v, 10))}>
                      <SelectTrigger className="h-7 border-purple-900/30 bg-slate-950/50 text-xs text-purple-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                        <SelectItem value="1800" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">30 min</SelectItem>
                        <SelectItem value="2700" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">45 min</SelectItem>
                        <SelectItem value="3600" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">1 hour</SelectItem>
                        <SelectItem value="5400" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">1.5 hours</SelectItem>
                        <SelectItem value="7200" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1 text-[10px] text-purple-300/50">Variants <span className="text-purple-300/30">(варианты)</span></Label>
                    <Select value={String(numVariants)} onValueChange={(v) => setNumVariants(parseInt(v, 10))}>
                      <SelectTrigger className="h-7 border-purple-900/30 bg-slate-950/50 text-xs text-purple-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)} className="text-purple-200 focus:bg-purple-900/30 focus:text-white">{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end pb-1">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={shuffleOnGenerate}
                        onCheckedChange={setShuffleOnGenerate}
                        className="data-[state=checked]:bg-amber-500"
                      />
                      <Label className="text-[10px] text-purple-300/50">
                        Auto-shuffle <span className="text-purple-300/30">(перемешать)</span>
                      </Label>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || parsedTracks.length === 0}
                  className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  {isGenerating ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Generate Playlists <span className="ml-1 text-[9px] opacity-70">(создать плейлисты)</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Playlists */}
      {generatedPlaylists.length > 0 && (
        <Card className="border-purple-900/30 bg-slate-950/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Generated Playlists <span className="text-[9px] text-purple-300/40">(созданные плейлисты)</span>
            </h2>
            <p className="text-xs text-purple-300/50">
              {generatedPlaylists.length} variant{generatedPlaylists.length !== 1 ? 's' : ''} created
              <span className="text-[9px] text-purple-300/30"> (нажмите чтобы раскрыть)</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {generatedPlaylists.map((pl) => (
              <GeneratedPlaylistCard
                key={pl.id}
                playlist={pl}
                onShuffle={handleShufflePlaylist}
                onPlay={handlePlayTrack}
                onExport={handleExport}
                onAddToBuilder={handleAddToBuilder}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Export Dialog (inline) */}
      {exportedPlaylist && (
        <Card className="border-amber-900/30 bg-slate-950/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-amber-400">
                Export: {exportedPlaylist.name} <span className="text-[9px] text-purple-300/40">(экспорт)</span>
              </h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 text-purple-400/50 hover:text-white"
                onClick={() => setExportedPlaylist(null)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="max-h-60 overflow-y-auto rounded-lg border border-purple-900/20 bg-slate-950/60 p-3">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-purple-200/80">
                {generateExportText(exportedPlaylist)}
              </pre>
            </div>
            <Button
              onClick={handleCopyExport}
              className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied! <span className="ml-1 text-[9px] opacity-70">(скопировано!)</span>
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard <span className="ml-1 text-[9px] opacity-70">(скопировать)</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
