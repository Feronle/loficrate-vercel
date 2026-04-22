'use client'

import { create } from 'zustand'
import { toast } from 'sonner'

// Types
export interface Track {
  id: string
  title: string
  artist: string
  genre: string
  mood: string
  tempo: string
  instrument: string
  durationSec: number
  licenseType: string
  licenseUrl: string
  sourceUrl: string
  sourcePlatform: string
  coverArt: string | null
  tags: string | null
  notes: string | null
  isYoutubeSafe: boolean
  createdAt: string
  updatedAt: string
}

export interface PlaylistTrack {
  id: string
  playlistId: string
  trackId: string
  position: number
  createdAt: string
  track: Track
}

export interface Playlist {
  id: string
  name: string
  description: string | null
  targetDuration: number
  createdAt: string
  updatedAt: string
}

export interface PlaylistWithTracks extends Playlist {
  tracks: PlaylistTrack[]
}

export interface FilterOptions {
  genres: string[]
  moods: string[]
  tempos: string[]
  instruments: string[]
  licenseTypes: string[]
  sourcePlatforms: string[]
}

export interface WebSearchResult {
  name: string
  url: string
  snippet: string
}

export interface UploadedTrack {
  title: string
  artist: string
  source: string
}

interface Filters {
  search: string
  genres: string[]
  moods: string[]
  tempo: string
  instrument: string
  licenseTypes: string[]
  sourcePlatform: string
  excludedPlatforms: string[]
  youtubeSafeOnly: boolean
}

// --- localStorage helpers ---
const PLAYLISTS_STORAGE_KEY = 'loficate-playlists'

function loadPlaylistsFromStorage(): PlaylistWithTracks[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PlaylistWithTracks[]
  } catch {
    return []
  }
}

function savePlaylistsToStorage(playlists: PlaylistWithTracks[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists))
  } catch {
    // silently fail if localStorage is full
  }
}

// --- Custom tracks (added by user, in-memory) ---
let customTracks: Track[] = []

function getAllTracksSource(): Track[] {
  return [...customTracks]
}

// --- ID generation ---
let idCounter = Date.now()
function generateId(): string {
  idCounter += 1
  return `local-${idCounter}-${Math.random().toString(36).slice(2, 8)}`
}

