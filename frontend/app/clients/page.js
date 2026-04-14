'use client'

import { useState, useEffect } from 'react'
import ClientCard from '@/components/ClientCard'
import { getClients, createClient } from '@/lib/api'

const TONES = ['professional', 'casual', 'premium', 'playful', 'bold', 'inspirational']
const STYLES = ['cinematic', 'realistic', 'minimal', 'bold', 'editorial', 'lifestyle']
const GOALS = ['engagement', 'leads', 'awareness', 'retention']

const blank = {
  name: '', industry: '', tone_of_voice: 'professional',
  brand_colors_primary: '#6366F1', brand_colors_secondary: '#ffffff',
  image_style: 'cinematic', services: '', target_audience: '',
  location: '', posting_goals: ['leads'], logo_url: '',
}

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(blank)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const data = await getClients()
      setClients(data.clients || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function set(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  function toggleGoal(g) {
    setForm(p => ({
      ...p,
      posting_goals: p.posting_goals.includes(g)
        ? p.posting_goals.filter(x => x !== g)
        : [...p.posting_goals, g],
    }))
  }

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      await createClient({
        name: form.name,
        industry: form.industry,
        tone_of_voice: form.tone_of_voice,
        brand_colors: { primary: form.brand_colors_primary, secondary: form.brand_colors_secondary },
        image_style: form.image_style,
        services: form.services.split(',').map(s => s.trim()).filter(Boolean),
        target_audience: form.target_audience,
        location: form.location || null,
        posting_goals: form.posting_goals,
        logo_url: form.logo_url || null,
      })
      setForm(blank)
      setShowForm(false)
      await load()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-1">
            {clients.length > 0 ? `${clients.length} client${clients.length > 1 ? 's' : ''}` : 'No clients yet'}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setFormError(null) }}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Client'}
        </button>
      </div>

      {/* Add Client form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7 mb-8">
          <h2 className="text-base font-semibold text-slate-900 mb-6">New Client Profile</h2>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <Field label="Business Name *">
              <input name="name" value={form.name} onChange={set} required placeholder="Apex Electrical" className={input} />
            </Field>

            <Field label="Industry *">
              <input name="industry" value={form.industry} onChange={set} required placeholder="electrical contracting" className={input} />
            </Field>

            <Field label="Tone of Voice *">
              <select name="tone_of_voice" value={form.tone_of_voice} onChange={set} className={input}>
                {TONES.map(t => <option key={t} value={t}>{cap(t)}</option>)}
              </select>
            </Field>

            <Field label="Image Style *">
              <select name="image_style" value={form.image_style} onChange={set} className={input}>
                {STYLES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
              </select>
            </Field>

            <Field label="Brand Colors">
              <div className="flex gap-3">
                {[['brand_colors_primary', 'Primary'], ['brand_colors_secondary', 'Secondary']].map(([name, label]) => (
                  <div key={name} className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
                      <input type="color" name={name} value={form[name]} onChange={set}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                      <span className="text-xs text-slate-600 font-mono">{form[name]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Field>

            <Field label="Target Audience *">
              <input name="target_audience" value={form.target_audience} onChange={set} required
                placeholder="homeowners in Nairobi" className={input} />
            </Field>

            <Field label="Services (comma separated) *">
              <input name="services" value={form.services} onChange={set} required
                placeholder="wiring, solar installation, CCTV" className={input} />
            </Field>

            <Field label="Location">
              <input name="location" value={form.location} onChange={set}
                placeholder="Nairobi, Kenya" className={input} />
            </Field>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-2">Posting Goals *</label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(g => (
                  <button key={g} type="button" onClick={() => toggleGoal(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      form.posting_goals.includes(g)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {cap(g)}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <Field label="Logo URL (optional)">
                <input name="logo_url" value={form.logo_url} onChange={set}
                  placeholder="https://..." className={input} />
              </Field>
            </div>

            {formError && (
              <div className="md:col-span-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                {formError}
              </div>
            )}

            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={submitting}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {submitting ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Client grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-slate-500 text-sm">No clients yet. Add your first client above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(c => <ClientCard key={c.id} client={c} />)}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────
const input = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
