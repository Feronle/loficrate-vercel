'use client'

import { useState } from 'react'
import { Search, Globe, X, ChevronDown, ChevronUp, SlidersHorizontal, ShieldOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useLofiCrateStore } from '@/lib/store'

const ALL_GENRES = ['lofi-hiphop', 'lofi-chill', 'lofi-ambient', 'lofi-jazz', 'lofi-study', 'chillhop', 'vaporwave', 'downtempo', 'dream-pop', 'ambient']
const ALL_MOODS = ['calm', 'melancholic', 'peaceful', 'dreamy', 'nostalgic', 'cozy', 'focused', 'romantic', 'sad', 'uplifting']
const ALL_TEMPOS = ['slow', 'medium', 'fast']
const ALL_INSTRUMENTS = ['piano', 'guitar', 'synth', 'drums', 'sax', 'flute', 'violin', 'mixed']
const ALL_LICENSE_TYPES = ['CC-BY-4.0', 'CC-BY-3.0', 'CC-BY-SA', 'CC0', 'Pixabay', 'Custom', 'CC-BY-NC', 'CC-BY-ND', 'CC-BY-NC-SA', 'CC-BY-NC-ND']
const ALL_SOURCE_PLATFORMS = ['YouTube', 'YouTube-Audio-Library', 'FMA', 'SoundCloud', 'Pixabay', 'Mixkit', 'Incompetech', 'Bensound', 'Chosic', 'Other']

