'use client'

import { Music, Sparkles } from 'lucide-react'

export function Header() {
  return (
    <header className="relative overflow-hidden border-b border-purple-900/30 bg-gradient-to-r from-slate-950 via-purple-950/30 to-slate-950">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-20 w-60 rounded-full bg-amber-500/3 blur-2xl" />
      </div>

      <div className="relative flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
            <Music className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              LofiCrate
            </h1>
            <p className="text-xs text-purple-300/70 sm:text-sm">
              CC-Licensed Lofi Playlist Builder for YouTube
              <span className="hidden sm:inline text-[10px] text-purple-300/40"> (конструктор плейлистов)</span>
            </p>
          </div>
        </div>

        {/* Animated pulse indicator */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-amber-400/40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
          </div>
          <span className="hidden text-xs text-amber-400/70 sm:inline">Live</span>
          <Sparkles className="ml-1 h-4 w-4 text-amber-400/40" />
        </div>
      </div>
    </header>
  )
}
