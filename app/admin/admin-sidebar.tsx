'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, HelpCircle, Gamepad2, ExternalLink, Menu, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/admin/worldcup', label: '불호월드컵', icon: Gamepad2, exact: false },
  { href: '/admin/questions', label: '질문 관리', icon: HelpCircle, exact: false },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <span className="text-white font-bold text-lg tracking-tight">결정소 관리자</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <a
          href="https://www.example.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          example.com 바로가기
        </a>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          ← 사이트로 돌아가기
        </Link>
        <p className="px-3 pt-2 text-white/30 text-xs">© 2026 결정소</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-56 shrink-0 flex-col"
        style={{ backgroundColor: '#1E5C52' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 shadow"
        style={{ backgroundColor: '#1E5C52' }}
      >
        <button
          onClick={() => setOpen(true)}
          className="text-white p-1 rounded"
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-sm">결정소 관리자</span>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-64 flex flex-col h-full shadow-xl"
            style={{ backgroundColor: '#1E5C52' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <span className="text-white font-bold text-base">결정소 관리자</span>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white p-1"
                aria-label="메뉴 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-white/15 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="px-5 py-4 border-t border-white/10">
              <Link
                href="/"
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                ← 사이트로 돌아가기
              </Link>
            </div>
          </div>
          <div className="flex-1 bg-black/40" />
        </div>
      )}

    </>
  )
}
