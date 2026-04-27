import Image from 'next/image'
import Link from 'next/link'
import AuthButton from '@/components/auth/auth-button'

import { BookmarkNav } from './bookmark-nav'
import { NavLinks } from './nav-links'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#1E5C52]">
      <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-1.5 text-lg sm:text-xl font-bold text-white hover:opacity-80">
          <Image src="/logo_select.svg" alt="결정소 로고" width={35} height={35} className="sm:w-8 sm:h-8 brightness-0 invert" />
          결정소
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <NavLinks />
            <BookmarkNav />
          </div>
          <AuthButton />
        </div>
      </div>
    </header>
  )
}
