'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLofiCrateStore } from '@/lib/store'
import { TrackCard } from './TrackCard'
import { FilterBar } from './FilterBar'
import { AddTrackButton } from './AddTrackDialog'
import { Skeleton } from '@/components/ui/skeleton'

export function TrackLibrary() {
  const { tracks, loadingTracks, totalTracks, fetchTracks, fetchFilterOptions, fetchPlaylists } = useLofiCrateStore()

  useEffect(() => {
    fetchFilterOptions()
    fetchTracks()
    fetchPlaylists()
  }, [fetchFilterOptions, fetchTracks, fetchPlaylists])

  return (
    <div className="space-y-4">
      <FilterBar />

      {/* Track count */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-purple-300/50">
          {totalTracks} track{totalTracks !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Track List */}
      {loadingTracks ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-purple-900/20 bg-slate-950/60 p-3">
              <Skeleton className="h-4 w-3/4 bg-purple-900/20" />
              <Skeleton className="h-3 w-1/2 bg-purple-900/20" />
              <div className="flex gap-1.5">
                <Skeleton className="h-4 w-14 rounded-full bg-purple-900/20" />
                <Skeleton className="h-4 w-12 rounded-full bg-purple-900/20" />
                <Skeleton className="h-4 w-16 rounded-full bg-purple-900/20" />
              </div>
            </div>
          ))}
        </div>
      ) : tracks.length > 0 ? (
        <ScrollArea className="max-h-[calc(100vh-320px)]">
          <div className="space-y-2 pr-1">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-2 text-3xl">🎧</div>
          <p className="text-sm text-purple-300/40">No tracks found</p>
          <p className="text-xs text-purple-300/30">Try adjusting your filters or search query</p>
        </div>
      )}

      <AddTrackButton />
    </div>
  )
}
