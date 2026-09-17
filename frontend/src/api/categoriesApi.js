// API functions for category endpoints
import { getAuthHeaders } from './authApi'

const BASE = '/api'

export async function fetchCategories() {
    const res = await fetch(`${BASE}/categories/`, { headers: getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to fetch categories')
    return res.json()
}

export async function createCategory(data) {
    const res = await fetch(`${BASE}/categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to create category')
    }
    return res.json()
}

export async function uploadCategoriesExcel(file) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/categories/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: form,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Upload failed')
    }
    return res.json()
}

export async function deleteCategory(id) {
    const res = await fetch(`${BASE}/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to delete category')
    }
    return res.json()
}
