import { Loader2 } from "lucide-react"

export default function ListLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <div className="text-center py-4 space-y-1">
            <div className="h-7 w-64 bg-muted rounded mx-auto animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border rounded-xl p-5 space-y-3 animate-pulse">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="flex gap-3">
                  <div className="h-12 flex-1 bg-muted rounded" />
                  <div className="h-12 flex-1 bg-muted rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
