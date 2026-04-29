'use client'

import { useState } from 'react'
import { publishPost, editPost } from '@/lib/api'

export default function PostCard({ post: initialPost, showPublish = false }) {
  const [post,        setPost]        = useState(initialPost)
  const [publishing,  setPublishing]  = useState(null)
  const [publishErr,  setPublishErr]  = useState(null)
  const [editing,     setEditing]     = useState(false)
  const [editForm,    setEditForm]    = useState({})
  const [saving,      setSaving]      = useState(false)
  const [saveErr,     setSaveErr]     = useState(null)

  const hashtags    = Array.isArray(post.hashtags) ? post.hashtags : []
  const publishedTo = Array.isArray(post.published_to) ? post.published_to : []
  const date = new Date(post.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  const typeColors = {
    educational:       'bg-blue-500',
    authority:         'bg-violet-500',
    social_proof:      'bg-green-500',
    problem_solution:  'bg-orange-500',
    behind_the_scenes: 'bg-pink-500',
  }
  const typeBadge = typeColors[post.content_type] || 'bg-slate-500'

  function startEdit() {
    setEditForm({
      hook:            post.hook,
      caption:         post.caption,
      call_to_action:  post.call_to_action,
      hashtags:        (post.hashtags || []).join(' '),
    })
    setSaveErr(null)
    setEditing(true)
  }

  async function saveEdit() {
    setSaving(true)
    setSaveErr(null)
    try {
      const updated = await editPost(post.id, {
        hook:           editForm.hook,
        caption:        editForm.caption,
        call_to_action: editForm.call_to_action,
        hashtags:       editForm.hashtags.split(/\s+/).filter(Boolean),
      })
      setPost(updated)
      setEditing(false)
    } catch (e) {
      setSaveErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish(platform) {
    setPublishing(platform)
    setPublishErr(null)
    try {
      const updated = await publishPost(post.id, platform)
      setPost(updated)
    } catch (e) {
      setPublishErr(e.message)
    } finally {
      setPublishing(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">

      {/* Image area */}
      <div className="aspect-video bg-slate-100 relative overflow-hidden flex-shrink-0">
        {post.image_url ? (
          <img src={post.image_url} alt={post.hook} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center gap-2">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-xl">🖼️</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
              {post.image_prompt}
            </p>
          </div>
        )}
        {post.content_type && (
          <span className={`absolute top-3 left-3 ${typeBadge} text-white text-xs px-2.5 py-1 rounded-full capitalize font-medium`}>
            {post.content_type.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        {editing ? (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Hook</label>
              <textarea value={editForm.hook} onChange={e => setEditForm(p => ({ ...p, hook: e.target.value }))}
                rows={2} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Caption</label>
              <textarea value={editForm.caption} onChange={e => setEditForm(p => ({ ...p, caption: e.target.value }))}
                rows={4} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Call to Action</label>
              <input value={editForm.call_to_action} onChange={e => setEditForm(p => ({ ...p, call_to_action: e.target.value }))}
                className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Hashtags (space separated)</label>
              <input value={editForm.hashtags} onChange={e => setEditForm(p => ({ ...p, hashtags: e.target.value }))}
                className={`${inp} font-mono text-xs`} />
            </div>
            {saveErr && <p className="text-xs text-red-500">{saveErr}</p>}
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 text-xs font-medium bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} disabled={saving}
                className="flex-1 text-xs font-medium bg-slate-100 text-slate-600 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-semibold text-slate-900 text-sm leading-snug mb-3">{post.hook}</p>
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-4 mb-4">{post.caption}</p>
            {post.call_to_action && (
              <p className="text-xs font-medium text-indigo-600 mb-4">→ {post.call_to_action}</p>
            )}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {hashtags.slice(0, 5).map((tag, i) => (
                  <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
                {hashtags.length > 5 && (
                  <span className="text-xs text-slate-400 py-0.5">+{hashtags.length - 5}</span>
                )}
              </div>
            )}
          </>
        )}

        {/* Publish buttons */}
        {showPublish && (
          <div className="mb-3">
            {publishErr && (
              <p className="text-xs text-red-500 mb-2">{publishErr}</p>
            )}
            <div className="flex gap-2">
              {['facebook', 'instagram'].map(platform => {
                const done = publishedTo.includes(platform)
                return (
                  <button
                    key={platform}
                    onClick={() => !done && handlePublish(platform)}
                    disabled={!!publishing || done}
                    className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-lg transition-colors ${
                      done
                        ? 'bg-emerald-50 text-emerald-600 cursor-default'
                        : publishing === platform
                        ? 'bg-slate-100 text-slate-400 cursor-wait'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {done ? `✓ ${platform}` : publishing === platform ? '...' : platform}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
          {post.emotional_trigger && (
            <span className="text-xs text-slate-400 capitalize bg-slate-50 px-2 py-0.5 rounded-full">
              {post.emotional_trigger}
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {!editing && (
              <button onClick={startEdit}
                className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                title="Edit post">
                ✎
              </button>
            )}
            <span className="text-xs text-slate-400">{date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
