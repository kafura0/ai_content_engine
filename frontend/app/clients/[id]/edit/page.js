'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getClients, editClient } from '@/lib/api'

const TONES     = ['professional', 'casual', 'premium', 'playful', 'bold', 'inspirational']
const STYLES    = ['cinematic', 'realistic', 'minimal', 'bold', 'editorial', 'lifestyle']
const GOALS     = ['engagement', 'leads', 'awareness', 'retention']
const PLATFORMS = ['instagram', 'linkedin', 'facebook', 'tiktok']
const PRICES    = ['budget', 'mid-range', 'premium', 'luxury']
const TIMEZONES = [
  'Africa/Abidjan','Africa/Accra','Africa/Addis_Ababa','Africa/Cairo','Africa/Casablanca',
  'Africa/Dar_es_Salaam','Africa/Johannesburg','Africa/Kampala','Africa/Lagos',
  'Africa/Nairobi','Africa/Tunis',
  'America/Bogota','America/Chicago','America/Denver','America/Los_Angeles',
  'America/Mexico_City','America/New_York','America/Sao_Paulo','America/Toronto',
  'Asia/Bahrain','Asia/Bangkok','Asia/Colombo','Asia/Dubai','Asia/Hong_Kong',
  'Asia/Jakarta','Asia/Karachi','Asia/Kolkata','Asia/Kuala_Lumpur','Asia/Manila',
  'Asia/Riyadh','Asia/Seoul','Asia/Shanghai','Asia/Singapore','Asia/Taipei',
  'Asia/Tehran','Asia/Tokyo',
  'Australia/Melbourne','Australia/Perth','Australia/Sydney','Pacific/Auckland',
  'Europe/Amsterdam','Europe/Berlin','Europe/Dublin','Europe/Istanbul','Europe/London',
  'Europe/Madrid','Europe/Moscow','Europe/Paris','Europe/Rome','Europe/Zurich',
  'UTC',
].sort()

const listToStr = arr => Array.isArray(arr) ? arr.join('\n') : (arr || '')

