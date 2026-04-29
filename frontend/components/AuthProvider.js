'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthProvider({ children }) {
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && pathname !== '/login') {
        router.replace('/login')
      } else {
        setReady(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session && pathname !== '/login') {
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname])

  if (!ready && pathname !== '/login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return children
}