// --- Export helpers (client-side) ---
function formatDurationExport(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatTimestampExport(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function generateExportData(playlist: PlaylistWithTracks): { title: string; description: string; totalDuration: number } {
  const tracks = playlist.tracks
  if (tracks.length === 0) {
    return { title: '', description: '', totalDuration: 0 }
  }

  const totalDuration = tracks.reduce((sum, pt) => sum + pt.track.durationSec, 0)
  const genres = [...new Set(tracks.map((pt) => pt.track.genre))]
  const moods = [...new Set(tracks.map((pt) => pt.track.mood))]
  const genreStr = genres.slice(0, 2).join(' / ')
  const moodStr = moods.slice(0, 2).join(' ')
  const title = `${moodStr} ${genreStr} Mix - ${playlist.name} [${formatDurationExport(totalDuration)}]`

  const lines: string[] = []

  lines.push(playlist.description || `A curated ${genreStr} playlist perfect for studying, relaxing, and chilling.`)
  lines.push('')
  lines.push('TRACKLIST:')
  lines.push('')

  let currentTime = 0
  for (const pt of tracks) {
    const timestamp = formatTimestampExport(currentTime)
    lines.push(`${timestamp} - ${pt.track.title} by ${pt.track.artist}`)
    currentTime += pt.track.durationSec
  }

  lines.push('')
  lines.push('CREDITS & LICENSING:')
  lines.push('')

  for (const pt of tracks) {
    lines.push(`- ${pt.track.title} by ${pt.track.artist}`)
    lines.push(`  License: ${pt.track.licenseType} - ${pt.track.licenseUrl}`)
    lines.push(`  Source: ${pt.track.sourceUrl}`)
    if (pt.track.notes) {
      lines.push(`  Note: ${pt.track.notes}`)
    }
  }

  lines.push('')
  lines.push('All tracks used under their respective Creative Commons licenses.')
  lines.push('Please verify license terms before monetizing this video.')
  lines.push('')

  const hashtags = [
    '#lofi',
    '#lofimusic',
    '#chillhop',
    '#studybeats',
    ...genres.map((g) => `#${g.replace(/-/g, '')}`),
    ...moods.map((m) => `#${m}`),
    '#creativecommons',
    '#ccmusic',
  ]
  lines.push(hashtags.join(' '))

  const description = lines.join('\n')

  return { title, description, totalDuration }
}

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface LofiCrateStore {
  // Filters
  filters: Filters
  setFilter: (key: string, value: unknown) => void
  clearFilters: () => void

  // Tracks
  tracks: Track[]
  totalTracks: number
  loadingTracks: boolean
  fetchTracks: () => Promise<void>

  // Filter options
  filterOptions: FilterOptions | null
  fetchFilterOptions: () => Promise<void>

  // Playlist
  currentPlaylist: PlaylistWithTracks | null
  playlists: Playlist[]
  createPlaylist: (name: string, targetDuration?: number) => Promise<Playlist>
  loadPlaylist: (id: string) => Promise<void>
  fetchPlaylists: () => Promise<void>
  addTrackToPlaylist: (trackId: string) => Promise<void>
  removeTrackFromPlaylist: (trackId: string) => Promise<void>
  reorderPlaylist: (trackIds: string[]) => Promise<void>
  shufflePlaylist: () => void
  updatePlaylistName: (name: string) => Promise<void>
  updatePlaylistTargetDuration: (duration: number) => Promise<void>

  // Export
  exportedDescription: string | null
  exportedTitle: string | null
  exportPlaylist: () => Promise<void>

  // Uploaded playlists (for deduplication)
  uploadedTracks: UploadedTrack[]
  addUploadedTracks: (tracks: UploadedTrack[]) => void
  clearUploadedTracks: () => void

  // Computed: track IDs to exclude from search (playlist + uploaded)
  getExcludedTrackIds: () => string[]

  // UI state
  webSearchResults: WebSearchResult[] | null
  webSearchAnswer: string | null
  webSearchLoading: boolean
  searchWeb: (query: string) => Promise<void>
  showExportDialog: boolean
  setShowExportDialog: (show: boolean) => void
  showAddTrackDialog: boolean
  setShowAddTrackDialog: (show: boolean) => void
  showWebSearchDialog: boolean
  setShowWebSearchDialog: (show: boolean) => void
  showUploadDialog: boolean
  setShowUploadDialog: (show: boolean) => void
  expandedTrackId: string | null
  setExpandedTrackId: (id: string | null) => void
  prefillTrackData: Partial<Track> | null
  setPrefillTrackData: (data: Partial<Track> | null) => void

  // Custom tracks (add track locally)
  addCustomTrack: (track: Omit<Track, 'id' | 'createdAt' | 'updatedAt'>) => void

  // All DB tracks (for Playlist Generator matching)
  allDbTracks: Track[]
}

const defaultFilters: Filters = {
  search: '',
  genres: [],
  moods: [],
  tempo: '',
  instrument: '',
  licenseTypes: [],
  sourcePlatform: '',
  excludedPlatforms: [],
  youtubeSafeOnly: true,
}

export const useLofiCrateStore = create<LofiCrateStore>((set, get) => ({
  // Filters
  filters: { ...defaultFilters },
  setFilter: (key: string, value: unknown) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }))
  },
  clearFilters: () => {
    set({ filters: { ...defaultFilters } })
  },

  // Tracks — fetched from API
  tracks: [],
  totalTracks: 0,
  loadingTracks: false,
  allDbTracks: [],
  fetchTracks: async () => {
    set({ loadingTracks: true })
    try {
      const { filters } = get()
      const excludeIds = get().getExcludedTrackIds()

      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.genres.length > 0) params.set('genres', filters.genres.join(','))
      if (filters.moods.length > 0) params.set('moods', filters.moods.join(','))
      if (filters.tempo) params.set('tempo', filters.tempo)
      if (filters.instrument) params.set('instrument', filters.instrument)
      if (filters.licenseTypes.length > 0) params.set('licenseTypes', filters.licenseTypes.join(','))
      if (filters.sourcePlatform) params.set('sourcePlatform', filters.sourcePlatform)
      if (filters.excludedPlatforms.length > 0) params.set('excludedPlatforms', filters.excludedPlatforms.join(','))
      if (filters.youtubeSafeOnly) params.set('youtubeSafeOnly', 'true')
      if (excludeIds.length > 0) params.set('excludeIds', excludeIds.join(','))

      const response = await fetch(`/api/tracks?${params.toString()}`)
      const data = await response.json()

      if (data.error) {
        toast.error('Failed to fetch tracks')
        set({ tracks: [], totalTracks: 0, loadingTracks: false })
        return
      }

      // Merge DB tracks with custom in-memory tracks
      const apiTracks: Track[] = data.tracks || []
      const customFiltered = getAllTracksSource().filter((ct) => {
        // Apply same filters to custom tracks
        if (filters.search) {
          const s = filters.search.toLowerCase()
          if (!ct.title.toLowerCase().includes(s) && !ct.artist.toLowerCase().includes(s)) return false
        }
        if (filters.genres.length > 0 && !filters.genres.includes(ct.genre)) return false
        if (filters.moods.length > 0 && !filters.moods.includes(ct.mood)) return false
        if (filters.tempo && ct.tempo !== filters.tempo) return false
        if (filters.instrument && ct.instrument !== filters.instrument) return false
        if (filters.licenseTypes.length > 0 && !filters.licenseTypes.includes(ct.licenseType)) return false
        if (filters.sourcePlatform && ct.sourcePlatform !== filters.sourcePlatform) return false
        if (filters.excludedPlatforms.length > 0 && filters.excludedPlatforms.includes(ct.sourcePlatform)) return false
        if (filters.youtubeSafeOnly && !ct.isYoutubeSafe) return false
        if (excludeIds.includes(ct.id)) return false
        return true
      })

      const allTracks = [...apiTracks, ...customFiltered]
      set({
        tracks: allTracks,
        totalTracks: allTracks.length,
        allDbTracks: apiTracks,
        loadingTracks: false,
      })

      // Also set filter options from API response
      if (data.filterOptions) {
        set({ filterOptions: data.filterOptions })
      }
    } catch {
      toast.error('Failed to fetch tracks')
      set({ tracks: [], totalTracks: 0, loadingTracks: false })
    }
  },

  // Filter options — fetched from API
  filterOptions: null,
  fetchFilterOptions: async () => {
    try {
      const response = await fetch('/api/tracks')
      const data = await response.json()
      if (data.filterOptions) {
        set({ filterOptions: data.filterOptions })
      }
    } catch {
      // silently fail
    }
  },

  // Playlist — localStorage-based
  currentPlaylist: null,
  playlists: [],
  createPlaylist: async (name: string, targetDuration?: number) => {
    const now = new Date().toISOString()
    const id = generateId()
    const playlist: PlaylistWithTracks = {
      id,
      name,
      description: null,
      targetDuration: targetDuration || 3600,
      createdAt: now,
      updatedAt: now,
      tracks: [],
    }

    set((state) => {
      const updatedPlaylists = [playlist, ...state.playlists.map((p) => ({ ...p, tracks: [] }))]
      const allStored = loadPlaylistsFromStorage()
      const newStored = [playlist, ...allStored.filter((p) => p.id !== id)]
      savePlaylistsToStorage(newStored)

      return {
        currentPlaylist: playlist,
        playlists: updatedPlaylists,
      }
    })

    return playlist
  },
  loadPlaylist: async (id: string) => {
    const stored = loadPlaylistsFromStorage()
    const playlist = stored.find((p) => p.id === id) || null

    if (playlist) {
      // Resolve track data from DB tracks for playlist tracks
      const { allDbTracks } = get()
      const resolvedTracks: PlaylistTrack[] = playlist.tracks
        .map((pt) => {
          const track = allDbTracks.find((t) => t.id === pt.trackId) || 
            getAllTracksSource().find((t) => t.id === pt.trackId)
          if (!track) {
            // Use the stored track data if available
            return pt.track ? pt : null
          }
          return { ...pt, track }
        })
        .filter(Boolean) as PlaylistTrack[]

      set({
        currentPlaylist: { ...playlist, tracks: resolvedTracks },
      })
    } else {
      set((state) => {
        const pl = state.playlists.find((p) => p.id === id)
        if (pl) {
          return { currentPlaylist: { ...pl, tracks: [] } }
        }
        return {}
      })
    }
  },
  fetchPlaylists: async () => {
    const stored = loadPlaylistsFromStorage()
    const playlistSummaries: Playlist[] = stored.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      targetDuration: p.targetDuration,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))

    set({ playlists: playlistSummaries })

    if (stored.length > 0 && !get().currentPlaylist) {
      const { allDbTracks } = get()
      const first = stored[0]
      const resolvedTracks: PlaylistTrack[] = first.tracks
        .map((pt) => {
          const track = allDbTracks.find((t) => t.id === pt.trackId) ||
            getAllTracksSource().find((t) => t.id === pt.trackId)
          if (!track) {
            return pt.track ? pt : null
          }
          return { ...pt, track }
        })
        .filter(Boolean) as PlaylistTrack[]

      set({
        currentPlaylist: { ...first, tracks: resolvedTracks },
      })
    }
  },
  addTrackToPlaylist: async (trackId: string) => {
    const { currentPlaylist, createPlaylist, tracks, allDbTracks } = get()

    let playlist = currentPlaylist
    if (!playlist) {
      playlist = await createPlaylist('My Lofi Playlist', 3600)
    }

    // Check for duplicate
    if (playlist.tracks.some((t) => t.trackId === trackId)) {
      toast.warning('Track is already in this playlist')
      return
    }

    // Find the track from current tracks or all DB tracks
    const track = tracks.find((t) => t.id === trackId) ||
      allDbTracks.find((t) => t.id === trackId) ||
      getAllTracksSource().find((t) => t.id === trackId)

    if (!track) {
      toast.error('Track not found')
      return
    }

    const now = new Date().toISOString()
    const pt: PlaylistTrack = {
      id: generateId(),
      playlistId: playlist.id,
      trackId,
      position: playlist.tracks.length,
      createdAt: now,
      track,
    }

    const updatedPlaylist: PlaylistWithTracks = {
      ...playlist,
      tracks: [...playlist.tracks, pt],
      updatedAt: now,
    }

    set({ currentPlaylist: updatedPlaylist })

    const stored = loadPlaylistsFromStorage()
    const idx = stored.findIndex((p) => p.id === updatedPlaylist.id)
    if (idx >= 0) {
      stored[idx] = updatedPlaylist
    } else {
      stored.unshift(updatedPlaylist)
    }
    savePlaylistsToStorage(stored)

    toast.success('Track added to playlist')
  },
  removeTrackFromPlaylist: async (trackId: string) => {
    const { currentPlaylist } = get()
    if (!currentPlaylist) return

    const updatedTracks = currentPlaylist.tracks.filter((t) => t.trackId !== trackId)
    const now = new Date().toISOString()

    const updatedPlaylist: PlaylistWithTracks = {
      ...currentPlaylist,
      tracks: updatedTracks.map((t, i) => ({ ...t, position: i })),
      updatedAt: now,
    }

    set({ currentPlaylist: updatedPlaylist })

    const stored = loadPlaylistsFromStorage()
    const idx = stored.findIndex((p) => p.id === updatedPlaylist.id)
    if (idx >= 0) {
      stored[idx] = updatedPlaylist
    } else {
      stored.unshift(updatedPlaylist)
    }
    savePlaylistsToStorage(stored)

    toast.success('Track removed from playlist')
  },
  reorderPlaylist: async (trackIds: string[]) => {
    const { currentPlaylist } = get()
    if (!currentPlaylist) return

    const reorderedTracks = trackIds
      .map((trackId, index) => {
        const pt = currentPlaylist.tracks.find((t) => t.trackId === trackId)
        if (!pt) return null
        return { ...pt, position: index }
      })
      .filter(Boolean) as PlaylistTrack[]

    const now = new Date().toISOString()
    const updatedPlaylist: PlaylistWithTracks = {
      ...currentPlaylist,
      tracks: reorderedTracks,
      updatedAt: now,
    }

    set({
      currentPlaylist: updatedPlaylist,
    })

    const stored = loadPlaylistsFromStorage()
    const idx = stored.findIndex((p) => p.id === updatedPlaylist.id)
    if (idx >= 0) {
      stored[idx] = updatedPlaylist
    } else {
      stored.unshift(updatedPlaylist)
    }
    savePlaylistsToStorage(stored)
  },
  shufflePlaylist: () => {
    const { currentPlaylist, reorderPlaylist } = get()
    if (!currentPlaylist || currentPlaylist.tracks.length <= 1) return

    const trackIds = shuffleArray(currentPlaylist.tracks.map((t) => t.trackId))
    reorderPlaylist(trackIds)
    toast.success('Playlist shuffled!')
  },
  updatePlaylistName: async (name: string) => {
    const { currentPlaylist } = get()
    if (!currentPlaylist) return

    const now = new Date().toISOString()
    const updatedPlaylist: PlaylistWithTracks = {
      ...currentPlaylist,
      name,
      updatedAt: now,
    }

    set({ currentPlaylist: updatedPlaylist })

    const stored = loadPlaylistsFromStorage()
    const idx = stored.findIndex((p) => p.id === updatedPlaylist.id)
    if (idx >= 0) {
      stored[idx] = updatedPlaylist
    }
    savePlaylistsToStorage(stored)

    set((state) => ({
      playlists: state.playlists.map((p) =>
        p.id === updatedPlaylist.id ? { ...p, name, updatedAt: now } : p
      ),
    }))
  },
  updatePlaylistTargetDuration: async (duration: number) => {
    const { currentPlaylist } = get()
    if (!currentPlaylist) return

    const now = new Date().toISOString()
    const updatedPlaylist: PlaylistWithTracks = {
      ...currentPlaylist,
      targetDuration: duration,
      updatedAt: now,
    }

    set({ currentPlaylist: updatedPlaylist })

    const stored = loadPlaylistsFromStorage()
    const idx = stored.findIndex((p) => p.id === updatedPlaylist.id)
    if (idx >= 0) {
      stored[idx] = updatedPlaylist
    }
    savePlaylistsToStorage(stored)

    set((state) => ({
      playlists: state.playlists.map((p) =>
        p.id === updatedPlaylist.id ? { ...p, targetDuration: duration, updatedAt: now } : p
      ),
    }))
  },

  // Export — client-side
  exportedDescription: null,
  exportedTitle: null,
  exportPlaylist: async () => {
    const { currentPlaylist } = get()
    if (!currentPlaylist) return

    try {
      const { title, description } = generateExportData(currentPlaylist)
      if (!title || !description) {
        toast.error('Playlist has no tracks to export')
        return
      }
      set({
        exportedDescription: description,
        exportedTitle: title,
        showExportDialog: true,
      })
    } catch {
      toast.error('Failed to export playlist')
    }
  },

  // Uploaded playlists
  uploadedTracks: [],
  addUploadedTracks: (tracks: UploadedTrack[]) => {
    set((state) => ({
      uploadedTracks: [...state.uploadedTracks, ...tracks],
    }))
  },
  clearUploadedTracks: () => {
    set({ uploadedTracks: [] })
  },

  // Compute excluded track IDs
  getExcludedTrackIds: () => {
    const { currentPlaylist } = get()
    const playlistTrackIds = currentPlaylist?.tracks.map((t) => t.trackId) || []
    return playlistTrackIds
  },

  // UI state
  webSearchResults: null,
  webSearchAnswer: null,
  webSearchLoading: false,
  searchWeb: async (query: string) => {
    set({ webSearchLoading: true, showWebSearchDialog: true, webSearchAnswer: null })
    try {
      const response = await fetch(`/api/search-web?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.error) {
        toast.error('Web search failed: ' + (data.error || 'Unknown error'))
        set({ webSearchResults: [], webSearchLoading: false })
        return
      }

      const results: WebSearchResult[] = (data.results || []).map(
        (r: { name?: string; url?: string; snippet?: string; title?: string; content?: string }) => ({
          name: r.name || r.title || 'Untitled',
          url: r.url || '',
          snippet: r.snippet || r.content || '',
        })
      )

      set({
        webSearchResults: results,
        webSearchAnswer: data.answer || null,
        webSearchLoading: false,
      })

      if (results.length === 0 && !data.answer) {
        toast.info('No results found. Try a different search query.')
      }
    } catch {
      toast.error('Web search failed')
      set({ webSearchResults: [], webSearchLoading: false })
    }
  },
  showExportDialog: false,
  setShowExportDialog: (show: boolean) => set({ showExportDialog: show }),
  showAddTrackDialog: false,
  setShowAddTrackDialog: (show: boolean) => set({ showAddTrackDialog: show }),
  showWebSearchDialog: false,
  setShowWebSearchDialog: (show: boolean) => set({ showWebSearchDialog: show }),
  showUploadDialog: false,
  setShowUploadDialog: (show: boolean) => set({ showUploadDialog: show }),
  expandedTrackId: null,
  setExpandedTrackId: (id: string | null) => set({ expandedTrackId: id }),
  prefillTrackData: null,
  setPrefillTrackData: (data: Partial<Track> | null) => set({ prefillTrackData: data }),

  // Add custom track (in-memory only)
  addCustomTrack: (trackData) => {
    const now = new Date().toISOString()
    const id = generateId()
    const newTrack: Track = {
      ...trackData,
      id,
      createdAt: now,
      updatedAt: now,
    }
    customTracks = [...customTracks, newTrack]

    toast.success('Track added successfully')
    get().fetchTracks()
  },
}))
