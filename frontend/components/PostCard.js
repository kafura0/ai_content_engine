'use client'

import { useState } from 'react'
import { publishPost } from '@/lib/api'

export default function PostCard({ post: initialPost, showPublish = false }) {
  const [post,        setPost]        = useState(initialPost)
  const [publishing,  setPublishing]  = useState(null)  // platform name while publishing
  const [publishErr,  setPublishErr]  = useState(null)

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
        <p className="font-semibold text-slate-900 text-sm leading-snug mb-3">
          {post.hook}
        </p>
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-4 mb-4">
          {post.caption}
        </p>
        {post.call_to_action && (
          <p className="text-xs font-medium text-indigo-600 mb-4">
            → {post.call_to_action}
          </p>
        )}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {hashtags.slice(0, 5).map((tag, i) => (
              <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
            {hashtags.length > 5 && (
              <span className="text-xs text-slate-400 py-0.5">+{hashtags.length - 5}</span>
            )}
          </div>
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
          <span className="text-xs text-slate-400 ml-auto">{date}</span>
        </div>
      </div>
    </div>
  )
}
