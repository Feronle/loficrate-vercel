'use client'

import { useState, useCallback, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical, ArrowUp, ArrowDown, AlertTriangle, Copy, FileText, Plus, Check, Shuffle, Upload, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useLofiCrateStore, PlaylistTrack, UploadedTrack } from '@/lib/store'
import { formatDuration, formatTimestamp, getLicenseColor, isLicenseIncompatible } from '@/lib/helpers'
import { toast } from 'sonner'

const TARGET_DURATIONS = [
  { label: '30 min', value: 1800 },
  { label: '45 min', value: 2700 },
  { label: '1 hr', value: 3600 },
  { label: '1.5 hr', value: 5400 },
  { label: '2 hr', value: 7200 },
]

function SortablePlaylistItem({ pt, index }: { pt: PlaylistTrack; index: number }) {
  const { removeTrackFromPlaylist, currentPlaylist, reorderPlaylist } = useLofiCrateStore()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pt.trackId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  let timestamp = 0
  if (currentPlaylist) {
    for (let i = 0; i < index; i++) {
      timestamp += currentPlaylist.tracks[i]?.track.durationSec || 0
    }
  }

  const handleMoveUp = () => {
    if (!currentPlaylist || index === 0) return
    const trackIds = currentPlaylist.tracks.map((t) => t.trackId)
    const newOrder = arrayMove(trackIds, index, index - 1)
    reorderPlaylist(newOrder)
  }

  const handleMoveDown = () => {
    if (!currentPlaylist || index >= currentPlaylist.tracks.length - 1) return
    const trackIds = currentPlaylist.tracks.map((t) => t.trackId)
    const newOrder = arrayMove(trackIds, index, index + 1)
    reorderPlaylist(newOrder)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border border-purple-900/20 bg-slate-950/60 px-2 py-2 text-sm transition-colors ${
        isDragging ? 'border-amber-500/40 bg-amber-500/5' : 'hover:border-purple-800/40'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-purple-400/30 hover:text-purple-300/60"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="w-5 text-right text-xs tabular-nums text-purple-300/40">
        {index + 1}
      </span>

      <span className="w-10 text-xs tabular-nums text-amber-400/60">
        {formatTimestamp(timestamp)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs text-white">{pt.track.title}</span>
          <Badge
            variant="outline"
            className={`shrink-0 border text-[9px] ${getLicenseColor(pt.track.licenseType)}`}
          >
            {pt.track.licenseType}
          </Badge>
        </div>
        <p className="truncate text-[10px] text-purple-300/50">{pt.track.artist}</p>
      </div>

      <span className="shrink-0 text-xs tabular-nums text-purple-300/50">
        {formatDuration(pt.track.durationSec)}
      </span>

      <div className="flex shrink-0 flex-col">
        <button
          onClick={handleMoveUp}
          className="text-purple-400/30 hover:text-purple-300"
          disabled={index === 0}
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          onClick={handleMoveDown}
          className="text-purple-400/30 hover:text-purple-300"
          disabled={!currentPlaylist || index >= currentPlaylist.tracks.length - 1}
        >
          <ArrowDown className="h-3 w-3" />
        </button>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0 text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400"
        onClick={() => removeTrackFromPlaylist(pt.trackId)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function ExportSection() {
  const { currentPlaylist, exportPlaylist, exportedTitle, exportedDescription, showExportDialog, setShowExportDialog } = useLofiCrateStore()
  const [copied, setCopied] = useState(false)

  const handleExport = async () => {
    if (!currentPlaylist || currentPlaylist.tracks.length === 0) {
      toast.error('Add tracks to your playlist before exporting')
      return
    }
    await exportPlaylist()
  }

  const handleCopy = async () => {
    if (!exportedDescription) return
    try {
      await navigator.clipboard.writeText(`${exportedTitle}\n\n${exportedDescription}`)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <>
      <Button
        onClick={handleExport}
        className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400"
        disabled={!currentPlaylist || currentPlaylist.tracks.length === 0}
      >
        <FileText className="mr-2 h-4 w-4" />
        Export for YouTube <span className="ml-1 text-[9px] opacity-70">(экспорт для YouTube)</span>
      </Button>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-h-[85vh] border-purple-900/30 bg-slate-950 text-white sm:max-w-lg [&>button]:text-purple-300/50">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Export for YouTube <span className="text-xs text-purple-300/40">(экспорт)</span></DialogTitle>
          </DialogHeader>

          {exportedTitle && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium uppercase tracking-wider text-purple-300/60">
                  Suggested Title
                </Label>
                <div className="mt-1 rounded-lg border border-purple-900/20 bg-slate-950/60 p-3">
                  <p className="text-sm text-amber-300">{exportedTitle}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium uppercase tracking-wider text-purple-300/60">
                  YouTube Description
                </Label>
                <div className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-purple-900/20 bg-slate-950/60 p-3">
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-purple-200/80">
                    {exportedDescription}
                  </pre>
                </div>
              </div>

              <Button
                onClick={handleCopy}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function UploadSection() {
  const { uploadedTracks, addUploadedTracks, clearUploadedTracks } = useLofiCrateStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const parseFile = (text: string, fileName: string) => {
    const lines = text.split('\n').filter((l) => l.trim())
    const parsed: UploadedTrack[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed.startsWith('===')) continue

      // Try various formats:
      // "0:00 — Track by Artist" or "0:00 - Track by Artist"
      const tsMatch = trimmed.match(/^\d{1,2}:\d{2}(?::\d{2})?\s*[—\-–]\s*(.+)$/)
      if (tsMatch) {
        const rest = tsMatch[1].trim()
        const bySplit = rest.split(/\s+by\s+/i)
        if (bySplit.length >= 2) {
          parsed.push({ title: bySplit[0].trim().replace(/^["']|["']$/g, ''), artist: bySplit.slice(1).join(' by ').trim(), source: fileName })
          continue
        }
        // Maybe "Artist - Track" format
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

      // Just a plain title
      if (trimmed.length > 2 && trimmed.length < 200) {
        parsed.push({ title: trimmed.replace(/^["']|["']$/g, ''), artist: 'Unknown', source: fileName })
      }
    }

    return parsed
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        if (!text) return
        const parsed = parseFile(text, file.name)
        if (parsed.length > 0) {
          addUploadedTracks(parsed)
          toast.success(`Loaded ${parsed.length} tracks from ${file.name}`)
        } else {
          toast.warning(`Could not parse any tracks from ${file.name}`)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-2">
      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border border-dashed p-3 text-center transition-colors ${
          dragActive
            ? 'border-amber-500/50 bg-amber-500/10'
            : 'border-purple-900/30 bg-slate-950/30 hover:border-purple-700/50'
        }`}
      >
        <Upload className="mx-auto mb-1 h-4 w-4 text-purple-400/50" />
        <p className="text-xs text-purple-300/50">
          Upload playlist file <span className="text-[9px] text-purple-300/30">(загрузить файл плейлиста)</span>
        </p>
        <p className="text-[10px] text-purple-300/30">.txt — drop or click</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Uploaded tracks summary */}
      {uploadedTracks.length > 0 && (
        <div className="rounded-lg border border-purple-900/20 bg-slate-950/40 p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-300/60">
              {uploadedTracks.length} uploaded track{uploadedTracks.length !== 1 ? 's' : ''} excluded from search
              <span className="text-[9px] text-purple-300/30"> (исключены из поиска)</span>
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-rose-400/60 hover:text-rose-400"
              onClick={clearUploadedTracks}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <div className="mt-1 max-h-16 overflow-y-auto">
            {uploadedTracks.map((t, i) => (
              <div key={i} className="text-[10px] text-purple-300/40">
                • {t.title} by {t.artist} <span className="text-purple-300/20">({t.source})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function PlaylistBuilder() {
  const { currentPlaylist, createPlaylist, updatePlaylistName, updatePlaylistTargetDuration, reorderPlaylist, shufflePlaylist, uploadedTracks } = useLofiCrateStore()
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  const tracks = currentPlaylist?.tracks || []
  const totalDuration = tracks.reduce((sum, pt) => sum + pt.track.durationSec, 0)
  const targetDuration = currentPlaylist?.targetDuration || 3600
  const progressPercent = targetDuration > 0 ? Math.min((totalDuration / targetDuration) * 100, 100) : 0

  const incompatibleTracks = tracks.filter((pt) => isLicenseIncompatible(pt.track.licenseType))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !currentPlaylist) return

    const trackIds = currentPlaylist.tracks.map((t) => t.trackId)
    const oldIndex = trackIds.indexOf(active.id as string)
    const newIndex = trackIds.indexOf(over.id as string)
    const newOrder = arrayMove(trackIds, oldIndex, newIndex)
    reorderPlaylist(newOrder)
  }, [currentPlaylist, reorderPlaylist])

  const handleNewPlaylist = async () => {
    await createPlaylist('My Lofi Playlist', 3600)
  }

  const handleStartEditName = () => {
    if (currentPlaylist) {
      setNameValue(currentPlaylist.name)
      setEditingName(true)
    }
  }

  const handleSaveName = () => {
    if (nameValue.trim() && currentPlaylist) {
      updatePlaylistName(nameValue.trim())
    }
    setEditingName(false)
  }

  const getProgressColor = () => {
    if (totalDuration > targetDuration * 1.2) return 'bg-rose-500'
    if (totalDuration > targetDuration) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  return (
    <Card className="flex max-h-[calc(100vh-140px)] flex-col border-purple-900/30 bg-slate-950/80 backdrop-blur-sm">
      <CardHeader className="shrink-0 pb-3">
        {/* Playlist name */}
        <div className="flex items-center justify-between gap-2">
          {editingName ? (
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') setEditingName(false)
                }}
                onBlur={handleSaveName}
                autoFocus
                className="h-7 border-purple-900/30 bg-slate-950/50 text-sm text-white"
              />
            </div>
          ) : (
            <h2
              className="flex-1 cursor-pointer truncate text-lg font-semibold text-white hover:text-amber-400"
              onClick={handleStartEditName}
            >
              {currentPlaylist?.name || 'No Playlist'}
            </h2>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleNewPlaylist}
            className="shrink-0 text-amber-400/60 hover:text-amber-400"
            title="New Playlist (новый плейлист)"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Target duration selector */}
        <Select
          value={String(targetDuration)}
          onValueChange={(v) => updatePlaylistTargetDuration(parseInt(v, 10))}
        >
          <SelectTrigger className="h-7 border-purple-900/30 bg-slate-950/50 text-xs text-purple-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
            {TARGET_DURATIONS.map((d) => (
              <SelectItem key={d.value} value={String(d.value)} className="text-purple-200 focus:bg-purple-900/30 focus:text-white">{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden">
        {/* Duration Progress */}
        <div className="shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="tabular-nums text-purple-300/60">
              {formatDuration(totalDuration)} / {formatDuration(targetDuration)}
            </span>
            <span className="text-purple-300/40">
              {tracks.length} track{tracks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-900">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        <Separator className="shrink-0 bg-purple-900/20" />

        {/* License Compatibility Warning */}
        {incompatibleTracks.length > 0 && (
          <div className="shrink-0 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              License Warning <span className="text-[9px] text-rose-300/40">(предупреждение лицензии)</span>
            </div>
            <p className="mt-1 text-[10px] text-rose-300/60">
              {incompatibleTracks.length} track{incompatibleTracks.length > 1 ? 's' : ''} with incompatible licenses for YouTube monetization:
            </p>
            <ul className="mt-1 space-y-0.5">
              {incompatibleTracks.map((pt) => (
                <li key={pt.trackId} className="text-[10px] text-rose-300/50">
                  &bull; &quot;{pt.track.title}&quot; — {pt.track.licenseType}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload section */}
        <div className="shrink-0">
          <UploadSection />
        </div>

        {/* Playlist Track List — SCROLLABLE */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tracks.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tracks.map((t) => t.trackId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5 pr-1">
                  {tracks.map((pt, index) => (
                    <SortablePlaylistItem
                      key={pt.trackId}
                      pt={pt}
                      index={index}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="mb-1 text-2xl">🎵</div>
              <p className="text-xs text-purple-300/40">No tracks yet <span className="text-[9px] text-purple-300/30">(нет треков)</span></p>
              <p className="text-[10px] text-purple-300/30">
                Add tracks from the library
              </p>
            </div>
          )}
        </div>

        <Separator className="shrink-0 bg-purple-900/20" />

        {/* Action buttons — ALWAYS VISIBLE */}
        <div className="shrink-0 space-y-2">
          {/* Shuffle */}
          {tracks.length > 1 && (
            <Button
              onClick={shufflePlaylist}
              variant="outline"
              size="sm"
              className="w-full border-purple-900/30 bg-slate-950/50 text-purple-300 hover:border-purple-700/50 hover:text-purple-100"
            >
              <Shuffle className="mr-2 h-3.5 w-3.5" />
              Shuffle <span className="ml-1 text-[9px] text-purple-300/40">(перемешать)</span>
            </Button>
          )}

          {/* Export */}
          <ExportSection />
        </div>
      </CardContent>
    </Card>
  )
}
