'use client'

import { useState, useEffect } from 'react'
import ClientCard from '@/components/ClientCard'
import { getClients, createClient } from '@/lib/api'

const TONES  = ['professional', 'casual', 'premium', 'playful', 'bold', 'inspirational']
const STYLES = ['cinematic', 'realistic', 'minimal', 'bold', 'editorial', 'lifestyle']
const GOALS  = ['engagement', 'leads', 'awareness', 'retention']

const blank = {
  name: '', industry: '', tone_of_voice: 'professional',
  brand_colors: [],
  _color_picker: '#6366F1',
  image_style: 'cinematic', services: '', target_audience: '',
  location: '', posting_goals: ['leads'], logo_url: '',
}

export default function ClientsPage() {
  const [clients,    setClients]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(blank)
  const [submitting, setSubmitting] = useState(false)
  const [formError,  setFormError]  = useState(null)

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

  function addColor() {
    const color = form._color_picker.trim()
    if (!color || form.brand_colors.length >= 10) return
    if (form.brand_colors.includes(color)) return
    setForm(p => ({ ...p, brand_colors: [...p.brand_colors, color] }))
  }

  function removeColor(index) {
    setForm(p => ({ ...p, brand_colors: p.brand_colors.filter((_, i) => i !== index) }))
  }

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      await createClient({
        name:            form.name,
        industry:        form.industry,
        tone_of_voice:   form.tone_of_voice,
        brand_colors:    form.brand_colors.length > 0 ? form.brand_colors : null,
        image_style:     form.image_style,
        services:        form.services.split(',').map(s => s.trim()).filter(Boolean),
        target_audience: form.target_audience,
        location:        form.location || null,
        posting_goals:   form.posting_goals,
        logo_url:        form.logo_url || null,
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
              <input name="name" value={form.name} onChange={set} required
                placeholder="Apex Electrical" className={inp} />
            </Field>

            <Field label="Industry *">
              <input name="industry" value={form.industry} onChange={set} required
                placeholder="electrical contracting" className={inp} />
            </Field>

            <Field label="Tone of Voice *">
              <select name="tone_of_voice" value={form.tone_of_voice} onChange={set} className={inp}>
                {TONES.map(t => <option key={t} value={t}>{cap(t)}</option>)}
              </select>
            </Field>

            <Field label="Image Style *">
              <select name="image_style" value={form.image_style} onChange={set} className={inp}>
                {STYLES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
              </select>
            </Field>

            {/* Brand Colors — array, max 10 */}
            <div className="md:col-span-2">
              <Field label={`Brand Colors (${form.brand_colors.length}/10)`}>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="_color_picker"
                      value={form._color_picker}
                      onChange={set}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <input
                      type="text"
                      name="_color_picker"
                      value={form._color_picker}
                      onChange={set}
                      placeholder="#6366F1"
                      className={`${inp} flex-1 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={addColor}
                      disabled={form.brand_colors.length >= 10}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {form.brand_colors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.brand_colors.map((color, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                          <span className="w-4 h-4 rounded-full border border-slate-200 flex-shrink-0"
                            style={{ backgroundColor: color }} />
                          <span className="text-xs font-mono text-slate-600">{color}</span>
                          <button type="button" onClick={() => removeColor(i)}
                            className="text-slate-400 hover:text-red-400 ml-0.5 text-base leading-none transition-colors">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
            </div>

            <Field label="Target Audience *">
              <input name="target_audience" value={form.target_audience} onChange={set} required
                placeholder="homeowners in Nairobi" className={inp} />
            </Field>

            <Field label="Services (comma separated) *">
              <input name="services" value={form.services} onChange={set} required
                placeholder="wiring, solar installation, CCTV" className={inp} />
            </Field>

            <Field label="Location">
              <input name="location" value={form.location} onChange={set}
                placeholder="Nairobi, Kenya" className={inp} />
            </Field>

            <Field label="Logo URL (optional)">
              <input name="logo_url" value={form.logo_url} onChange={set}
                placeholder="https://..." className={inp} />
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
          {clients.map(c => (
            <ClientCard key={c.id} client={c}
              onDeleted={id => setClients(prev => prev.filter(x => x.id !== id))}
              onUpdated={updated => setClients(prev => prev.map(x => x.id === updated.id ? updated : x))} />
          ))}
        </div>
      )}
    </div>
  )
}

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
