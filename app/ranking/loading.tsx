export default function RankingLoading() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 animate-pulse">
      <div className="h-9 w-24 bg-muted rounded mb-8" />
      <div className="space-y-6">
        {/* My Rank Card skeleton */}
        <div className="border rounded-lg p-6 bg-accent/50">
          <div className="h-6 w-20 bg-muted rounded mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-16 bg-muted rounded" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-7 w-20 bg-muted rounded ml-auto" />
              <div className="h-3 w-16 bg-muted rounded ml-auto" />
            </div>
          </div>
        </div>
        {/* TOP 100 List skeleton */}
        <div className="border rounded-lg p-6">
          <div className="h-6 w-24 bg-muted rounded mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-7 w-10 bg-muted rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-5 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