export default function EditClientPage() {
  const router = useRouter()
  const { id }  = useParams()

  const [form,       setForm]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    getClients().then(d => {
      const client = d.clients?.find(c => c.id === id)
      if (!client) { router.replace('/clients'); return }
      setForm({
        name:                  client.name || '',
        industry:              client.industry || '',
        tone_of_voice:         client.tone_of_voice || 'professional',
        brand_colors:          Array.isArray(client.brand_colors) ? client.brand_colors : [],
        _color_picker:         '#6366F1',
        image_style:           client.image_style || 'cinematic',
        services:              listToStr(client.services),
        target_audience:       client.target_audience || '',
        location:              client.location || '',
        posting_goals:         Array.isArray(client.posting_goals) ? client.posting_goals : [],
        logo_url:              client.logo_url || '',
        audience_pain_points:  listToStr(client.audience_pain_points),
        unique_selling_points: listToStr(client.unique_selling_points),
        past_wins:             listToStr(client.past_wins),
        platforms:             Array.isArray(client.platforms) ? client.platforms : [],
        price_positioning:     client.price_positioning || '',
        brand_tagline:         client.brand_tagline || '',
        words_to_avoid:        listToStr(client.words_to_avoid),
        founding_story:        client.founding_story || '',
        cta_destination:       client.cta_destination || '',
        monthly_post_quota:    client.monthly_post_quota || 20,
        notes:                 client.notes || '',
        timezone:              client.timezone || 'UTC',
        facebook_page_id:      client.facebook_page_id || '',
        instagram_account_id:  client.instagram_account_id || '',
        tiktok_account_id:     client.tiktok_account_id || '',
        meta_access_token:     client.meta_access_token || '',
      })
      setLoading(false)
    }).catch(() => router.replace('/clients'))
  }, [id])

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const toggleGoal     = g => setForm(p => ({ ...p, posting_goals:    p.posting_goals.includes(g)    ? p.posting_goals.filter(x => x !== g)    : [...p.posting_goals, g] }))
  const togglePlatform = v => setForm(p => ({ ...p, platforms:        p.platforms.includes(v)        ? p.platforms.filter(x => x !== v)        : [...p.platforms, v] }))
  const togglePrice    = v => setForm(p => ({ ...p, price_positioning: p.price_positioning === v ? '' : v }))
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
    setError(null)
    try {
      await editClient(id, {
        name:                  form.name,
        industry:              form.industry,
        tone_of_voice:         form.tone_of_voice,
        brand_colors:          form.brand_colors.length > 0 ? form.brand_colors : null,
        image_style:           form.image_style || null,
        services:              parseList(form.services),
        target_audience:       form.target_audience || null,
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
      router.replace('/clients')
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading client...</div>
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()}
          className="text-slate-400 hover:text-slate-700 transition-colors text-sm">← Back</button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Client</h1>
          <p className="text-sm text-slate-500 mt-0.5">{form.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
        <form onSubmit={submit} className="space-y-8">

          <Section title="Core Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Business Name *">
                <input name="name" value={form.name} onChange={set} required className={inp} />
              </Field>
              <Field label="Industry *">
                <input name="industry" value={form.industry} onChange={set} required className={inp} />
              </Field>
              <Field label="Tone of Voice *">
                <select name="tone_of_voice" value={form.tone_of_voice} onChange={set} className={inp}>
                  {TONES.map(t => <option key={t} value={t}>{cap(t)}</option>)}
                </select>
              </Field>
              <Field label="Image Style">
                <select name="image_style" value={form.image_style} onChange={set} className={inp}>
                  {STYLES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                </select>
              </Field>
              <Field label="Target Audience">
                <input name="target_audience" value={form.target_audience} onChange={set} className={inp} />
              </Field>
              <Field label="Services (comma separated) *">
                <input name="services" value={form.services} onChange={set} required className={inp} />
              </Field>
              <Field label="Location">
                <input name="location" value={form.location} onChange={set} className={inp} />
              </Field>
              <Field label="Logo URL">
                <input name="logo_url" value={form.logo_url} onChange={set} className={inp} />
              </Field>
              <div className="md:col-span-2">
                <Field label={`Brand Colors (${form.brand_colors.length}/10)`}>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input type="color" name="_color_picker" value={form._color_picker} onChange={set}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5" />
                      <input type="text" name="_color_picker" value={form._color_picker} onChange={set}
                        className={`${inp} flex-1 font-mono`} />
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
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-2">Posting Goals *</label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map(g => (
                    <button key={g} type="button" onClick={() => toggleGoal(g)} className={pill(form.posting_goals.includes(g))}>
                      {cap(g)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="AI Content Intelligence" subtitle="The more you fill in, the sharper the AI's output.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Audience Pain Points">
                <textarea name="audience_pain_points" value={form.audience_pain_points} onChange={set} rows={3} className={`${inp} resize-none`} />
                <Hint>One per line.</Hint>
              </Field>
              <Field label="Unique Selling Points">
                <textarea name="unique_selling_points" value={form.unique_selling_points} onChange={set} rows={3} className={`${inp} resize-none`} />
              </Field>
              <Field label="Past Wins & Proof Points">
                <textarea name="past_wins" value={form.past_wins} onChange={set} rows={3} className={`${inp} resize-none`} />
              </Field>
              <Field label="Founding Story">
                <textarea name="founding_story" value={form.founding_story} onChange={set} rows={3} className={`${inp} resize-none`} />
              </Field>
              <Field label="Brand Tagline">
                <input name="brand_tagline" value={form.brand_tagline} onChange={set} className={inp} />
              </Field>
              <Field label="CTA Destination">
                <input name="cta_destination" value={form.cta_destination} onChange={set} className={inp} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Words / Phrases to Avoid">
                  <textarea name="words_to_avoid" value={form.words_to_avoid} onChange={set} rows={2} className={`${inp} resize-none`} />
                </Field>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Target Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} type="button" onClick={() => togglePlatform(p)} className={pill(form.platforms.includes(p))}>
                      {cap(p)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Price Positioning</label>
                <div className="flex flex-wrap gap-2">
                  {PRICES.map(p => (
                    <button key={p} type="button" onClick={() => togglePrice(p)} className={pill(form.price_positioning === p)}>
                      {cap(p)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Operational">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Monthly Post Quota">
                <input type="number" name="monthly_post_quota" value={form.monthly_post_quota} onChange={set} min={1} max={500} className={inp} />
              </Field>
              <Field label="Timezone">
                <select name="timezone" value={form.timezone} onChange={set} className={inp}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Internal Notes">
                  <textarea name="notes" value={form.notes} onChange={set} rows={2} className={`${inp} resize-none`} />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Social Publishing">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Facebook Page ID">
                <input name="facebook_page_id" value={form.facebook_page_id} onChange={set} className={inp} />
              </Field>
              <Field label="Instagram Account ID">
                <input name="instagram_account_id" value={form.instagram_account_id} onChange={set} className={inp} />
              </Field>
              <Field label="TikTok Account ID">
                <input name="tiktok_account_id" value={form.tiktok_account_id} onChange={set} className={inp} />
              </Field>
              <Field label="Meta Page Access Token">
                <input name="meta_access_token" value={form.meta_access_token} onChange={set} className={`${inp} font-mono text-xs`} />
                <Hint>Long-lived Page Access Token from Meta for Developers.</Hint>
              </Field>
            </div>
          </Section>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
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
