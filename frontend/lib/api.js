const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function getClients() {
  const res = await fetch(`${BASE}/clients`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch clients')
  return res.json()
}

export async function createClient(data) {
  const res = await fetch(`${BASE}/clients`, {
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
  const res = await fetch(`${BASE}/generate-content/${clientId}?count=${count}`, {
    method: 'POST',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Generation failed')
  }
  return res.json()
}

export async function triggerGeneration(clientId) {
  const res = await fetch(`${BASE}/trigger-generation/${clientId}`, {
    method: 'POST',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to trigger generation')
  }
  return res.json()
}

export async function deleteClient(clientId) {
  const res = await fetch(`${BASE}/clients/${clientId}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to delete client')
  }
}

export async function getPosts(clientId) {
  const res = await fetch(`${BASE}/posts/${clientId}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch posts')
  return res.json()
}
