'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PostCard from '@/components/PostCard'
import { getClients, generateContent, getClientQuota } from '@/lib/api'

function Spinner({ size = 5 }) {
  return (
    <svg className={`animate-spin w-${size} h-${size} text-indigo-600`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function GeneratePage() {
  const searchParams = useSearchParams()
  const preselected = searchParams.get('client')

  const [clients,  setClients]  = useState([])
  const [clientId, setClientId] = useState(preselected || '')
  const [count,    setCount]    = useState(5)
  const [posts,    setPosts]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [quota,    setQuota]    = useState(null)

  useEffect(() => {
    getClients()
      .then(d => setClients(d.clients || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!clientId) { setQuota(null); return }
    getClientQuota(clientId).then(setQuota).catch(() => setQuota(null))
  }, [clientId])

  function handleClientChange(e) {
    setClientId(e.target.value)
    setPosts([])
    setError(null)
  }

  async function handleGenerate() {
    if (!clientId) return
    setLoading(true)
    setError(null)
    setPosts([])
    try {
      const data = await generateContent(clientId, count)
      setPosts(data.posts || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const selected = clients.find(c => c.id === clientId)
  const colors = Array.isArray(selected?.brand_colors) ? selected.brand_colors : []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Generate Content</h1>
        <p className="text-sm text-slate-500 mt-1">Create viral social media posts for a client</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Client</label>
            <select value={clientId} onChange={handleClientChange} disabled={loading}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
              <option value="">— Select a client —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.industry}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Posts</label>
            <input type="number" min={1} max={10} value={count}
              onChange={e => setCount(Number(e.target.value))} disabled={loading}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
          </div>
          <button onClick={handleGenerate} disabled={!clientId || loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
            {loading ? <><Spinner size={4} /> Generating...</> : '✦ Generate'}
          </button>
        </div>

        {/* Quota indicator */}
        {quota && (
          <div className={`mt-4 pt-4 border-t border-slate-50 text-xs font-medium px-3 py-2 rounded-lg ${
            quota.remaining === 0 ? 'bg-red-50 text-red-600'
            : quota.remaining <= 3 ? 'bg-amber-50 text-amber-700'
            : 'bg-slate-50 text-slate-500'
          }`}>
            {quota.remaining === 0
              ? `Quota reached: ${quota.used}/${quota.limit} posts used this month`
              : `${quota.used}/${quota.limit} posts used this month · ${quota.remaining} remaining`}
          </div>
        )}

        {/* Selected client meta */}
        {selected && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-50">
            {colors.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
                {colors.slice(0, 6).map((c, i) => (
                  <span key={i} className="w-3 h-3 rounded-full border border-slate-200"
                    style={{ backgroundColor: c }} />
                ))}
                <span className="text-xs text-slate-500 ml-0.5">Brand colors</span>
              </div>
            )}
            <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full capitalize">{selected.tone_of_voice}</span>
            {selected.location && (
              <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full">📍 {selected.location}</span>
            )}
            {selected.image_style && (
              <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full capitalize">{selected.image_style} style</span>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-24">
          <div className="inline-flex flex-col items-center gap-4">
            <Spinner size={10} />
            <p className="text-slate-700 font-medium">Generating content...</p>
            <p className="text-slate-400 text-sm">Claude is writing your posts. Takes 20–40 seconds.</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && posts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-slate-900">
              {posts.length} posts generated for{' '}
              <span className="text-indigo-600">{selected?.name}</span>
            </h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Saved to database</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(p => <PostCard key={p.id} post={p} />)}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">✨</div>
          <p className="text-slate-500 text-sm">Select a client and click Generate to start.</p>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading...</div>}>
      <GeneratePage />
    </Suspense>
  )
}
