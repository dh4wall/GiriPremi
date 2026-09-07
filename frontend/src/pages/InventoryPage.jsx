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

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return inventoryItems.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.id.toLowerCase().includes(normalizedSearch) ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch)

      const matchesCategory = selectedCategory === "All Categories" || item.category === selectedCategory
      const matchesStatus = selectedStatus === "All Statuses" || item.status === selectedStatus
      const hasQuantity = item.quantity > 0 || item.status !== 'Available' // Show if it has stock or if it's issued/reserved (status != Available)

      return matchesSearch && matchesCategory && matchesStatus && hasQuantity
    })
  }, [inventoryItems, searchTerm, selectedCategory, selectedStatus])

  useEffect(() => {
    // kept for potential future use
  }, [addEquipmentRequest, canAddProduct])

  function handleSubmit(event) {
    event.preventDefault()
  }

  return (
    <>
      <section className="content-shell">
        <div className="section-head compact">
          <h2>Inventory</h2>
          <div className="inventory-actions">
            {canAddProduct ? (
              <>
                <button className="secondary-btn" onClick={onManageCategories} type="button">
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>category</span>
                  <span>Manage Categories</span>
                </button>
                <button className="secondary-btn" onClick={() => onManageStores && onManageStores()} type="button">
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>store</span>
                  <span>Manage Stores</span>
                </button>
                <button className="secondary-btn" onClick={handleRefresh} type="button" title="Refresh Inventory" disabled={refreshing}>
                  <span className={`material-symbols-outlined${refreshing ? ' spin' : ''}`} style={{ fontSize: '1.1rem' }}>refresh</span>
                  <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
                </button>
                <button className="primary-btn" onClick={onManageEquipment} type="button">
                  <span className="material-symbols-outlined">inventory_2</span>
                  <span>Manage Equipment</span>
                </button>
              </>
            ) : null}
          </div>
        </div>

        {isStoreAdmin ? (
          <div className="info-banner">Store Admin fakt customer la dilya nantarach item status update karu shakto.</div>
        ) : null}

        <div className="table-shell">
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
              <select onChange={(event) => setSelectedStatus(event.target.value)} value={selectedStatus}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto', width: '100%', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <table style={{ minWidth: '800px', width: '100%', borderCollapse: 'collapse' }}>
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
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', opacity: 0.8 }}>{item.id}</td>
                    <td>
                      <div className="item-cell">
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{item.store_name}</span>
                    </td>
                    <td>
                      <span className="category-chip">{item.category}</span>
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: item.condition === 'NEW' ? '#dcfce7' : item.condition === 'MODERATE' ? '#fef9c3' : '#f3f4f6',
                        color: item.condition === 'NEW' ? '#166534' : item.condition === 'MODERATE' ? '#854d0e' : '#374151'
                      }}>
                        {item.condition}
                      </span>
                    </td>
                    <td>{item.quantity}</td>
                    <td>{item.inspected}</td>
                    <td>
                      <span className={`status-pill ${item.statusTone}`}>
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
