'use client'

import { Loader2, ExternalLink, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLofiCrateStore } from '@/lib/store'
import { ScrollArea } from '@/components/ui/scroll-area'

export function WebSearchDialog() {
  const { showWebSearchDialog, setShowWebSearchDialog, webSearchResults, webSearchLoading, webSearchAnswer, setPrefillTrackData, setShowAddTrackDialog } = useLofiCrateStore()

  const handleAddAsTrack = (result: { name: string; url: string; snippet: string }) => {
    setPrefillTrackData({
      title: result.name,
      sourceUrl: result.url,
    })
    setShowWebSearchDialog(false)
    setShowAddTrackDialog(true)
  }

  return (
    <Dialog open={showWebSearchDialog} onOpenChange={setShowWebSearchDialog}>
      <DialogContent className="border-purple-900/30 bg-slate-950 text-white sm:max-w-lg [&>button]:text-purple-300/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-400">
            <Sparkles className="h-4 w-4" />
            Web Search Results
            <span className="text-[9px] text-purple-300/40">(результаты поиска)</span>
          </DialogTitle>
        </DialogHeader>

        {/* AI Answer */}
        {webSearchAnswer && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-400">
              <Sparkles className="h-3 w-3" />
              AI Summary <span className="text-[9px] text-amber-400/40">(ИИ-сводка)</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-200/70">{webSearchAnswer}</p>
          </div>
        )}

        {webSearchLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <span className="ml-3 text-sm text-purple-300/60">Searching the web...</span>
            <span className="ml-1 text-[9px] text-purple-300/30">(поиск в интернете)</span>
          </div>
        ) : webSearchResults && webSearchResults.length > 0 ? (
          <ScrollArea className="max-h-96">
            <div className="space-y-3 pr-3">
              {webSearchResults.map((result, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-purple-900/20 bg-slate-950/60 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-white">{result.name}</h4>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-amber-400/70 hover:text-amber-300"
                      >
                        <span className="truncate max-w-[250px]">{result.url}</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      </a>
                      {result.snippet && (
                        <p className="mt-1 text-xs leading-relaxed text-purple-300/50 line-clamp-3">
                          {result.snippet}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => handleAddAsTrack(result)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : webSearchResults && webSearchResults.length === 0 ? (
          <div className="py-8 text-center text-sm text-purple-300/50">
            No results found. Try a different search query.
            <span className="block text-[9px] text-purple-300/30 mt-1">Ничего не найдено. Попробуйте другой запрос.</span>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
