export default function QuestionDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-6">
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
          <div className="border rounded-xl p-6 space-y-4 animate-pulse">
            <div className="h-6 w-20 bg-muted rounded" />
            <div className="h-16 w-full bg-muted rounded" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-3 w-12 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
