'use client'

import { useState, useEffect } from 'react'
import ClientCard from '@/components/ClientCard'
import { getClients, createClient, getStats } from '@/lib/api'

const TONES     = ['professional', 'casual', 'premium', 'playful', 'bold', 'inspirational']
const STYLES    = ['cinematic', 'realistic', 'minimal', 'bold', 'editorial', 'lifestyle']
const GOALS     = ['engagement', 'leads', 'awareness', 'retention']
const PLATFORMS = ['instagram', 'linkedin', 'facebook', 'tiktok']
const PRICES    = ['budget', 'mid-range', 'premium', 'luxury']

const TIMEZONES = [
  // Africa
  'Africa/Abidjan','Africa/Accra','Africa/Addis_Ababa','Africa/Cairo','Africa/Casablanca',
  'Africa/Dar_es_Salaam','Africa/Johannesburg','Africa/Kampala','Africa/Lagos',
  'Africa/Nairobi','Africa/Tunis',
  // Americas
  'America/Bogota','America/Chicago','America/Denver','America/Los_Angeles',
  'America/Mexico_City','America/New_York','America/Sao_Paulo','America/Toronto',
  // Asia
  'Asia/Bahrain','Asia/Bangkok','Asia/Colombo','Asia/Dubai','Asia/Hong_Kong',
  'Asia/Jakarta','Asia/Karachi','Asia/Kolkata','Asia/Kuala_Lumpur','Asia/Manila',
  'Asia/Riyadh','Asia/Seoul','Asia/Shanghai','Asia/Singapore','Asia/Taipei',
  'Asia/Tehran','Asia/Tokyo',
  // Australia & Pacific
  'Australia/Melbourne','Australia/Perth','Australia/Sydney','Pacific/Auckland',
  // Europe
  'Europe/Amsterdam','Europe/Berlin','Europe/Dublin','Europe/Istanbul','Europe/London',
  'Europe/Madrid','Europe/Moscow','Europe/Paris','Europe/Rome','Europe/Zurich',
  // UTC
  'UTC',
].sort()

const blank = {
  // Core
  name: '', industry: '', tone_of_voice: 'professional',
  brand_colors: [], _color_picker: '#6366F1',
  image_style: 'cinematic', services: '', target_audience: '',
  location: '', posting_goals: ['leads'], logo_url: '',
  // AI intelligence
  audience_pain_points: '', unique_selling_points: '', past_wins: '',
  platforms: [], price_positioning: '',
  brand_tagline: '', words_to_avoid: '', founding_story: '', cta_destination: '',
  // Operational
  monthly_post_quota: 20, notes: '',
  // Publishing
  timezone: 'UTC', facebook_page_id: '', instagram_account_id: '', tiktok_account_id: '',
  meta_access_token: '',
}

