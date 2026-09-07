import { useRef, useState } from 'react'

const initialFormState = {
    name: '',
    category: '',
    brand: '',
    manufactureDate: '',
    expiryDate: '',
    purchaseDate: '',
    store: 'Store 1',
    description: '',
}

function EquipmentModal({ categories, inventoryItems, onClose, onAddEquipment, onImportEquipment }) {
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
            await onAddEquipment(formData)
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
        setImportStatus({ type: 'loading', message: 'Importing data…' })
        try {
            const result = await onImportEquipment(selectedFile)
            const hasErrors = result?.errors?.length > 0
            setImportStatus({
                type: hasErrors ? 'warning' : 'success',
                message: `Import complete. ${result?.created_count ?? 0} items created.`,
                errors: result?.errors || []
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
            <div className="equipment-modal" style={{ maxWidth: 720, width: '100%' }}>
                {/* Header */}
                <div className="modal-head">
                    <div>
                        <h3>Manage Equipment</h3>
                        <small>{inventoryItems.length} item{inventoryItems.length !== 1 ? 's' : ''} in inventory</small>
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
                            <span>{showForm ? 'Cancel' : 'Add Manually'}</span>
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

                {/* Add Equipment Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} style={{ padding: '0.5rem 1.5rem 0' }}>
                        <div className="equipment-modal-body" style={{ gap: '0.6rem', padding: '0.5rem 0' }}>
                            <label htmlFor="eq-name">Equipment Name *</label>
                            <input
                                id="eq-name"
                                required
                                placeholder="e.g. Black Diamond Momentum Harness"
                                value={formData.name}
                                onChange={(e) => set('name', e.target.value)}
                                type="text"
                            />

                            <div className="equipment-form-grid">
                                <div>
                                    <label htmlFor="eq-category">Category *</label>
                                    <select
                                        id="eq-category"
                                        required
                                        value={formData.category}
                                        onChange={(e) => set('category', e.target.value)}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="eq-brand">Brand</label>
                                    <input
                                        id="eq-brand"
                                        placeholder="e.g. Petzl, Mammut"
                                        value={formData.brand}
                                        onChange={(e) => set('brand', e.target.value)}
                                        type="text"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="eq-mfg">Date of Manufacturing</label>
                                    <input
                                        id="eq-mfg"
                                        type="text"
                                        placeholder="dd/mm/yyyy"
                                        value={formData.manufactureDate}
                                        onChange={(e) => set('manufactureDate', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="eq-expiry">Date of Expiry</label>
                                    <input
                                        id="eq-expiry"
                                        type="text"
                                        placeholder="dd/mm/yyyy"
                                        value={formData.expiryDate}
                                        onChange={(e) => set('expiryDate', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="eq-purchase">Purchase Date</label>
                                    <input
                                        id="eq-purchase"
                                        type="text"
                                        placeholder="dd/mm/yyyy"
                                        value={formData.purchaseDate}
                                        onChange={(e) => set('purchaseDate', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="eq-store">Current Store</label>
                                    <select
                                        id="eq-store"
                                        value={formData.store}
                                        onChange={(e) => set('store', e.target.value)}
                                    >
                                        <option value="Store 1">Store 1</option>
                                        <option value="Store 2">Store 2</option>
                                        <option value="Base Camp Warehouse">Base Camp Warehouse</option>
                                    </select>
                                </div>
                            </div>

                            <label htmlFor="eq-desc" style={{ marginTop: '0.2rem' }}>Description</label>
                            <textarea
                                id="eq-desc"
                                rows="2"
                                style={{ minHeight: '80px' }}
                                placeholder="Condition notes, serial number, etc."
                                value={formData.description}
                                onChange={(e) => set('description', e.target.value)}
                            />
                        </div>

                        <div className="modal-foot" style={{ padding: '0.75rem 0 1rem' }}>
                            <button className="secondary-btn" type="button" onClick={() => { setShowForm(false); setFormData(initialFormState) }}>
                                Cancel
                            </button>
                            <button className="primary-btn" type="submit" disabled={submitting}>
                                {submitting ? 'Saving…' : 'Add Equipment'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Excel format hint */}
                {!showForm && (
                    <div style={{ padding: '1rem 1.5rem 1.5rem', color: 'var(--text-soft)', fontSize: '0.8rem' }}>
                        <p style={{ margin: '0.75rem 0 0.3rem', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                            Excel Import Format
                        </p>
                        <code style={{ background: '#f3f7ff', borderRadius: 6, padding: '0.4rem 0.6rem', display: 'block', fontSize: '0.77rem', lineHeight: 1.7 }}>
                            equipment_name | category_id | brand | description | purchase_date | date_of_expiry | date_of_manufacturing | current_store_id
                        </code>
                    </div>
                )}
            </div>
        </div>
    )
}

export default EquipmentModal
