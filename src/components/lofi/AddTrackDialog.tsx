'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useLofiCrateStore } from '@/lib/store'
import { toast } from 'sonner'

const GENRES = ['lofi-hiphop', 'lofi-chill', 'lofi-ambient', 'lofi-jazz', 'lofi-study', 'chillhop', 'vaporwave', 'downtempo', 'dream-pop', 'ambient']
const MOODS = ['calm', 'melancholic', 'peaceful', 'dreamy', 'nostalgic', 'cozy', 'focused', 'romantic', 'sad', 'uplifting']
const TEMPOS = ['slow', 'medium', 'fast']
const INSTRUMENTS = ['piano', 'guitar', 'synth', 'drums', 'sax', 'flute', 'violin', 'mixed']
const LICENSE_TYPES = ['CC-BY-4.0', 'CC-BY-3.0', 'CC-BY-SA', 'CC0', 'Pixabay', 'Custom', 'CC-BY-NC', 'CC-BY-ND', 'CC-BY-NC-SA', 'CC-BY-NC-ND']
const SOURCE_PLATFORMS = ['YouTube', 'YouTube-Audio-Library', 'FMA', 'SoundCloud', 'Pixabay', 'Mixkit', 'Incompetech', 'Bensound', 'Chosic', 'Other']

interface FormData {
  title: string
  artist: string
  genre: string
  mood: string
  tempo: string
  instrument: string
  durationSec: string
  licenseType: string
  licenseUrl: string
  sourceUrl: string
  sourcePlatform: string
  tags: string
  notes: string
  isYoutubeSafe: boolean
}

const defaultFormData: FormData = {
  title: '',
  artist: '',
  genre: '',
  mood: '',
  tempo: '',
  instrument: '',
  durationSec: '',
  licenseType: '',
  licenseUrl: '',
  sourceUrl: '',
  sourcePlatform: '',
  tags: '',
  notes: '',
  isYoutubeSafe: true,
}