export default function ClientsPage() {
  const [clients,    setClients]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(blank)
  const [submitting, setSubmitting] = useState(false)
  const [formError,  setFormError]  = useState(null)
  const [stats,      setStats]      = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [data, statsData] = await Promise.all([getClients(), getStats().catch(() => null)])
      setClients(data.clients || [])
      setStats(statsData)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const toggleGoal = g => setForm(p => ({
    ...p, posting_goals: p.posting_goals.includes(g)
      ? p.posting_goals.filter(x => x !== g) : [...p.posting_goals, g],
  }))
  const togglePlatform = v => setForm(p => ({
    ...p, platforms: p.platforms.includes(v)
      ? p.platforms.filter(x => x !== v) : [...p.platforms, v],
  }))
  const togglePrice = v => setForm(p => ({
    ...p, price_positioning: p.price_positioning === v ? '' : v,
  }))
  const addColor = () => {
    const c = form._color_picker.trim()
    if (!c || form.brand_colors.length >= 10 || form.brand_colors.includes(c)) return
    setForm(p => ({ ...p, brand_colors: [...p.brand_colors, c] }))
  }
  const removeColor = i => setForm(p => ({ ...p, brand_colors: p.brand_colors.filter((_, j) => j !== i) }))
  const parseList = s => s.split(/[\n,]/).map(x => x.trim()).filter(Boolean)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      await createClient({
        name:                  form.name,
        industry:              form.industry,
        tone_of_voice:         form.tone_of_voice,
        brand_colors:          form.brand_colors.length > 0 ? form.brand_colors : null,
        image_style:           form.image_style,
        services:              parseList(form.services),
        target_audience:       form.target_audience,
        location:              form.location || null,
        posting_goals:         form.posting_goals,
        logo_url:              form.logo_url || null,
        audience_pain_points:  form.audience_pain_points ? parseList(form.audience_pain_points) : null,
        unique_selling_points: form.unique_selling_points ? parseList(form.unique_selling_points) : null,
        past_wins:             form.past_wins ? parseList(form.past_wins) : null,
        platforms:             form.platforms.length > 0 ? form.platforms : null,
        price_positioning:     form.price_positioning || null,
        brand_tagline:         form.brand_tagline || null,
        words_to_avoid:        form.words_to_avoid ? parseList(form.words_to_avoid) : null,
        founding_story:        form.founding_story || null,
        cta_destination:       form.cta_destination || null,
        monthly_post_quota:    Number(form.monthly_post_quota) || 20,
        notes:                 form.notes || null,
        timezone:              form.timezone || 'UTC',
        facebook_page_id:      form.facebook_page_id || null,
        instagram_account_id:  form.instagram_account_id || null,
        tiktok_account_id:     form.tiktok_account_id || null,
        meta_access_token:     form.meta_access_token || null,
      })
      setForm(blank)
      setShowForm(false)
      await load()
    } catch (e) { setFormError(e.message) }
    finally { setSubmitting(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-1">
            {clients.length > 0 ? `${clients.length} client${clients.length > 1 ? 's' : ''}` : 'No clients yet'}
          </p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setFormError(null) }}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          {showForm ? 'Cancel' : '+ Add Client'}
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Clients',     value: stats.total_clients },
            { label: 'Active',            value: stats.active_clients },
            { label: 'Posts This Month',  value: stats.posts_this_month },
            { label: 'All-Time Posts',    value: stats.total_posts },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7 mb-8">
          <h2 className="text-base font-semibold text-slate-900 mb-6">New Client Profile</h2>
          <form onSubmit={submit} className="space-y-8">

            {/* ── Section 1: Core ── */}
            <Section title="Core Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Business Name *">
                  <input name="name" value={form.name} onChange={set} required placeholder="Apex Electrical" className={inp} />
                </Field>
                <Field label="Industry *">
                  <input name="industry" value={form.industry} onChange={set} required placeholder="electrical contracting" className={inp} />
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
                <Field label="Target Audience *">
                  <input name="target_audience" value={form.target_audience} onChange={set} required
                    placeholder="homeowners aged 30–55" className={inp} />
                </Field>
                <Field label="Services (comma separated) *">
                  <input name="services" value={form.services} onChange={set} required
                    placeholder="wiring, solar installation, CCTV" className={inp} />
                </Field>
                <Field label="Location">
                  <input name="location" value={form.location} onChange={set} placeholder="Nairobi, Kenya" className={inp} />
                </Field>
                <Field label="Logo URL">
                  <input name="logo_url" value={form.logo_url} onChange={set} placeholder="https://..." className={inp} />
                </Field>

                {/* Brand Colors */}
                <div className="md:col-span-2">
                  <Field label={`Brand Colors (${form.brand_colors.length}/10)`}>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input type="color" name="_color_picker" value={form._color_picker} onChange={set}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5" />
                        <input type="text" name="_color_picker" value={form._color_picker} onChange={set}
                          placeholder="#6366F1" className={`${inp} flex-1 font-mono`} />
                        <button type="button" onClick={addColor} disabled={form.brand_colors.length >= 10}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 disabled:opacity-40 transition-colors">
                          Add
                        </button>
                      </div>
                      {form.brand_colors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {form.brand_colors.map((c, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                              <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: c }} />
                              <span className="text-xs font-mono text-slate-600">{c}</span>
                              <button type="button" onClick={() => removeColor(i)}
                                className="text-slate-400 hover:text-red-400 ml-0.5 text-base leading-none">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Field>
                </div>

                {/* Posting Goals */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-2">Posting Goals *</label>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map(g => (
                      <button key={g} type="button" onClick={() => toggleGoal(g)}
                        className={pill(form.posting_goals.includes(g))}>
                        {cap(g)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* ── Section 2: AI Content Intelligence ── */}
            <Section title="AI Content Intelligence" subtitle="The more you fill in, the sharper the AI's output.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Audience Pain Points">
                  <textarea name="audience_pain_points" value={form.audience_pain_points} onChange={set} rows={3}
                    placeholder={"Contractors disappear mid-project\nCosts always go over budget\nHard to find trusted tradespeople"}
                    className={`${inp} resize-none`} />
                  <Hint>One per line — used verbatim in hooks.</Hint>
                </Field>
                <Field label="Unique Selling Points">
                  <textarea name="unique_selling_points" value={form.unique_selling_points} onChange={set} rows={3}
                    placeholder={"10-year workmanship guarantee\nFixed-price contracts\nCertified team"}
                    className={`${inp} resize-none`} />
                  <Hint>One per line — used in authority and problem/solution posts.</Hint>
                </Field>
                <Field label="Past Wins & Proof Points">
                  <textarea name="past_wins" value={form.past_wins} onChange={set} rows={3}
                    placeholder={"Completed 200+ projects since 2018\nSaved a client $12,000 on Phase 2\n98% client referral rate"}
                    className={`${inp} resize-none`} />
                  <Hint>Real numbers — replaces invented outcomes in social proof posts.</Hint>
                </Field>
                <Field label="Founding Story">
                  <textarea name="founding_story" value={form.founding_story} onChange={set} rows={3}
                    placeholder="Started in 2012 when the founder noticed most electricians in the city were cutting corners on safety..."
                    className={`${inp} resize-none`} />
                  <Hint>Used as a source for behind-the-scenes posts.</Hint>
                </Field>
                <Field label="Brand Tagline">
                  <input name="brand_tagline" value={form.brand_tagline} onChange={set}
                    placeholder="Built right. Built to last." className={inp} />
                  <Hint>Echoed naturally at the close of one post.</Hint>
                </Field>
                <Field label="CTA Destination">
                  <input name="cta_destination" value={form.cta_destination} onChange={set}
                    placeholder="+254 700 000 000  or  https://apexelectrical.co.ke/book" className={inp} />
                  <Hint>Every CTA will point here — phone, WhatsApp, or booking URL.</Hint>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Words / Phrases to Avoid">
                    <textarea name="words_to_avoid" value={form.words_to_avoid} onChange={set} rows={2}
                      placeholder={"cheap, competitor name, old slogan"}
                      className={`${inp} resize-none`} />
                    <Hint>One per line — added to the AI's banned list for this client.</Hint>
                  </Field>
                </div>

                {/* Platforms */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Target Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(p => (
                      <button key={p} type="button" onClick={() => togglePlatform(p)} className={pill(form.platforms.includes(p))}>
                        {cap(p)}
                      </button>
                    ))}
                  </div>
                  <Hint>Each platform gets format-specific captions.</Hint>
                </div>

                {/* Price positioning */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Price Positioning</label>
                  <div className="flex flex-wrap gap-2">
                    {PRICES.map(p => (
                      <button key={p} type="button" onClick={() => togglePrice(p)} className={pill(form.price_positioning === p)}>
                        {cap(p)}
                      </button>
                    ))}
                  </div>
                  <Hint>Shapes value language across all posts.</Hint>
                </div>
              </div>
            </Section>

            {/* ── Section 3: Operational ── */}
            <Section title="Operational" subtitle="Internal settings — not sent to the AI.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Monthly Post Quota">
                  <input type="number" name="monthly_post_quota" value={form.monthly_post_quota} onChange={set}
                    min={1} max={500} className={inp} />
                  <Hint>Max posts to generate for this client per month.</Hint>
                </Field>
                <Field label="Timezone">
                  <select name="timezone" value={form.timezone} onChange={set} className={inp}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                  <Hint>Used for scheduling when auto-publishing is enabled.</Hint>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Internal Notes">
                    <textarea name="notes" value={form.notes} onChange={set} rows={2}
                      placeholder="Agency-only notes about this client..."
                      className={`${inp} resize-none`} />
                  </Field>
                </div>
              </div>
            </Section>

            {/* ── Section 4: Publishing ── */}
            <Section title="Social Publishing" subtitle="Required to publish posts directly to Facebook or Instagram.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Facebook Page ID">
                  <input name="facebook_page_id" value={form.facebook_page_id} onChange={set}
                    placeholder="123456789012345" className={inp} />
                </Field>
                <Field label="Instagram Account ID">
                  <input name="instagram_account_id" value={form.instagram_account_id} onChange={set}
                    placeholder="17841400000000000" className={inp} />
                </Field>
                <Field label="TikTok Account ID">
                  <input name="tiktok_account_id" value={form.tiktok_account_id} onChange={set}
                    placeholder="xxxxxxxxxxxxxxxx" className={inp} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Meta (Facebook/Instagram) Page Access Token">
                    <input name="meta_access_token" value={form.meta_access_token} onChange={set}
                      placeholder="EAABsbCS..." className={`${inp} font-mono text-xs`} />
                    <Hint>Long-lived Page Access Token from Meta for Developers. Required to publish posts.</Hint>
                  </Field>
                </div>
              </div>
            </Section>

            {formError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{formError}</div>
            )}

            <div className="flex justify-end">
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

const inp  = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
const cap  = s => s.charAt(0).toUpperCase() + s.slice(1)
const pill = active => `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
  active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
}`

function Section({ title, subtitle, children }) {
  return (
    <div>
      <div className="mb-4 pb-2 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Hint({ children }) {
  return <p className="text-xs text-slate-400 mt-1">{children}</p>
}
