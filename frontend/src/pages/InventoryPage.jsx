import { useEffect, useMemo, useState } from "react"

const initialFormState = {
  name: "",
  category: "",
  brand: "",
  manufactureDate: "",
  expiryDate: "",
  purchaseDate: "",
  store: "Store 1",
  description: "",
}

function InventoryPage({ addEquipmentRequest, inventoryItems, categories = [], canAddProduct, canDeleteProduct, isStoreAdmin, onDeleteItem, onManageEquipment, onManageCategories, onManageStores, onPageChange, onUpdateItem, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedStore, setSelectedStore] = useState("All Stores")
  const [selectedStatus, setSelectedStatus] = useState("All Statuses")
  const [formData, setFormData] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    try { await onRefresh() } finally { setRefreshing(false) }
  }

  // For the filter dropdown — pull unique names from inventory items as before
  const categoryOptions = useMemo(() => {
    const cats = new Set(inventoryItems.map((item) => item.category))
    return ["All Categories", ...cats]
  }, [inventoryItems])

  // For the Add modal — use live categories from backend
  const categorySelectOptions = useMemo(() => {
    return categories.map((c) => ({ id: c.id, name: c.name }))
  }, [categories])

  const statusOptions = useMemo(() => {
    const statuses = new Set(inventoryItems.map((item) => item.status))
    return ["All Statuses", ...statuses]
  }, [inventoryItems])

  const storeOptions = useMemo(() => {
    const stores = new Set(inventoryItems.map((item) => item.store_name).filter(Boolean))
    return ["All Stores", ...stores]
  }, [inventoryItems])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return inventoryItems.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        String(item.id).toLowerCase().includes(normalizedSearch) ||
        String(item.name).toLowerCase().includes(normalizedSearch) ||
        String(item.category).toLowerCase().includes(normalizedSearch)

      const matchesCategory = selectedCategory === "All Categories" || item.category === selectedCategory
      const matchesStore = selectedStore === "All Stores" || item.store_name === selectedStore
      const matchesStatus = selectedStatus === "All Statuses" || item.status === selectedStatus
      const hasQuantity = item.quantity > 0 || item.status !== 'Available' // Show if it has stock or if it's issued/reserved (status != Available)

      return matchesSearch && matchesCategory && matchesStore && matchesStatus && hasQuantity
    })
  }, [inventoryItems, searchTerm, selectedCategory, selectedStore, selectedStatus])

  useEffect(() => {
    // kept for potential future use
  }, [addEquipmentRequest, canAddProduct])

  function handleSubmit(event) {
    event.preventDefault()
  }

  function exportCsv() {
    const headers = ['ID', 'Item Name', 'Store', 'Category', 'Condition', 'Quantity', 'Last Inspected', 'Status']
    const rows = filteredItems.map((item) => [
      item.id, item.name, item.store_name, item.category, item.condition,
      item.quantity, item.inspected, item.status,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'giripremi-inventory.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <section className="content-shell inventory-reference-page">
        <div className="inventory-reference-heading">
          <div>
            <span className="inventory-reference-eyebrow">Active Expedition Vault</span>
            <h1>Equipment Inventory</h1>
            <p>Live inventory across all stores and high-altitude depots.</p>
          </div>
          <div className="inventory-actions">
            {canAddProduct ? (
              <>
                <button className="secondary-btn" onClick={onManageCategories} type="button">
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>category</span>
                  <span>Manage Categories</span>
                </button>
                <button className="secondary-btn" onClick={() => onManageStores && onManageStores()} type="button">
                  <span className="material-symbols-outlined">warehouse</span>
                  <span>Manage Stores</span>
                </button>
                <button className="secondary-btn inventory-refresh-btn" onClick={handleRefresh} type="button" title="Synchronize Cache" disabled={refreshing}>
                  <span className={`material-symbols-outlined${refreshing ? ' spin' : ''}`}>sync</span>
                </button>
                <button className="primary-btn" onClick={onManageEquipment} type="button">
                  <span className="material-symbols-outlined">add_box</span>
                  <span>+ Manage Equipment</span>
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="inventory-reference-summary">
          <div><span className="material-symbols-outlined">inventory_2</span><strong>{inventoryItems.length}</strong><small>Total inventory records</small></div>
          <div><span className="material-symbols-outlined">check_circle</span><strong>{inventoryItems.filter((item) => item.status === 'Available').length}</strong><small>Available records</small></div>
          <div><span className="material-symbols-outlined">storefront</span><strong>{new Set(inventoryItems.map((item) => item.store_name)).size}</strong><small>Active locations</small></div>
          <div><span className="material-symbols-outlined">category</span><strong>{new Set(inventoryItems.map((item) => item.category)).size}</strong><small>Equipment categories</small></div>
        </div>

        <div className="table-shell inventory-reference-table">
          <div className="filters">
            <div className="search-wrap">
              <span className="material-symbols-outlined">search</span>
              <input
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by ID, Name, or Category..."
                type="text"
                value={searchTerm}
              />
            </div>
            <div className="filter-group">
              <select onChange={(event) => setSelectedCategory(event.target.value)} value={selectedCategory}>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select onChange={(event) => setSelectedStore(event.target.value)} value={selectedStore}>
                {storeOptions.map((store) => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>
              <select onChange={(event) => setSelectedStatus(event.target.value)} value={selectedStatus}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button className="inventory-export-btn" onClick={exportCsv} type="button" title="Export Manifest as CSV">
                <span className="material-symbols-outlined">file_download</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="inventory-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Item Name</th>
                  <th>Store</th>
                  <th>Type/Category</th>
                  <th>Condition</th>
                  <th>Quantity</th>
                  <th>Last Inspected</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="inventory-id">{item.id}</td>
                    <td>
                      <div className="item-cell">
                        <span className="inventory-item-icon material-symbols-outlined">{item.icon}</span>
                        <span><strong>{item.name}</strong><small>{item.condition || 'Equipment record'}</small></span>
                      </div>
                    </td>
                    <td>
                      <span className="inventory-store">{item.store_name}</span>
                    </td>
                    <td>
                      <span className="inventory-category">{item.category}</span>
                    </td>
                    <td>
                      <span className={`inventory-condition ${item.condition === 'NEW' ? 'new' : item.condition === 'MODERATE' ? 'moderate' : ''}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td>{item.quantity}</td>
                    <td>{item.inspected}</td>
                    <td>
                      <span className={`inventory-status ${item.statusTone}`}>
                        <i />
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        {canDeleteProduct && ( // Assuming canDeleteProduct is equivalent to isSuperAdmin for delete action
                          <button
                            className="icon-btn"
                            style={{ color: '#dc2626' }}
                            onClick={() => {
                              if (window.confirm(`Delete ${item.name} (ID: ${item.equipment_id}) and all its stock?`)) {
                                onDeleteItem(item.equipment_id)
                              }
                            }}
                            title="Delete Item"
                            type="button"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="inventory-empty" colSpan="9">No equipment matches the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-foot">
            <small style={{ fontSize: '0.75rem', opacity: 0.65 }}>
              {filteredItems.length} of {inventoryItems.length} items
            </small>
            <small className="inventory-reference-note">Inventory data synced from the active backend</small>
            <div className="pager">
              <button className="secondary-btn" style={{ minHeight: 32, padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => onPageChange("previous")} type="button">Prev</button>
              <button className="primary-btn pager-active" style={{ minHeight: 32, padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => onPageChange(1)} type="button">1</button>
              <button className="secondary-btn" style={{ minHeight: 32, padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => onPageChange("next")} type="button">Next</button>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}

export default InventoryPage
