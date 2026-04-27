import { fetchWorldcupStats } from '@/lib/admin/worldcup-actions'
import WorldcupClient from './worldcup-client'

export const dynamic = 'force-dynamic'

export default async function WorldcupPage() {
  const result = await fetchWorldcupStats(30)

  if (result.error || !result.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">
          {result.error ?? '데이터를 불러올 수 없습니다.'}
        </p>
      </div>
    )
  }

  return <WorldcupClient initialData={result.data} />
}
