'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PostCard from '@/components/PostCard'
import { getClients, getPosts } from '@/lib/api'

function PostsPage() {
  const searchParams = useSearchParams()
  const preselected = searchParams.get('client')

  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState(preselected || '')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getClients()
      .then(d => setClients(d.clients || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (preselected) {
      setClientId(preselected)
      load(preselected)
    }
  }, [preselected])

  async function load(id) {
    setLoading(true)
    setError(null)
    try {
      const data = await getPosts(id)
      setPosts(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const id = e.target.value
    setClientId(id)
    if (id) load(id)
    else setPosts([])
  }

  const selected = clients.find(c => c.id === clientId)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Posts</h1>
        <p className="text-sm text-slate-500 mt-1">All generated posts per client</p>
      </div>

      {/* Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 sm:max-w-sm">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Client</label>
            <select value={clientId} onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Select a client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.industry}</option>
              ))}
            </select>
          </div>
          {selected && posts.length > 0 && (
            <p className="text-sm text-slate-500 pb-2.5">
              <span className="font-semibold text-slate-900">{posts.length}</span> post{posts.length > 1 ? 's' : ''} for {selected.name}
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading posts...</div>
      )}

      {/* Posts grid */}
      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(p => (
            <PostCard
              key={p.id}
              post={p}
              showPublish={!!(selected?.facebook_page_id || selected?.instagram_account_id)}
            />
          ))}
        </div>
      )}

      {/* Empty — client selected but no posts */}
      {!loading && !error && clientId && posts.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-slate-500 text-sm mb-3">No posts yet for this client.</p>
          <a href={`/generate?client=${clientId}`}
            className="inline-block text-xs font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Generate posts
          </a>
        </div>
      )}

      {/* Empty — no client selected */}
      {!loading && !clientId && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-500 text-sm">Select a client to view their posts.</p>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading...</div>}>
      <PostsPage />
    </Suspense>
  )
}
