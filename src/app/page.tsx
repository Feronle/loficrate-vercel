'use client'

import { useState } from 'react'
import { Header } from '@/components/lofi/Header'
import { TrackLibrary } from '@/components/lofi/TrackLibrary'
import { PlaylistBuilder } from '@/components/lofi/PlaylistBuilder'
import { PlaylistGenerator } from '@/components/lofi/PlaylistGenerator'
import { AddTrackDialog } from '@/components/lofi/AddTrackDialog'
import { WebSearchDialog } from '@/components/lofi/WebSearchDialog'
import { Toaster } from '@/components/ui/sonner'
import { Search, Layers } from 'lucide-react'

type Tab = 'search-build' | 'generator'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('search-build')

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      {/* Custom scrollbar + atmospheric background */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.2);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.4);
        }
      `}</style>

      <Header />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Tab Navigation */}
          <div className="mb-6 flex gap-1 rounded-lg border border-purple-900/30 bg-slate-950/50 p-1">
            <button
              onClick={() => setActiveTab('search-build')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'search-build'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-purple-300/60 hover:bg-purple-900/20 hover:text-purple-200'
              }`}
            >
              <Search className="h-4 w-4" />
              Search & Build
              <span className={`text-[9px] ${activeTab === 'search-build' ? 'text-slate-950/60' : 'text-purple-300/30'}`}>
                (поиск и сборка)
              </span>
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'generator'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-purple-300/60 hover:bg-purple-900/20 hover:text-purple-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              Playlist Generator
              <span className={`text-[9px] ${activeTab === 'generator' ? 'text-slate-950/60' : 'text-purple-300/30'}`}>
                (генератор плейлистов)
              </span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'search-build' ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* Left Column - Track Library */}
              <div>
                <TrackLibrary />
              </div>

              {/* Right Column - Playlist Builder */}
              <div>
                <div className="lg:sticky lg:top-6">
                  <PlaylistBuilder />
                </div>
              </div>
            </div>
          ) : (
            <PlaylistGenerator />
          )}
        </div>
      </main>

      {/* Dialogs */}
      <AddTrackDialog />
      <WebSearchDialog />

      {/* Footer */}
      <footer className="mt-auto border-t border-purple-900/20 bg-slate-950/50 px-4 py-3 text-center">
        <p className="text-xs text-purple-300/30">
          LofiCrate • Built with 🎵 for the lofi community • All tracks are CC-licensed
        </p>
      </footer>

      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'border-purple-900/30 bg-slate-950 text-white',
        }}
      />
    </div>
  )
}
