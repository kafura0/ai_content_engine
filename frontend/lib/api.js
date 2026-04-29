import { getAuthHeader } from '@/lib/supabase'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function authFetch(path, options = {}) {
  const authHeader = await getAuthHeader()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...authHeader, ...options.headers },
  })
  return res
}

export async function getClients() {
  const res = await authFetch('/clients', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch clients')
  return res.json()
}

export async function createClient(data) {
  const res = await authFetch('/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to create client')
  }
  return res.json()
}

export async function generateContent(clientId, count = 5) {
  const res = await authFetch(`/generate-content/${clientId}?count=${count}`, {
    method: 'POST',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Generation failed')
  }
  return res.json()
}

export async function triggerGeneration(clientId) {
  const res = await authFetch(`/trigger-generation/${clientId}`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to trigger generation')
  }
  return res.json()
}

export async function setClientActive(clientId, isActive) {
  const res = await authFetch(`/clients/${clientId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to update client')
  }
  return res.json()
}

export async function deleteClient(clientId) {
  const res = await authFetch(`/clients/${clientId}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to delete client')
  }
}

export async function getPosts(clientId) {
  const res = await authFetch(`/posts/${clientId}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch posts')
  return res.json()
}

export async function getClientQuota(clientId) {
  const res = await authFetch(`/clients/${clientId}/quota`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch quota')
  return res.json()
}

export async function publishPost(postId, platform) {
  const res = await authFetch(`/posts/${postId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Publish failed')
  }
  return res.json()
}
