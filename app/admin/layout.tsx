import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/actions'
import AdminSidebar from './admin-sidebar'

export const metadata = {
  title: '관리자 | 결정소',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()
  if (!profile || profile.user_type !== 'admin') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar spacer */}
        <div className="md:hidden h-12 shrink-0" />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