export function AddTrackDialog() {
  const { showAddTrackDialog, setShowAddTrackDialog, prefillTrackData, setPrefillTrackData } = useLofiCrateStore()
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [submitting, setSubmitting] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setShowAddTrackDialog(open)
    if (open && prefillTrackData) {
      setFormData({
        ...defaultFormData,
        title: prefillTrackData.title || '',
        artist: prefillTrackData.artist || '',
        sourceUrl: prefillTrackData.sourceUrl || '',
      })
    } else if (!open) {
      setFormData(defaultFormData)
      setPrefillTrackData(null)
    }
  }

  const updateField = (key: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.artist || !formData.genre || !formData.mood || !formData.tempo || !formData.instrument || !formData.durationSec || !formData.licenseType || !formData.licenseUrl || !formData.sourceUrl || !formData.sourcePlatform) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      // Add track locally (no API call)
      useLofiCrateStore.getState().addCustomTrack({
        title: formData.title,
        artist: formData.artist,
        genre: formData.genre,
        mood: formData.mood,
        tempo: formData.tempo,
        instrument: formData.instrument,
        durationSec: parseInt(formData.durationSec, 10),
        licenseType: formData.licenseType,
        licenseUrl: formData.licenseUrl,
        sourceUrl: formData.sourceUrl,
        sourcePlatform: formData.sourcePlatform,
        coverArt: null,
        tags: formData.tags || null,
        notes: formData.notes || null,
        isYoutubeSafe: formData.isYoutubeSafe,
      })
      setShowAddTrackDialog(false)
      setFormData(defaultFormData)
      setPrefillTrackData(null)
    } catch {
      toast.error('Failed to add track')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={showAddTrackDialog} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-purple-900/30 bg-slate-950 text-white sm:max-w-lg [&>button]:text-purple-300/50">
        <DialogHeader>
          <DialogTitle className="text-amber-400">Add Custom Track <span className="text-xs text-purple-300/40">(добавить трек)</span></DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-purple-300/60">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="border-purple-900/30 bg-slate-950/50 text-sm text-white"
                placeholder="Track title"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-purple-300/60">Artist *</Label>
              <Input
                value={formData.artist}
                onChange={(e) => updateField('artist', e.target.value)}
                className="border-purple-900/30 bg-slate-950/50 text-sm text-white"
                placeholder="Artist name"
              />
            </div>
            <div>
              <Label className="text-xs text-purple-300/60">Genre *</Label>
              <Select value={formData.genre} onValueChange={(v) => updateField('genre', v)}>
                <SelectTrigger className="border-purple-900/30 bg-slate-950/50 text-sm text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                  {GENRES.map((g) => <SelectItem key={g} value={g} className="text-purple-200 focus:bg-purple-900/30 focus:text-white">{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-purple-300/60">Mood *</Label>
              <Select value={formData.mood} onValueChange={(v) => updateField('mood', v)}>
                <SelectTrigger className="border-purple-900/30 bg-slate-950/50 text-sm text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                  {MOODS.map((m) => <SelectItem key={m} value={m} className="text-purple-200 focus:bg-purple-900/30 focus:text-white">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-purple-300/60">Tempo *</Label>
              <Select value={formData.tempo} onValueChange={(v) => updateField('tempo', v)}>
                <SelectTrigger className="border-purple-900/30 bg-slate-950/50 text-sm text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                  {TEMPOS.map((t) => <SelectItem key={t} value={t} className="text-purple-200 focus:bg-purple-900/30 focus:text-white">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-purple-300/60">Instrument *</Label>
              <Select value={formData.instrument} onValueChange={(v) => updateField('instrument', v)}>
                <SelectTrigger className="border-purple-900/30 bg-slate-950/50 text-sm text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                  {INSTRUMENTS.map((i) => <SelectItem key={i} value={i} className="text-purple-200 focus:bg-purple-900/30 focus:text-white">{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-purple-300/60">Duration (seconds) *</Label>
              <Input
                type="number"
                value={formData.durationSec}
                onChange={(e) => updateField('durationSec', e.target.value)}
                className="border-purple-900/30 bg-slate-950/50 text-sm text-white"
                placeholder="180"
              />
            </div>
            <div>
              <Label className="text-xs text-purple-300/60">License Type *</Label>
              <Select value={formData.licenseType} onValueChange={(v) => updateField('licenseType', v)}>
                <SelectTrigger className="border-purple-900/30 bg-slate-950/50 text-sm text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                  {LICENSE_TYPES.map((l) => <SelectItem key={l} value={l} className="text-purple-200 focus:bg-purple-900/30 focus:text-white">{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-purple-300/60">License URL *</Label>
              <Input
                value={formData.licenseUrl}
                onChange={(e) => updateField('licenseUrl', e.target.value)}
                className="border-purple-900/30 bg-slate-950/50 text-sm text-white"
                placeholder="https://creativecommons.org/licenses/by/4.0/"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-purple-300/60">Source URL *</Label>
              <Input
                value={formData.sourceUrl}
                onChange={(e) => updateField('sourceUrl', e.target.value)}
                className="border-purple-900/30 bg-slate-950/50 text-sm text-white"
                placeholder="https://example.com/track"
              />
            </div>
            <div>
              <Label className="text-xs text-purple-300/60">Source Platform *</Label>
              <Select value={formData.sourcePlatform} onValueChange={(v) => updateField('sourcePlatform', v)}>
                <SelectTrigger className="border-purple-900/30 bg-slate-950/50 text-sm text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                  {SOURCE_PLATFORMS.map((s) => <SelectItem key={s} value={s} className="text-purple-200 focus:bg-purple-900/30 focus:text-white">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-purple-300/60">Duration (seconds)</Label>
              <div />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-purple-300/60">Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                className="border-purple-900/30 bg-slate-950/50 text-sm text-white"
                placeholder="lofi, chill, study"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-purple-300/60">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="border-purple-900/30 bg-slate-950/50 text-sm text-white"
                placeholder="Any usage restrictions or notes..."
                rows={2}
              />
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <Label className="text-xs text-purple-300/60">YouTube Safe</Label>
              <Switch
                checked={formData.isYoutubeSafe}
                onCheckedChange={(checked) => updateField('isYoutubeSafe', checked)}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add Track <span className="ml-1 text-[9px] opacity-70">(добавить)</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddTrackButton() {
  const { setShowAddTrackDialog } = useLofiCrateStore()

  return (
    <Button
      onClick={() => setShowAddTrackDialog(true)}
      variant="outline"
      className="w-full border-dashed border-purple-900/30 bg-transparent text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/5"
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Custom Track <span className="ml-1 text-[9px] opacity-70">(добавить трек)</span>
    </Button>
  )
}
