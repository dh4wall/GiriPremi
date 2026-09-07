// API functions for equipment endpoints

const BASE = '/api'

export async function fetchEquipment() {
    const res = await fetch(`${BASE}/equipment/`)
    if (!res.ok) throw new Error('Failed to fetch equipment')
    return res.json()
}

export async function createEquipment(data) {
    const res = await fetch(`${BASE}/equipment/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to create equipment')
    }
    return res.json()
}

export async function updateEquipment(id, data) {
    const res = await fetch(`${BASE}/equipment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to update equipment')
    }
    return res.json()
}

export async function deleteEquipment(id) {
    const res = await fetch(`${BASE}/equipment/${id}`, { method: 'DELETE' })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to delete equipment')
    }
    return res.json()
}

export async function uploadEquipmentExcel(file) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/equipment/upload-excel`, {
        method: 'POST',
        body: form,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Upload failed')
    }
    return res.json()
}
