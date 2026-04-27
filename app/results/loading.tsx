export default function ResultsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-7 w-12 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
