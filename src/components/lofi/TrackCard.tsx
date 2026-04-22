'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Play, Pause, Volume2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useLofiCrateStore, Track } from '@/lib/store'
import { formatDuration, getLicenseColor } from '@/lib/helpers'

function TrackCardInner({ track }: { track: Track }) {
  const { expandedTrackId, setExpandedTrackId, addTrackToPlaylist } = useLofiCrateStore()
  const isExpanded = expandedTrackId === track.id
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handlePlayPreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    // Try to play from source URL (works for direct audio links)
    // For page URLs (SoundCloud, FMA, etc.), open in new tab
    const sourceUrl = track.sourceUrl
    const directAudioPatterns = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '/stream', '/download']
    const isDirectAudio = directAudioPatterns.some(p => sourceUrl.toLowerCase().includes(p))

    if (isDirectAudio && !audioError) {
      if (!audioRef.current) {
        audioRef.current = new Audio(sourceUrl)
        audioRef.current.addEventListener('ended', () => setIsPlaying(false))
        audioRef.current.addEventListener('error', () => {
          setAudioError(true)
          setIsPlaying(false)
          window.open(sourceUrl, '_blank')
        })
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        setAudioError(true)
        setIsPlaying(false)
        window.open(sourceUrl, '_blank')
      })
    } else {
      window.open(sourceUrl, '_blank')
    }
  }

  return (
    <div
      className={`group rounded-lg border transition-all duration-200 ${
        isExpanded
          ? 'border-purple-700/40 bg-purple-950/20'
          : 'border-purple-900/20 bg-slate-950/60 hover:border-purple-800/40 hover:bg-slate-950/80'
      } backdrop-blur-sm`}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-white">{track.title}</h3>
              <p className="truncate text-xs text-purple-300/60">{track.artist}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {!track.isYoutubeSafe && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs border-purple-900/30 bg-slate-950 text-xs text-rose-300">
                      {track.notes || 'This track may not be safe for YouTube monetization'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <span className="text-xs tabular-nums text-purple-300/50">
                {formatDuration(track.durationSec)}
              </span>
            </div>
          </div>

          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="outline" className="border-purple-800/30 bg-purple-500/10 text-[10px] text-purple-300">
              {track.genre}
            </Badge>
            <Badge variant="outline" className="border-purple-800/30 bg-purple-500/10 text-[10px] text-purple-300">
              {track.mood}
            </Badge>
            <Badge
              variant="outline"
              className={`border text-[10px] ${getLicenseColor(track.licenseType)}`}
            >
              {track.licenseType}
            </Badge>
            <Badge variant="outline" className="border-slate-700/30 bg-slate-500/10 text-[10px] text-slate-400">
              {track.tempo}
            </Badge>
            <Badge variant="outline" className="border-slate-700/30 bg-slate-500/10 text-[10px] text-slate-400">
              {track.instrument}
            </Badge>
            <Badge variant="outline" className="border-slate-700/30 bg-slate-500/10 text-[10px] text-slate-400">
              {track.sourcePlatform}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            size="icon"
            variant="ghost"
            className={`h-7 w-7 transition-opacity group-hover:opacity-100 ${
              isPlaying
                ? 'opacity-100 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                : 'text-emerald-400/60 opacity-0 hover:bg-emerald-500/10 hover:text-emerald-300'
            }`}
            onClick={handlePlayPreview}
            title={isPlaying ? 'Pause preview (пауза)' : 'Play preview (прослушать)'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-amber-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-amber-500/10 hover:text-amber-300"
            onClick={() => addTrackToPlaylist(track.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setExpandedTrackId(isExpanded ? null : track.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-purple-400/50 transition-colors hover:bg-purple-500/10 hover:text-purple-300"
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-purple-900/20 px-3 pb-3 pt-2">
          <div className="space-y-2 text-xs">
            {/* Audio preview section */}
            <div className="flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5 text-purple-300/50" />
              <button
                onClick={handlePlayPreview}
                className="flex items-center gap-1.5 rounded-md bg-purple-900/20 px-2.5 py-1 text-purple-300/70 transition-colors hover:bg-purple-900/40 hover:text-purple-200"
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {isPlaying ? 'Pause' : 'Listen'} <span className="text-[9px] text-purple-300/40">{isPlaying ? '(пауза)' : '(прослушать)'}</span>
              </button>
              <a
                href={track.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-amber-400/70 hover:text-amber-300"
              >
                Open source <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            {track.tags && (
              <div>
                <span className="text-purple-300/50">Tags:</span>{' '}
                <span className="text-purple-200/80">{track.tags}</span>
              </div>
            )}
            {track.notes && (
              <div className="rounded border border-rose-500/20 bg-rose-500/5 px-2 py-1.5 text-rose-300/80">
                ⚠️ {track.notes}
              </div>
            )}
            <div>
              <span className="text-purple-300/50">License:</span>{' '}
              <a
                href={track.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/80 underline decoration-amber-400/30 hover:text-amber-300"
              >
                {track.licenseType} <ExternalLink className="inline h-2.5 w-2.5" />
              </a>
            </div>
            <div>
              <span className="text-purple-300/50">Source:</span>{' '}
              <a
                href={track.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/80 underline decoration-amber-400/30 hover:text-amber-300"
              >
                Verify Source <ExternalLink className="inline h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function TrackCard({ track }: { track: Track }) {
  return (
    <TooltipProvider>
      <TrackCardInner track={track} />
    </TooltipProvider>
  )
}
