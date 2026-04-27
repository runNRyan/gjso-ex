export default function SwipeLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="px-4 py-2">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-16 bg-muted rounded-full animate-pulse shrink-0" />
            ))}
          </div>
        </div>
        <div className="px-4 pt-4">
          <div className="border rounded-xl p-5 space-y-3 animate-pulse">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-6 w-3/4 bg-muted rounded" />
            <div className="flex gap-3">
              <div className="h-14 flex-1 bg-muted rounded" />
              <div className="h-14 flex-1 bg-muted rounded" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
