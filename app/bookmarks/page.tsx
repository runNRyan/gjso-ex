import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookmarkList } from '@/components/mypage/bookmark-list'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function BookmarksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📚 저장한 책갈피</h1>
        <p className="text-muted-foreground">
          관심있는 질문들을 저장하고 나중에 다시 확인해보세요.
        </p>
      </div>

      <BookmarkList />
    </div>
  )
}
