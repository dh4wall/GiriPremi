import { useState } from 'react'

const initialFormState = {
    name: '',
    contact_person: '',
    contact_number: '',
    location: '',
}

function StoresModal({ stores, onClose, onAddStore, onDeleteStore }) {
    const [formData, setFormData] = useState(initialFormState)
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    function set(field, value) {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        try {
            await onAddStore(formData)
            setFormData(initialFormState)
            setShowForm(false)
        } catch (err) {
            alert(`Error: ${err.message}`)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="modal-backdrop" role="presentation">
            <div className="equipment-modal" style={{ maxWidth: 600, width: '100%' }}>
                {/* Header */}
                <div className="modal-head">
                    <div>
                        <h3>Manage Stores</h3>
                        <small>{stores.length} store{stores.length === 1 ? '' : 's'} in system</small>
                    </div>
                    <button onClick={onClose} type="button">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Action bar */}
                <div style={{ padding: '1rem 1.5rem 0' }}>
                    <button
                        className="primary-btn"
                        type="button"
                        onClick={() => setShowForm((v) => !v)}
                    >
                        <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
                        <span>{showForm ? 'Cancel' : 'Add Store'}</span>
                    </button>
                </div>

                {/* Add Store Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} style={{ padding: '0.5rem 1.5rem 0' }}>
                        <div className="equipment-modal-body" style={{ gap: '0.6rem', padding: '0.5rem 0' }}>
                            <label htmlFor="store-name">Store Name *</label>
                            <input
                                id="store-name"
                                required
                                placeholder="e.g. Base Camp Warehouse"
                                value={formData.name}
                                onChange={(e) => set('name', e.target.value)}
                                type="text"
                            />

                            <div className="equipment-form-grid">
                                <div>
                                    <label htmlFor="store-contact">Contact Person</label>
                                    <input
                                        id="store-contact"
                                        placeholder="Name"
                                        value={formData.contact_person}
                                        onChange={(e) => set('contact_person', e.target.value)}
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="store-phone">Contact Number</label>
                                    <input
                                        id="store-phone"
                                        placeholder="Phone"
                                        value={formData.contact_number}
                                        onChange={(e) => set('contact_number', e.target.value)}
                                        type="text"
                                    />
                                </div>
                            </div>

                            <label htmlFor="store-loc">Location / Address</label>
                            <textarea
                                id="store-loc"
                                rows="2"
                                placeholder="Store address"
                                value={formData.location}
                                onChange={(e) => set('location', e.target.value)}
                            />
                        </div>

                        <div className="modal-foot" style={{ padding: '0.75rem 0 1rem' }}>
                            <button
                                className="secondary-btn"
                                type="button"
                                onClick={() => { setShowForm(false); setFormData(initialFormState) }}
                            >
                                Cancel
                            </button>
                            <button className="primary-btn" type="submit" disabled={submitting}>
                                {submitting ? 'Saving…' : 'Save Store'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Store list */}
                <div style={{ padding: '1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', marginBottom: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                        Existing Stores
                    </p>
                    {stores.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>No stores yet. Add one above.</p>
                    ) : (
                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ position: 'sticky', top: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '0.6rem 0.8rem' }}>ID</th>
                                        <th style={{ padding: '0.6rem 0.8rem' }}>Name</th>
                                        <th style={{ padding: '0.6rem 0.8rem' }}>Contact</th>
                                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stores.map((store) => (
                                        <tr key={store.id} style={{ borderBottom: '1px solid var(--border-light, #eee)' }}>
                                            <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-soft)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{store.id}</td>
                                            <td style={{ padding: '0.6rem 0.8rem', fontWeight: 500 }}>{store.name}</td>
                                            <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-soft)' }}>
                                                {store.contact_person || '-'} {store.contact_number ? `(${store.contact_number})` : ''}
                                            </td>
                                            <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>
                                                <button
                                                    type="button"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-soft)', display: 'inline-flex' }}
                                                    onClick={() => {
                                                        if (window.confirm(`Delete store "${store.name}"?`)) {
                                                            onDeleteStore(store.id)
                                                        }
                                                    }}
                                                    title="Delete Store"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: '#dc2626' }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StoresModal