export function FilterBar() {
  const { filters, setFilter, clearFilters, searchWeb } = useLofiCrateStore()
  const [showFilters, setShowFilters] = useState(false)

  const activeFilterCount = [
    filters.genres.length > 0,
    filters.moods.length > 0,
    filters.tempo,
    filters.instrument,
    filters.licenseTypes.length > 0,
    filters.sourcePlatform,
    filters.excludedPlatforms.length > 0,
  ].filter(Boolean).length

  const toggleArrayFilter = (key: 'genres' | 'moods' | 'licenseTypes' | 'excludedPlatforms', value: string) => {
    const current = filters[key] as string[]
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setFilter(key, updated)
  }

  const handleSearchWeb = () => {
    if (filters.search.trim()) {
      searchWeb(filters.search.trim())
    }
  }

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400/50" />
          <Input
            placeholder="Search by title or artist..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                useLofiCrateStore.getState().fetchTracks()
              }
            }}
            className="border-purple-900/30 bg-slate-950/50 pl-9 text-sm text-white placeholder:text-purple-300/40 focus-visible:ring-amber-500/30"
          />
          {filters.search && (
            <button
              onClick={() => setFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/50 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearchWeb}
          disabled={!filters.search.trim()}
          variant="outline"
          size="sm"
          className="border-purple-900/30 bg-slate-950/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
        >
          <Globe className="mr-1 h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search Web <span className="text-[9px] text-purple-300/40">(поиск в сети)</span></span>
        </Button>
        <Button
          onClick={() => useLofiCrateStore.getState().fetchTracks()}
          size="sm"
          className="bg-amber-500 text-slate-950 hover:bg-amber-400"
        >
          <Search className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex w-full items-center justify-between rounded-lg border border-purple-900/30 bg-slate-950/50 px-3 py-2 text-sm text-purple-300/70 transition-colors hover:border-purple-800/50 hover:text-purple-200"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters <span className="text-[9px] text-purple-300/40">(фильтры)</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-950">
              {activeFilterCount}
            </span>
          )}
        </span>
        {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="space-y-4 rounded-lg border border-purple-900/30 bg-slate-950/50 p-4 backdrop-blur-sm">
          {/* Genre */}
          <div>
            <Label className="mb-2 text-xs font-medium uppercase tracking-wider text-purple-300/60">Genre <span className="normal-case text-purple-300/30">(жанр)</span></Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ALL_GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleArrayFilter('genres', genre)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-all ${
                    filters.genres.includes(genre)
                      ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                      : 'border-purple-900/30 bg-slate-950/50 text-purple-300/60 hover:border-purple-700/50 hover:text-purple-200'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <Label className="mb-2 text-xs font-medium uppercase tracking-wider text-purple-300/60">Mood <span className="normal-case text-purple-300/30">(настроение)</span></Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ALL_MOODS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => toggleArrayFilter('moods', mood)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-all ${
                    filters.moods.includes(mood)
                      ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                      : 'border-purple-900/30 bg-slate-950/50 text-purple-300/60 hover:border-purple-700/50 hover:text-purple-200'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo & Instrument row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 text-xs font-medium uppercase tracking-wider text-purple-300/60">Tempo <span className="normal-case text-purple-300/30">(темп)</span></Label>
              <Select
                value={filters.tempo || '__all__'}
                onValueChange={(v) => setFilter('tempo', v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="border-purple-900/30 bg-slate-950/50 text-sm text-purple-200">
                  <SelectValue placeholder="All tempos" />
                </SelectTrigger>
                <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                  <SelectItem value="__all__" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">All tempos</SelectItem>
                  {ALL_TEMPOS.map((t) => (
                    <SelectItem key={t} value={t} className="text-purple-200 focus:bg-purple-900/30 focus:text-white">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-medium uppercase tracking-wider text-purple-300/60">Instrument <span className="normal-case text-purple-300/30">(инструмент)</span></Label>
              <Select
                value={filters.instrument || '__all__'}
                onValueChange={(v) => setFilter('instrument', v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="border-purple-900/30 bg-slate-950/50 text-sm text-purple-200">
                  <SelectValue placeholder="All instruments" />
                </SelectTrigger>
                <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                  <SelectItem value="__all__" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">All instruments</SelectItem>
                  {ALL_INSTRUMENTS.map((i) => (
                    <SelectItem key={i} value={i} className="text-purple-200 focus:bg-purple-900/30 focus:text-white">{i.charAt(0).toUpperCase() + i.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* License Type */}
          <div>
            <Label className="mb-2 text-xs font-medium uppercase tracking-wider text-purple-300/60">License Type <span className="normal-case text-purple-300/30">(тип лицензии)</span></Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ALL_LICENSE_TYPES.map((lt) => (
                <button
                  key={lt}
                  onClick={() => toggleArrayFilter('licenseTypes', lt)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-all ${
                    filters.licenseTypes.includes(lt)
                      ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                      : 'border-purple-900/30 bg-slate-950/50 text-purple-300/60 hover:border-purple-700/50 hover:text-purple-200'
                  }`}
                >
                  {lt}
                </button>
              ))}
            </div>
          </div>

          {/* Source Platform */}
          <div>
            <Label className="mb-1.5 text-xs font-medium uppercase tracking-wider text-purple-300/60">Source Platform <span className="normal-case text-purple-300/30">(платформа)</span></Label>
            <Select
              value={filters.sourcePlatform || '__all__'}
              onValueChange={(v) => setFilter('sourcePlatform', v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="border-purple-900/30 bg-slate-950/50 text-sm text-purple-200">
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent className="border-purple-900/30 bg-slate-950 text-purple-200">
                <SelectItem value="__all__" className="text-purple-200 focus:bg-purple-900/30 focus:text-white">All platforms</SelectItem>
                {ALL_SOURCE_PLATFORMS.map((sp) => (
                  <SelectItem key={sp} value={sp} className="text-purple-200 focus:bg-purple-900/30 focus:text-white">{sp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exclude Platforms (Negative Filter) */}
          <div>
            <Label className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-rose-400/70">
              <ShieldOff className="h-3 w-3" />
              Exclude Platforms <span className="normal-case text-rose-400/40">(исключить платформы)</span>
            </Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ALL_SOURCE_PLATFORMS.map((sp) => (
                <button
                  key={sp}
                  onClick={() => toggleArrayFilter('excludedPlatforms', sp)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-all ${
                    filters.excludedPlatforms.includes(sp)
                      ? 'border-rose-500/50 bg-rose-500/20 text-rose-300'
                      : 'border-purple-900/30 bg-slate-950/50 text-purple-300/40 hover:border-rose-700/30 hover:text-rose-300/60'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* YouTube Safe Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium uppercase tracking-wider text-purple-300/60">YouTube Safe Only <span className="normal-case text-purple-300/30">(безопасно для YouTube)</span></Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={filters.youtubeSafeOnly}
                onCheckedChange={(checked) => setFilter('youtubeSafeOnly', checked)}
                className="data-[state=checked]:bg-amber-500"
              />
              <span className="text-xs text-purple-300/60">
                {filters.youtubeSafeOnly ? 'On' : 'Off'}
              </span>
            </div>
          </div>

          {/* Clear Filters */}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="w-full text-purple-300/60 hover:text-rose-400"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear All Filters <span className="ml-1 text-[9px] text-purple-300/30">(сбросить)</span>
          </Button>
        </div>
      )}
    </div>
  )
}
