import { useRef, useState } from 'react'

const initialFormState = {
    name: '',
    tracking_type: 'QUANTITY',
    requires_inspection: false,
    inspection_frequency_months: '',
    product_life_year: '',
    description: '',
}

function CategoriesModal({ categories, onClose, onAddCategory, onImportCategories, onDeleteCategory }) {
    const [formData, setFormData] = useState(initialFormState)
    const [showForm, setShowForm] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [importStatus, setImportStatus] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [importing, setImporting] = useState(false)
    const fileInputRef = useRef(null)

    function set(field, value) {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSubmitting(true)
        try {
            await onAddCategory({
                name: formData.name,
                tracking_type: formData.tracking_type,
                requires_inspection: formData.requires_inspection,
                inspection_frequency_months: formData.inspection_frequency_months
                    ? parseInt(formData.inspection_frequency_months)
                    : null,
                product_life_year: formData.product_life_year
                    ? parseFloat(formData.product_life_year)
                    : null,
                description: formData.description || null,
            })
            setFormData(initialFormState)
            setShowForm(false)
        } catch (err) {
            alert(`Error: ${err.message}`)
        } finally {
            setSubmitting(false)
        }
    }

    function handleFileChange(e) {
        const file = e.target.files[0]
        if (!file) return
        setSelectedFile(file)
        setImportStatus(null)
    }

    function handleRemoveFile() {
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    async function handleConfirmImport() {
        if (!selectedFile) return
        setImporting(true)
        setImportStatus({ type: 'loading', message: 'Importing categories…' })
        try {
            const result = await onImportCategories(selectedFile)
            const hasErrors = result.failed > 0
            setImportStatus({
                type: hasErrors ? 'warning' : 'success',
                message: `Import complete. ${result.inserted} categories created.`,
                errors: result.errors || []
            })
            setSelectedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (err) {
            setImportStatus({ type: 'error', message: err.message })
        } finally {
            setImporting(false)
        }
    }

    return (
        <div className="modal-backdrop" role="presentation">
            <div className="equipment-modal" style={{ maxWidth: 640, width: '100%' }}>
                {/* Header */}
                <div className="modal-head">
                    <div>
                        <h3>Manage Categories</h3>
                        <small>{categories.length} categor{categories.length === 1 ? 'y' : 'ies'} in system</small>
                    </div>
                    <button onClick={onClose} type="button">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Action bar and File Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 1.5rem 0' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            className="primary-btn"
                            type="button"
                            onClick={() => setShowForm((v) => !v)}
                        >
                            <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
                            <span>{showForm ? 'Cancel' : 'Add Category'}</span>
                        </button>

                        {!selectedFile ? (
                            <button
                                className="secondary-btn"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="material-symbols-outlined">upload_file</span>
                                <span>Import from Excel</span>
                            </button>
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: '#f8fafc',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '6px',
                                padding: '0 0.75rem',
                                height: '36px',
                                fontSize: '0.85rem'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: '#64748b' }}>description</span>
                                <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                                <button
                                    onClick={handleRemoveFile}
                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: '#94a3b8' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                                </button>
                                <button
                                    className="primary-btn"
                                    style={{ height: '26px', padding: '0 0.6rem', fontSize: '0.75rem', marginLeft: '0.4rem' }}
                                    onClick={handleConfirmImport}
                                    disabled={importing}
                                >
                                    {importing ? 'Importing…' : 'Confirm Import'}
                                </button>
                            </div>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>

                {importStatus && (
                    <div style={{
                        margin: '0.75rem 1.5rem 0',
                        padding: '0.8rem 1rem',
                        borderRadius: '8px',
                        background: importStatus.type === 'success' ? '#ecfdf5' : importStatus.type === 'warning' ? '#fffbeb' : importStatus.type === 'loading' ? '#f0f9ff' : '#fef2f2',
                        color: importStatus.type === 'success' ? '#065f46' : importStatus.type === 'warning' ? '#92400e' : importStatus.type === 'loading' ? '#075985' : '#991b1b',
                        fontSize: '0.85rem',
                        border: `1px solid ${importStatus.type === 'success' ? '#10b98140' : importStatus.type === 'warning' ? '#f59e0b40' : importStatus.type === 'loading' ? '#0ea5e940' : '#ef444440'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: importStatus.errors?.length ? '0.4rem' : 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                                {importStatus.type === 'success' ? 'check_circle' : importStatus.type === 'warning' ? 'warning' : importStatus.type === 'loading' ? 'sync' : 'error'}
                            </span>
                            {importStatus.message}
                        </div>

                        {importStatus.errors?.length > 0 && (
                            <div style={{
                                maxHeight: '120px',
                                overflowY: 'auto',
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                background: 'rgba(0,0,0,0.03)',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                                fontFamily: 'monospace'
                            }}>
                                {importStatus.errors.map((err, idx) => (
                                    <div key={idx} style={{ marginBottom: '0.25rem', display: 'flex', gap: '0.5rem' }}>
                                        <span style={{ opacity: 0.5 }}>•</span>
                                        <span>{err}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Add Category Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} style={{ padding: '0.5rem 1.5rem 0' }}>
                        <div className="equipment-modal-body" style={{ gap: '0.6rem', padding: '0.5rem 0' }}>
                            <label htmlFor="cat-name">Category Name *</label>
                            <input
                                id="cat-name"
                                required
                                placeholder="e.g. Helmets, Ropes, Harness"
                                value={formData.name}
                                onChange={(e) => set('name', e.target.value)}
                                type="text"
                            />

                            <div className="equipment-form-grid">
                                <div>
                                    <label htmlFor="cat-tracking">Tracking Type *</label>
                                    <select
                                        id="cat-tracking"
                                        value={formData.tracking_type}
                                        onChange={(e) => set('tracking_type', e.target.value)}
                                        required
                                    >
                                        <option value="QUANTITY">Quantity</option>
                                        <option value="INDIVIDUAL">Individual (Serial)</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="cat-life">Product Life (years)</label>
                                    <input
                                        id="cat-life"
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        placeholder="e.g. 5"
                                        value={formData.product_life_year}
                                        onChange={(e) => set('product_life_year', e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.4rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '500', cursor: 'pointer', margin: 0, color: 'inherit' }}>
                                        <input
                                            type="checkbox"
                                            style={{ width: '18px', height: '18px', flexShrink: 0, margin: 0 }}
                                            checked={formData.requires_inspection}
                                            onChange={(e) => set('requires_inspection', e.target.checked)}
                                        />
                                        Requires periodic inspection
                                    </label>
                                </div>

                                {formData.requires_inspection && (
                                    <div>
                                        <label htmlFor="cat-freq">Inspection Every (months)</label>
                                        <input
                                            id="cat-freq"
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 6"
                                            value={formData.inspection_frequency_months}
                                            onChange={(e) => set('inspection_frequency_months', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <label htmlFor="cat-desc" style={{ marginTop: '0.2rem' }}>Description</label>
                            <textarea
                                id="cat-desc"
                                rows="2"
                                style={{ minHeight: '80px' }}
                                placeholder="Optional notes about this category"
                                value={formData.description}
                                onChange={(e) => set('description', e.target.value)}
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
                                {submitting ? 'Saving…' : 'Save Category'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Category list */}
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', marginBottom: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                        Existing Categories
                    </p>
                    {categories.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '0.9rem' }}>No categories yet. Add one above.</p>
                    ) : (
                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ position: 'sticky', top: 0, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>ID</th>
                                        <th style={{ padding: '0.6rem 0.8rem' }}>Name</th>
                                        <th style={{ padding: '0.6rem 0.8rem' }}>Tracking</th>
                                        <th style={{ padding: '0.6rem 0.8rem' }}>Inspection</th>
                                        <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((cat) => (
                                        <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-light, #eee)' }}>
                                            <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-soft)', fontFamily: 'monospace' }}>{cat.id}</td>
                                            <td style={{ padding: '0.6rem 0.8rem', fontWeight: 500 }}>{cat.name}</td>
                                            <td style={{ padding: '0.6rem 0.8rem' }}>
                                                <span className={`status-pill ${cat.tracking_type === 'QUANTITY' ? 'blue' : 'gray'}`} style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                                                    {cat.tracking_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-soft)' }}>
                                                {cat.requires_inspection ? `Every ${cat.inspection_frequency_months}mo` : 'None'}
                                            </td>
                                            <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>
                                                <button
                                                    type="button"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-soft)', display: 'inline-flex' }}
                                                    onClick={() => {
                                                        if (onDeleteCategory) onDeleteCategory(cat.id)
                                                    }}
                                                    title="Delete Category"
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

                {/* Excel format hint */}
                {!showForm && (
                    <div style={{ padding: '0 1.5rem 1.5rem', color: 'var(--text-soft)', fontSize: '0.8rem' }}>
                        <p style={{ margin: '0.75rem 0 0.3rem', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                            Excel Import Format
                        </p>
                        <code style={{ background: '#f3f7ff', borderRadius: 6, padding: '0.4rem 0.6rem', display: 'block', fontSize: '0.77rem', lineHeight: 1.7 }}>
                            name | tracking_type | requires_inspection | inspection_frequency_months | product_life_year | description
                        </code>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CategoriesModal
