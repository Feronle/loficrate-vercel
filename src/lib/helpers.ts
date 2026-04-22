'use client'

import { Track } from '@/lib/store'

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function getLicenseColor(licenseType: string): string {
  const safeLicenses = ['CC-BY-4.0', 'CC-BY-3.0', 'CC0', 'Pixabay']
  const cautionLicenses = ['CC-BY-SA']
  const unsafeLicenses = ['CC-BY-NC', 'CC-BY-ND', 'CC-BY-NC-SA', 'CC-BY-NC-ND']

  if (safeLicenses.includes(licenseType)) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (cautionLicenses.includes(licenseType)) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (unsafeLicenses.includes(licenseType)) return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
  return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
}

export function getLicenseSafetyLevel(licenseType: string): 'safe' | 'caution' | 'unsafe' {
  const safeLicenses = ['CC-BY-4.0', 'CC-BY-3.0', 'CC0', 'Pixabay']
  const cautionLicenses = ['CC-BY-SA']
  const unsafeLicenses = ['CC-BY-NC', 'CC-BY-ND', 'CC-BY-NC-SA', 'CC-BY-NC-ND']

  if (safeLicenses.includes(licenseType)) return 'safe'
  if (cautionLicenses.includes(licenseType)) return 'caution'
  if (unsafeLicenses.includes(licenseType)) return 'unsafe'
  return 'caution'
}

export function isLicenseIncompatible(licenseType: string): boolean {
  return ['CC-BY-NC', 'CC-BY-ND', 'CC-BY-NC-SA', 'CC-BY-NC-ND'].includes(licenseType)
}

export function generateExportDescription(playlistName: string, tracks: { track: Track; position: number }[], description?: string | null): { title: string; description: string } {
  if (tracks.length === 0) return { title: '', description: '' }

  const totalDuration = tracks.reduce((sum, pt) => sum + pt.track.durationSec, 0)
  const genres = [...new Set(tracks.map((pt) => pt.track.genre))]
  const moods = [...new Set(tracks.map((pt) => pt.track.mood))]
  const genreStr = genres.slice(0, 2).join(' / ')
  const moodStr = moods.slice(0, 2).join(' ')

  const durationStr = formatDuration(totalDuration)
  const title = `🌙 Lofi Radio • ${moodStr} Beats to Study/Relax to [${durationStr}]`

  const lines: string[] = []
  lines.push(description || `A curated ${genreStr} playlist perfect for studying, relaxing, and chilling.`)
  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('🎵 TRACKLIST & CREDITS')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')

  let currentTime = 0
  for (const pt of tracks) {
    const timestamp = formatTimestamp(currentTime)
    lines.push(`${timestamp} — "${pt.track.title}" by ${pt.track.artist}`)
    lines.push(`   📜 License: ${pt.track.licenseType}`)
    lines.push(`   🔗 ${pt.track.sourceUrl}`)
    if (pt.track.notes) {
      lines.push(`   ⚠️ ${pt.track.notes}`)
    }
    currentTime += pt.track.durationSec
  }

  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('📎 All tracks used under their respective Creative Commons licenses.')
  lines.push('If you are the author of any track and wish it removed, please contact me.')
  lines.push('')
  lines.push('#lofi #lofimusic #chillbeats #studybeats #lofiradio')

  return { title, description: lines.join('\n') }
}
