import { fetchDashboardStats } from '@/lib/admin/dashboard-actions'
import DashboardClient from './dashboard-client'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 bg-muted rounded" />
        <div className="h-8 w-48 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 bg-muted rounded-xl" />
        <div className="h-56 bg-muted rounded-xl" />
      </div>
    </div>
  )
}

async function DashboardContent() {
  const result = await fetchDashboardStats(7, true)

  if (result.error || !result.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          {result.error ?? '데이터를 불러올 수 없습니다.'}
        </p>
      </div>
    )
  }

  return <DashboardClient initialData={result.data} />
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
