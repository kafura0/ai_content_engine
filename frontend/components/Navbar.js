'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const links = [
  { href: '/clients',  label: 'Clients'  },
  { href: '/generate', label: 'Generate' },
  { href: '/posts',    label: 'Posts'    },
]

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()

  if (pathname === '/login') return null

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">Content Engine</span>
          </div>
          <div className="flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
