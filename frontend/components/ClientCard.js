'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { deleteClient, getClientQuota, setClientActive } from '@/lib/api'

export default function ClientCard({ client, onDeleted, onUpdated }) {
  const colors   = Array.isArray(client.brand_colors) ? client.brand_colors : []
  const primary  = colors[0] || '#6366F1'
  const services = Array.isArray(client.services) ? client.services : []

  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [toggling,   setToggling]   = useState(false)
  const [quota,      setQuota]      = useState(null)

  const isActive = client.is_active !== false

  useEffect(() => {
    getClientQuota(client.id)
      .then(setQuota)
      .catch(() => {})
  }, [client.id])

  async function handleToggleActive() {
    setToggling(true)
    try {
      const updated = await setClientActive(client.id, !isActive)
      onUpdated?.(updated)
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteClient(client.id)
      onDeleted?.(client.id)
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  const quotaPct   = quota ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0
  const quotaColor = !quota ? 'bg-slate-200'
    : quotaPct >= 100 ? 'bg-red-500'
    : quotaPct >= 80  ? 'bg-amber-400'
    : 'bg-emerald-400'

  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-6 transition-all duration-200 flex flex-col ${
      isActive ? 'border-slate-100 hover:shadow-md' : 'border-slate-200 opacity-60'
    }`}>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: isActive ? primary : '#94a3b8' }}
        >
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-[65%]">
          <button
            onClick={handleToggleActive}
            disabled={toggling}
            title={isActive ? 'Click to deactivate' : 'Click to activate'}
            className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors disabled:opacity-50 ${
              isActive
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {toggling ? '…' : isActive ? 'Active' : 'Inactive'}
          </button>
          {colors.slice(0, 4).map((c, i) => (
            <div key={i} className="w-3 h-3 rounded-full border border-slate-200 flex-shrink-0"
              style={{ backgroundColor: c }} />
          ))}
          {colors.length > 4 && (
            <span className="text-xs text-slate-400">+{colors.length - 4}</span>
          )}
          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full capitalize">
            {client.tone_of_voice}
          </span>
        </div>
      </div>

      {/* Info */}
      <h3 className="font-semibold text-slate-900 mb-0.5">{client.name}</h3>
      <p className="text-sm text-slate-500 mb-3 capitalize">{client.industry}</p>

      {client.location && (
        <p className="text-xs text-slate-400 mb-3">📍 {client.location}</p>
      )}

      {services.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {services.slice(0, 3).map((s, i) => (
            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
              {s}
            </span>
          ))}
          {services.length > 3 && (
            <span className="text-xs text-slate-400 px-1">+{services.length - 3}</span>
          )}
        </div>
      )}

      {/* Quota bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Monthly quota</span>
          <span className="text-xs text-slate-500 font-medium">
            {quota ? `${quota.used} / ${quota.limit}` : '—'}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${quotaColor}`}
            style={{ width: `${quotaPct}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50">
        {isActive ? (
          <Link href={`/generate?client=${client.id}`}
            className="flex-1 text-center text-xs font-medium bg-indigo-600 text-white py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors">
            Generate
          </Link>
        ) : (
          <span className="flex-1 text-center text-xs font-medium bg-slate-100 text-slate-400 py-2 px-3 rounded-lg cursor-not-allowed"
            title="Activate client to generate content">
            Generate
          </span>
        )}
        <Link href={`/posts?client=${client.id}`}
          className="flex-1 text-center text-xs font-medium bg-slate-100 text-slate-700 py-2 px-3 rounded-lg hover:bg-slate-200 transition-colors">
          View Posts
        </Link>

        {!confirming ? (
          <button onClick={() => setConfirming(true)}
            className="text-xs font-medium text-slate-400 hover:text-red-500 py-2 px-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete client">
            ✕
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={handleDelete} disabled={deleting}
              className="text-xs font-medium bg-red-500 text-white py-2 px-2.5 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
              {deleting ? '…' : 'Delete'}
            </button>
            <button onClick={() => setConfirming(false)} disabled={deleting}
              className="text-xs font-medium bg-slate-100 text-slate-600 py-2 px-2.5 rounded-lg hover:bg-slate-200 transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
