export default function MyPageLoading() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 animate-pulse">
      <div className="h-9 w-32 bg-muted rounded mb-8" />
      <div className="space-y-6">
        {/* 기본 정보 skeleton */}
        <div className="border rounded-lg p-6">
          <div className="h-6 w-24 bg-muted rounded mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
        {/* 활동 요약 skeleton */}
        <div className="border rounded-lg p-6">
          <div className="h-6 w-24 bg-muted rounded mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
        {/* 투표 내역 skeleton */}
        <div className="border rounded-lg p-6">
          <div className="h-6 w-32 bg-muted rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
