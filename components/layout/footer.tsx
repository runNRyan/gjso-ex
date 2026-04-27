import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="hidden sm:block mt-auto bg-[#1E5C52]">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white/70">
        <p>© 2026 결정소. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
        </div>
      </div>
    </footer>
  )
}
