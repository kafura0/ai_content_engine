'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [mode,     setMode]     = useState('login')  // 'login' | 'signup'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [info,     setInfo]     = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.replace('/clients')
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setInfo('Check your email for a confirmation link, then log in.')
        setMode('login')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <span className="font-semibold text-slate-900">Content Engine</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-lg font-semibold text-slate-900 mb-1">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {mode === 'login' ? 'Welcome back.' : 'Start generating content for your clients.'}
          </p>

          {info && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-4">
              {info}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@agency.com" autoComplete="email"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
              className="text-indigo-600 font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
