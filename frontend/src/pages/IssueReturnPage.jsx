import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchStores } from '../api/storesApi'
import { fetchEquipment } from '../api/equipmentApi'
import { createOrder, returnItems, fetchOrders } from '../api/ordersApi'
import { fetchStoreInventory } from '../api/inventoryApi'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function IssueReturnPage({
  members = [],
  readOnly,
  userType,
  modal = false,
  onClose = () => { },
  onContinue = () => { }
}) {
  const [issuedToName, setIssuedToName] = useState('')
  const [issuedToId, setIssuedToId] = useState('')
  const [selectedStore, setSelectedStore] = useState('')
  const [purpose, setPurpose] = useState('')
  const [transactionType, setTransactionType] = useState('issue')
  const [approvedByName, setApprovedByName] = useState('')

  const [allProducts, setAllProducts] = useState([])
  const [stores, setStores] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [storeInventory, setStoreInventory] = useState({})
  const [entryConfirmation, setEntryConfirmation] = useState(null)
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Filters for the Recorded Issues History table
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')

  // Filter for the Shop-Wise Equipment table
  const [storeStockSearch, setStoreStockSearch] = useState('')

  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      const data = await fetchOrders()
      // Sort by ID descending to show latest first
      const sorted = (data || []).sort((a, b) => b.id - a.id)
      setOrders(sorted)
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [storesData, equipmentData] = await Promise.all([
          fetchStores(),
          fetchEquipment()
        ])
        setStores(storesData || [])
        setAllProducts((equipmentData || []).map(e => ({
          id: e.id,
          name: e.equipment_name,
          category: e.category_name || 'General',
          totalQty: e.quantity || 0
        })))

        // Auto-select the first store by default so records and inventory appear immediately
        if (storesData && storesData.length > 0) {
          const defaultStoreId = String(storesData[0].id)
          setSelectedStore(defaultStoreId)
          try {
            const inventoryData = await fetchStoreInventory(defaultStoreId)
            const inventoryMap = {}
            ;(inventoryData || []).forEach(item => {
              inventoryMap[item.equipment_id] = (inventoryMap[item.equipment_id] || 0) + item.quantity
            })
            setStoreInventory(inventoryMap)
          } catch (invErr) {
            console.error('Failed to load initial store inventory:', invErr)
          }
        }

        await loadOrders()
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [loadOrders])

  const getStoreProductQty = (productId) => {
    return storeInventory[productId] || 0
  }

  const filteredProducts = useMemo(() => {
    return allProducts
      .map(product => ({
        ...product,
        totalQty: getStoreProductQty(product.id)
      }))
      .filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter((product) => transactionType === 'return' || product.totalQty > 0)
  }, [allProducts, storeInventory, searchQuery, transactionType])

  const handleSelectProduct = (product) => {
    const storeIdToUse = selectedStore || (stores[0] ? String(stores[0].id) : '')
    const uniqueId = `${product.id}-${storeIdToUse}`
    if (!selectedItems[uniqueId]) {
      const avail = product.totalQty !== undefined ? product.totalQty : getStoreProductQty(product.id)
      setSelectedItems(prev => ({
        ...prev,
        [uniqueId]: {
          uniqueId: uniqueId,
          id: product.id,
          storeId: storeIdToUse,
          name: product.name,
          totalQty: avail,
          selectedQty: transactionType === 'issue' ? 1 : 0,
          issuedQty: transactionType === 'return' ? 1 : 0,
          returnedQty: transactionType === 'return' ? 1 : 0,
          condition: 'NEW',
          remainingQty: avail - (transactionType === 'issue' ? 1 : 0)
        }
      }))
    }
  }

  const handleQuickIssue = (product) => {
    handleSelectProduct(product)
    if (onContinue) {
      onContinue()
    }
  }

  const handleIssueQuantityChange = (productId, newQty) => {
    setSelectedItems(prev => {
      const product = prev[productId]
      if (!product) return prev
      const qty = Math.max(0, Math.min(newQty, product.totalQty))
      return {
        ...prev,
        [productId]: {
          ...product,
          selectedQty: qty,
          remainingQty: product.totalQty - qty
        }
      }
    })
  }

  const handleReturnQtyChange = (productId, newQty) => {
    setSelectedItems(prev => {
      const product = prev[productId]
      if (!product) return prev
      const returnedQty = Math.max(0, newQty)
      return {
        ...prev,
        [productId]: {
          ...product,
          returnedQty
        }
      }
    })
  }

  const handleReturnConditionChange = (productId, condition) => {
    setSelectedItems(prev => {
      const product = prev[productId]
      if (!product) return prev
      return {
        ...prev,
        [productId]: {
          ...product,
          condition
        }
      }
    })
  }

  const handleRemoveItem = (productId) => {
    setSelectedItems(prev => {
      const updated = { ...prev }
      delete updated[productId]
      return updated
    })
  }

  const handleStoreChange = async (storeId) => {
    setSelectedStore(storeId)
    setSearchQuery('')
    setEntryConfirmation(null)

    if (storeId) {
      try {
        setLoading(true)
        const inventoryData = await fetchStoreInventory(storeId)
        const inventoryMap = {}
        ;(inventoryData || []).forEach(item => {
          inventoryMap[item.equipment_id] = (inventoryMap[item.equipment_id] || 0) + item.quantity
        })
        setStoreInventory(inventoryMap)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    } else {
      setStoreInventory({})
    }
  }

  const handleSubmitIssueReturn = async () => {
    try {
      setLoading(true)
      const selectedStoreRecord = stores.find(s => String(s.id) === String(selectedStore))

      if (transactionType === 'issue') {
        const payload = {
          user_id: null,
          approved_by_user_id: null,
          issued_to_name: issuedToName,
          issued_to_id_proof: issuedToId,
          approved_by_name: approvedByName,
          issue_date: new Date().toISOString().split('T')[0],
          purpose: purpose || 'Field Deployment',
          items: Object.values(selectedItems)
            .filter(item => (item.selectedQty ?? 0) > 0)
            .map(item => ({
              equipment_id: item.id,
              store_id: parseInt(item.storeId || selectedStore),
              quantity_issued: item.selectedQty
            }))
        }
        await createOrder(payload)
      } else {
        const payload = {
          order_id: 1,
          actual_return_date: new Date().toISOString().split('T')[0],
          items: Object.values(selectedItems)
            .filter(item => (item.returnedQty ?? 0) > 0)
            .map(item => ({
              order_item_id: 0,
              quantity_returned: item.returnedQty,
              return_condition: item.condition || 'MODERATE'
            }))
        }
        await returnItems(payload)
      }

      setEntryConfirmation({
        transactionType,
        issuedToName,
        storeName: selectedStoreRecord?.name || 'Selected Store',
        quantityHandled: totalSelectedQty,
        employeeName: approvedByName,
        submittedAt: new Date().toLocaleString()
      })
      setSelectedItems({})
      setIssuedToName('')
      setIssuedToId('')
      setSearchQuery('')
      setPurpose('')
      await loadOrders()
      if (modal) {
        onClose()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalSelectedQty = Object.values(selectedItems).reduce(
    (sum, item) => sum + (transactionType === 'issue' ? (item.selectedQty ?? 0) : (item.returnedQty ?? 0)),
    0
  )
  const selectedItemsCount = Object.keys(selectedItems).length
  const selectedStoreRecord = stores.find((store) => String(store.id) === String(selectedStore))

  const findMemberForOrder = (order) => {
    if (!order) return null
    if (order.user_id) {
      return members.find((member) => String(member.id) === String(order.user_id)) || null
    }
    const orderName = (order.issued_to_name || '').trim().toLowerCase()
    if (!orderName) return null
    return members.find((member) => {
      const memberName = (member.full_name || member.name || '').trim().toLowerCase()
      return memberName && memberName === orderName
    }) || null
  }

  const formatStatusLabel = (value) => (value || '').replace(/_/g, ' ')

  const handlePrintIssue = (order) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const generatedAt = new Date().toLocaleString()
      const matchedMember = findMemberForOrder(order)

      const equipmentNameMap = allProducts.reduce((acc, item) => {
        acc[String(item.id)] = item.name
        return acc
      }, {})

      const storeNameMap = stores.reduce((acc, store) => {
        acc[String(store.id)] = store.name
        return acc
      }, {})

      const customerEmail = matchedMember?.email || 'N/A'
      const customerPhone = matchedMember?.contact_number || matchedMember?.phone || 'N/A'
      const customerAddress = matchedMember?.address || 'N/A'

      doc.setFillColor(13, 37, 56)
      doc.rect(0, 0, pageWidth, 72, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text('Field Equipment Dispatch Manifest', 40, 44)
      doc.setFontSize(10)
      doc.text(`Generated at: ${generatedAt}`, 40, 60)

      doc.setTextColor(28, 36, 54)
      autoTable(doc, {
        startY: 92,
        theme: 'grid',
        head: [['Field', 'Value']],
        body: [
          ['Order ID', `#${order.id}`],
          ['Issue Date', formatDate(order.issue_date)],
          ['Expected Return Date', formatDate(order.expected_return_date)],
          ['Current Status', formatStatusLabel(order.status)],
          ['Issued To (Customer/Recipient)', order.issued_to_name || 'N/A'],
          ['Customer Email', customerEmail],
          ['Customer Contact', customerPhone],
          ['Customer Address', customerAddress],
          ['Customer ID Details', order.issued_to_id_proof || matchedMember?.id_proof_number || 'N/A'],
          ['Issuing Officer', order.approved_by_name || 'N/A'],
          ['Purpose', order.purpose || 'N/A'],
        ],
        headStyles: { fillColor: [0, 99, 152] },
        styles: { fontSize: 10, cellPadding: 6, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 170, fontStyle: 'bold' },
          1: { cellWidth: 345 }
        },
        margin: { left: 40, right: 40 }
      })

      const itemRows = (order.items || []).map((item) => [
        equipmentNameMap[String(item.equipment_id)] || String(item.equipment_id),
        storeNameMap[String(item.store_id)] || `Store #${item.store_id}`,
        String(item.quantity_issued ?? 0),
        String(item.quantity_returned ?? 0),
        String(item.quantity_pending ?? 0),
      ])

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 120) + 18,
        theme: 'striped',
        head: [['Equipment Name', 'Store / Depot', 'Quantity Issued', 'Quantity Returned', 'Pending']],
        body: itemRows.length > 0 ? itemRows : [['No items found', '-', '-', '-', '-']],
        headStyles: { fillColor: [15, 118, 110] },
        styles: { fontSize: 10, cellPadding: 6 },
        margin: { left: 40, right: 40 }
      })

      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text('Giripremi Equipment Management & Expedition Logistics System', 40, doc.internal.pageSize.getHeight() - 24)

      doc.save(`giripremi-issue-order-${order.id}.pdf`)
    } catch (err) {
      console.error('Failed to generate issue PDF:', err)
      setError('Could not generate issue PDF. Please try again.')
    }
  }

  // Memoized filtered orders for Recorded Issues History
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const hasItems = (order.items?.length || 0) > 0
      if (!hasItems) return false

      if (orderStatusFilter !== 'ALL' && order.status !== orderStatusFilter) {
        return false
      }

      if (!orderSearchQuery.trim()) return true

      const query = orderSearchQuery.toLowerCase()
      const idMatch = String(order.id).toLowerCase().includes(query)
      const nameMatch = (order.issued_to_name || '').toLowerCase().includes(query)
      const staffMatch = (order.approved_by_name || '').toLowerCase().includes(query)
      const purposeMatch = (order.purpose || '').toLowerCase().includes(query)
      const itemsMatch = (order.items || []).some(item => {
        const prod = allProducts.find(p => p.id === item.equipment_id)
        return (prod?.name || '').toLowerCase().includes(query)
      })

      return idMatch || nameMatch || staffMatch || purposeMatch || itemsMatch
    })
  }, [orders, orderSearchQuery, orderStatusFilter, allProducts])

  // Memoized available products for the active store
  const availableStoreProducts = useMemo(() => {
    const search = storeStockSearch.trim().toLowerCase()
    return allProducts
      .filter(p => getStoreProductQty(p.id) > 0)
      .filter(p => {
        if (!search) return true
        return p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search)
      })
  }, [allProducts, storeInventory, storeStockSearch])

  // Status badge styling helper
  const renderStatusBadge = (status) => {
    const s = (status || '').toUpperCase()
    if (s === 'ISSUED') {
      return <span className="status-pill status-amber">Issued</span>
    }
    if (s === 'RETURNED' || s === 'COMPLETED') {
      return <span className="status-pill status-green">Completed</span>
    }
    if (s === 'PARTIALLY_RETURNED') {
      return <span className="status-pill status-blue">Partially Returned</span>
    }
    return <span className="status-pill status-gray">{formatStatusLabel(status)}</span>
  }

  // ─── Modal Dialog Content ──────────────────────────────────────────────────
  const renderModalContent = () => (
    <div className="modal-backdrop" role="presentation">
      <div className="issue-modal issue-modal-large" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <span className="modal-eyebrow">FIELD EXPEDITION CIRCULATION</span>
            <h3>Issue Equipment</h3>
            <p>Allocate gear from store inventory to field personnel.</p>
          </div>
          <button onClick={onClose} type="button" className="close-btn-x" title="Close dialog">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-body issue-return-form">
          {/* Section 1: User Identification */}
          <div className="form-section">
            <div className="section-title-bar">
              <span className="title-marker" />
              <h4>Recipient Information</h4>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Recipient Full Name *</label>
                <div className="search-wrap">
                  <span className="material-symbols-outlined">person</span>
                  <input
                    placeholder="Enter full name of recipient"
                    value={issuedToName}
                    onChange={(e) => setIssuedToName(e.target.value)}
                    type="text"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>ID Proof Details</label>
                <div className="search-wrap">
                  <span className="material-symbols-outlined">badge</span>
                  <input
                    placeholder="Aadhar / Passport / Member ID (optional)"
                    value={issuedToId}
                    onChange={(e) => setIssuedToId(e.target.value)}
                    type="text"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            {issuedToName.trim() && (
              <div className="user-status-light">
                <span className="material-symbols-outlined">check_circle</span>
                <span>Ready to dispatch items to <strong>{issuedToName}</strong></span>
              </div>
            )}
          </div>

          {/* Section 2: Store & Staff */}
          <div className="form-section">
            <div className="section-title-bar">
              <span className="title-marker" />
              <h4>Store & Dispatching Officer</h4>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Dispatch Store *</label>
                <div className="select-wrap">
                  <select value={selectedStore} onChange={(e) => handleStoreChange(e.target.value)}>
                    <option value="">Select store depot...</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <span className="material-symbols-outlined">arrow_drop_down</span>
                </div>
              </div>
              <div className="form-group">
                <label>Issuing Staff Officer *</label>
                <div className="search-wrap">
                  <span className="material-symbols-outlined">badge</span>
                  <input
                    placeholder="Staff officer name"
                    value={approvedByName}
                    onChange={(e) => setApprovedByName(e.target.value)}
                    type="text"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Equipment Items Selection */}
          <div className="form-section">
            <div className="section-title-bar">
              <span className="title-marker" />
              <h4>Equipment Allocation</h4>
            </div>

            <div className="search-wrap search-full" style={{ marginBottom: '1rem' }}>
              <span className="material-symbols-outlined">search</span>
              <input
                placeholder={selectedStore ? "Filter stock items by name or category..." : 'Select a store first...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                disabled={!selectedStore}
                autoComplete="off"
              />
            </div>

            {selectedStore && (
              <div className="stock-list-section">
                <div className="stock-scroll-area">
                  {filteredProducts.length > 0 ? (
                    <table className="stock-table-compact">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th>Category</th>
                          <th style={{ textAlign: 'right' }}>Available</th>
                          <th style={{ width: '60px', textAlign: 'center' }}>Add</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(product => {
                          const isAdded = !!selectedItems[`${product.id}-${selectedStore}`]
                          return (
                            <tr key={product.id} className={isAdded ? 'row-added' : ''}>
                              <td style={{ fontWeight: 600 }}>{product.name}</td>
                              <td><span className="category-chip">{product.category}</span></td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{product.totalQty}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className={`action-icon-btn ${isAdded ? 'added' : ''}`}
                                  onClick={() => handleSelectProduct(product)}
                                  disabled={isAdded}
                                  title={isAdded ? "Added to selection" : "Add item"}
                                >
                                  <span className="material-symbols-outlined">
                                    {isAdded ? 'check_circle' : 'add_circle'}
                                  </span>
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-results">
                      <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', opacity: 0.4 }}>inventory_2</span>
                      <span>No units currently available in this store depot.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected Items Cart */}
            {selectedItemsCount > 0 && (
              <div className="cart-container">
                <div className="cart-header">
                  <span className="material-symbols-outlined cart-icon">shopping_bag</span>
                  <h5>Selected Equipment ({selectedItemsCount} {selectedItemsCount === 1 ? 'item' : 'items'})</h5>
                  <button type="button" className="ghost-link danger" onClick={() => setSelectedItems({})}>
                    Clear All
                  </button>
                </div>
                <div className="cart-list">
                  {Object.values(selectedItems).map(item => {
                    const itemKey = item.uniqueId || item.id
                    const storeName = stores.find(s => String(s.id) === String(item.storeId))?.name || ''
                    return (
                      <div className="cart-item-card" key={itemKey}>
                        <div className="cart-item-main">
                          <div className="cart-item-info">
                            <p className="item-name">{item.name}</p>
                            <span className="item-stock-ref">
                              Depot Stock: <strong>{item.totalQty}</strong> {storeName ? `• ${storeName}` : ''}
                            </span>
                          </div>
                          <div className="cart-qty-wrap">
                            <div className="qty-stepper">
                              <button
                                type="button"
                                onClick={() => handleIssueQuantityChange(itemKey, (item.selectedQty ?? 0) - 1)}
                                className="stepper-btn"
                                title="Decrease"
                              >
                                <span className="material-symbols-outlined">remove</span>
                              </button>
                              <input
                                type="number"
                                value={item.selectedQty ?? 0}
                                onChange={(e) => handleIssueQuantityChange(itemKey, parseInt(e.target.value) || 0)}
                                className="stepper-field"
                              />
                              <button
                                type="button"
                                onClick={() => handleIssueQuantityChange(itemKey, (item.selectedQty ?? 0) + 1)}
                                className="stepper-btn"
                                title="Increase"
                              >
                                <span className="material-symbols-outlined">add</span>
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(itemKey)}
                              className="icon-btn danger-text"
                              title="Remove item"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Purpose */}
          <div className="form-section">
            <div className="section-title-bar">
              <span className="title-marker" />
              <h4>Expedition Purpose / Notes</h4>
            </div>
            <textarea
              placeholder="State the expedition summit, training camp, or purpose notes..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows="3"
              className="form-textarea"
            />
          </div>
        </div>

        <div className="modal-foot">
          <button className="secondary-btn" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={handleSubmitIssueReturn}
            disabled={!issuedToName.trim() || !selectedStore || !approvedByName.trim() || totalSelectedQty === 0}
            type="button"
          >
            <span className="material-symbols-outlined">send</span>
            <span>Confirm & Dispatch ({totalSelectedQty} units)</span>
          </button>
        </div>

        {entryConfirmation && (
          <div className="entry-confirmation-toast">
            <span className="material-symbols-outlined">check_circle</span>
            <div className="toast-content">
              <strong>Equipment Issue Recorded!</strong>
              <p>For {entryConfirmation.issuedToName} ({entryConfirmation.quantityHandled} items)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ─── Main Page View Content ────────────────────────────────────────────────
  const renderPageContent = () => (
    <section className="content-shell inventory-reference-page">
      {/* Page Header */}
      <div className="inventory-reference-heading">
        <div>
          <span className="inventory-reference-eyebrow">FIELD EXPEDITION CIRCULATION</span>
          <h1>Issue Equipment</h1>
          <p>Manage field gear dispatches, monitor active loans, and review store depot stocks.</p>
        </div>
        <div className="inventory-actions">
          <button
            className="secondary-btn"
            onClick={loadOrders}
            type="button"
            title="Synchronize Records"
            disabled={loadingOrders}
          >
            <span className={`material-symbols-outlined${loadingOrders ? ' spin' : ''}`}>sync</span>
            <span>Sync Records</span>
          </button>
          {!readOnly ? (
            <button className="primary-btn" onClick={onContinue} type="button">
              <span className="material-symbols-outlined">add_box</span>
              <span>+ Issue Equipment</span>
            </button>
          ) : null}
        </div>
      </div>

      {readOnly ? (
        <div className="info-banner">
          <span className="material-symbols-outlined">info</span>
          <span>Customer mode: equipment requests can be reviewed only after handover approval.</span>
        </div>
      ) : null}

      {/* Summary Telemetry Metrics */}
      <div className="inventory-reference-summary">
        <div>
          <span className="material-symbols-outlined">outbox</span>
          <strong>{orders.length}</strong>
          <small>Total Issues Logged</small>
        </div>
        <div>
          <span className="material-symbols-outlined">pending_actions</span>
          <strong>{orders.filter(o => o.status === 'ISSUED' || o.status === 'PARTIALLY_RETURNED').length}</strong>
          <small>Active Dispatches</small>
        </div>
        <div>
          <span className="material-symbols-outlined">task_alt</span>
          <strong>{orders.filter(o => o.status === 'RETURNED' || o.status === 'COMPLETED').length}</strong>
          <small>Returned & Completed</small>
        </div>
        <div>
          <span className="material-symbols-outlined">warehouse</span>
          <strong>{stores.length}</strong>
          <small>Active Supply Depots</small>
        </div>
      </div>

      {/* Section 1: Recorded Issues History (Improved Table) */}
      <div className="issue-section-container">
        <div className="section-header-block">
          <div>
            <div className="section-title-line">
              <span className="title-marker" />
              <h3>Recorded Issues History</h3>
            </div>
            <p className="section-subtext">Chronological history of all dispatches and returned orders</p>
          </div>
          <span className="count-pill">{filteredOrders.length} records</span>
        </div>

        <div className="table-shell inventory-reference-table">
          <div className="filters">
            <div className="search-wrap">
              <span className="material-symbols-outlined">search</span>
              <input
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Search by Order #, Recipient, Staff, or Equipment..."
                type="text"
                value={orderSearchQuery}
              />
              {orderSearchQuery && (
                <button
                  type="button"
                  onClick={() => setOrderSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#73777d' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span>
                </button>
              )}
            </div>

            <div className="filter-group">
              <select
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                value={orderStatusFilter}
                className="status-filter-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="ISSUED">Issued (Active)</option>
                <option value="PARTIALLY_RETURNED">Partially Returned</option>
                <option value="RETURNED">Completed / Returned</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="table-scroll-container">
            <table className="issue-data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '95px' }}>Order #</th>
                  <th style={{ minWidth: '135px' }}>Dispatch Date</th>
                  <th style={{ minWidth: '220px' }}>Issued To (Recipient)</th>
                  <th style={{ minWidth: '150px' }}>Issuing Staff</th>
                  <th style={{ minWidth: '140px' }}>Purpose</th>
                  <th style={{ minWidth: '360px' }}>Equipment Items</th>
                  <th style={{ minWidth: '100px', textAlign: 'center' }}>Total Qty</th>
                  <th style={{ minWidth: '130px' }}>Status</th>
                  <th style={{ minWidth: '170px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity_issued || 0), 0)
                    const recipientInitial = (order.issued_to_name || 'U').charAt(0).toUpperCase()
                    return (
                      <tr key={order.id} className="order-row">
                        <td>
                          <span className="order-id-chip">#{order.id}</span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className="date-chip">
                            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', opacity: 0.6 }}>calendar_today</span>
                            {formatDate(order.issue_date)}
                          </span>
                        </td>
                        <td>
                          <div className="recipient-cell">
                            <div className="recipient-avatar">{recipientInitial}</div>
                            <div>
                              <strong className="recipient-name">{order.issued_to_name || 'N/A'}</strong>
                              {order.issued_to_id_proof ? (
                                <small className="recipient-id">ID: {order.issued_to_id_proof}</small>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="staff-text">{order.approved_by_name || '—'}</span>
                        </td>
                        <td>
                          <span className="purpose-pill" title={order.purpose}>
                            {order.purpose || 'General Issue'}
                          </span>
                        </td>
                        <td>
                          <div className="items-tags-wrap">
                            {(order.items || []).map(item => {
                              const equip = allProducts.find(p => p.id === item.equipment_id)
                              const equipName = equip?.name || `Item #${item.equipment_id}`
                              return (
                                <span key={item.id} className="equipment-tag">
                                  <span className="material-symbols-outlined tag-icon">deployed_code</span>
                                  <span className="tag-name">{equipName}</span>
                                  <strong className="tag-qty">×{item.quantity_issued}</strong>
                                  {item.quantity_pending > 0 ? (
                                    <span className="tag-pending">({item.quantity_pending} due)</span>
                                  ) : null}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="qty-total-badge">{totalQty}</span>
                        </td>
                        <td>
                          {renderStatusBadge(order.status)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="print-issue-btn"
                            onClick={() => handlePrintIssue(order)}
                            title={`Download manifest PDF for Order #${order.id}`}
                          >
                            <span className="material-symbols-outlined">picture_as_pdf</span>
                            <span>Print Manifest</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="empty-table-msg">
                      <span className="material-symbols-outlined empty-icon">assignment_late</span>
                      <strong>{loadingOrders ? 'Loading issues…' : 'No matching issue records found.'}</strong>
                      <p>Adjust your search filters or create a new equipment issue above.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 2: Shop-Wise Equipment (Auto-selected default shop + records displayed) */}
      <div className="issue-section-container" style={{ marginTop: '2.5rem' }}>
        <div className="section-header-block">
          <div>
            <div className="section-title-line">
              <span className="title-marker" />
              <h3>Shop-Wise Available Equipment</h3>
            </div>
            <p className="section-subtext">Live product-wise stock available in the selected store depot</p>
          </div>
          <span className="count-pill">
            {availableStoreProducts.length} items in stock
          </span>
        </div>

        {/* Store Selector Toolbar */}
        <div className="store-selector-toolbar">
          <div className="store-selector-field">
            <label htmlFor="store-view-select" className="store-field-label">
              <span className="material-symbols-outlined">warehouse</span>
              <span>Active Store / Depot:</span>
            </label>
            <div className="store-dropdown-wrap">
              <select
                id="store-view-select"
                value={selectedStore}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="store-select-input"
              >
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} {store.location ? `(${store.location})` : ''}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined select-chevron">expand_more</span>
            </div>
          </div>

          <div className="store-stock-search-wrap">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search equipment in this store..."
              value={storeStockSearch}
              onChange={(e) => setStoreStockSearch(e.target.value)}
              className="store-search-input"
            />
            {storeStockSearch && (
              <button type="button" onClick={() => setStoreStockSearch('')} className="clear-search-btn">
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Shop Stock Table */}
        <div className="table-shell inventory-reference-table" style={{ marginTop: '1rem' }}>
          <div className="table-scroll-container">
            <table className="issue-data-table store-stock-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '280px' }}>Equipment Name</th>
                  <th style={{ minWidth: '160px' }}>Category</th>
                  <th style={{ minWidth: '180px' }}>Location / Depot</th>
                  <th style={{ minWidth: '150px', textAlign: 'right' }}>Available Stock</th>
                  <th style={{ minWidth: '130px' }}>Stock Status</th>
                  <th style={{ minWidth: '160px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {availableStoreProducts.length > 0 ? (
                  availableStoreProducts.map((product) => {
                    const qty = getStoreProductQty(product.id)
                    const isLow = qty <= 2
                    return (
                      <tr key={`store-item-${product.id}`} className="order-row">
                        <td>
                          <div className="equipment-name-cell">
                            <span className="material-symbols-outlined item-lead-icon">hardware</span>
                            <strong>{product.name}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="category-chip">{product.category}</span>
                        </td>
                        <td>
                          <span className="store-badge">
                            <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>storefront</span>
                            {selectedStoreRecord?.name || 'Selected Depot'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="stock-qty-number">{qty} units</span>
                        </td>
                        <td>
                          {isLow ? (
                            <span className="status-pill status-amber">Low Stock</span>
                          ) : (
                            <span className="status-pill status-green">In Stock</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="dispatch-action-btn"
                            onClick={() => handleQuickIssue(product)}
                            title={`Quick Issue ${product.name} from this store`}
                          >
                            <span className="material-symbols-outlined">outbox</span>
                            <span>Dispatch This</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-table-msg">
                      <span className="material-symbols-outlined empty-icon">inventory_2</span>
                      <strong>No equipment in stock for this store depot.</strong>
                      <p>Select another store from the dropdown above or check inventory replenishments.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <>
      <style>{styles}</style>
      {modal ? renderModalContent() : renderPageContent()}
    </>
  )
}

function formatDate(isoStr) {
  if (!isoStr) return '-'
  const parts = isoStr.split('T')[0].split('-')
  if (parts.length !== 3) return isoStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

// ─── Scoped Component Styles Matching New Theme ─────────────────────────────
const styles = `
  /* Section Header Blocks */
  .issue-section-container {
    margin-top: 1.75rem;
  }

  .section-header-block {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding: 0 0.25rem;
  }

  .section-title-line {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .section-title-line h3 {
    font: 600 20px/26px 'Space Grotesk', sans-serif;
    color: #0b1c30;
    margin: 0;
  }

  .section-subtext {
    font: 400 13px/18px 'Geist', sans-serif;
    color: #555b63;
    margin: 0.25rem 0 0 1.25rem;
  }

  .count-pill {
    background: #eff4ff;
    color: #006398;
    border: 1px solid #c3c7cd;
    border-radius: 20px;
    padding: 0.3rem 0.85rem;
    font: 600 11px/16px 'JetBrains Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Table scroll container and responsive rules */
  .table-scroll-container {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 0 0 12px 12px;
  }

  .table-scroll-container::-webkit-scrollbar {
    height: 8px;
  }

  .table-scroll-container::-webkit-scrollbar-track {
    background: #f1f4f9;
    border-radius: 4px;
  }

  .table-scroll-container::-webkit-scrollbar-thumb {
    background: #c3c7cd;
    border-radius: 4px;
  }

  .table-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #73777d;
  }

  /* Table styling */
  .issue-data-table {
    width: 100%;
    min-width: 1250px;
    border-collapse: collapse;
    background: #fff;
  }

  .store-stock-table {
    min-width: 1000px;
  }

  .issue-data-table th {
    background: #eff4ff !important;
    color: #43474c !important;
    font: 500 11px/16px 'JetBrains Mono', monospace !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    padding: 0.95rem 1.15rem !important;
    text-align: left;
    border-bottom: 1px solid #e5eeff !important;
    white-space: nowrap;
  }

  .issue-data-table td {
    padding: 1rem 1.15rem !important;
    border-bottom: 1px solid #f0f4fc !important;
    font: 400 13.5px/20px 'Geist', sans-serif !important;
    color: #0b1c30 !important;
    vertical-align: middle;
  }

  .order-row:hover {
    background: #f8fbff;
  }

  /* Cell chips and badges */
  .order-id-chip {
    font: 600 12px/16px 'JetBrains Mono', monospace;
    color: #006398;
    background: #eff4ff;
    padding: 0.3rem 0.65rem;
    border-radius: 6px;
    border: 1px solid rgba(0, 99, 152, 0.2);
    display: inline-block;
  }

  .date-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: #555b63;
    font-size: 13px;
    white-space: nowrap;
  }

  .recipient-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .recipient-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #0d2538;
    color: #f8f9ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font: 600 13px/1 'Space Grotesk', sans-serif;
    flex-shrink: 0;
  }

  .recipient-name {
    display: block;
    font-weight: 600;
    color: #0b1c30;
    font-size: 13.5px;
  }

  .recipient-id {
    display: block;
    color: #73777d;
    font-size: 11.5px;
    font-family: 'JetBrains Mono', monospace;
  }

  .staff-text {
    color: #555b63;
    font-weight: 500;
    font-size: 13px;
  }

  .purpose-pill {
    background: #f4f6fa;
    color: #43474c;
    padding: 0.3rem 0.75rem;
    border-radius: 6px;
    font-size: 12.5px;
    display: inline-block;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Items Tags inside table - Spacious & Prominent */
  .items-tags-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 340px;
    padding: 0.25rem 0;
  }

  .equipment-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    background: #f8fafc;
    color: #1e293b;
    border-radius: 8px;
    padding: 0.4rem 0.8rem;
    font-size: 13px;
    border: 1px solid #cbd5e1;
    box-shadow: 0 1px 2px rgba(13, 37, 56, 0.04);
    width: fit-content;
  }

  .tag-icon {
    font-size: 1.15rem !important;
    color: #006398;
    flex-shrink: 0;
  }

  .tag-name {
    font-weight: 600;
    color: #0b1c30;
    font-size: 13px;
  }

  .tag-qty {
    color: #006398;
    background: #e0f2fe;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
  }

  .tag-pending {
    color: #92400e;
    background: #fef3c7;
    border: 1px solid #fde68a;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }

  .qty-total-badge {
    font: 700 13px/18px 'JetBrains Mono', monospace;
    background: #f8f9ff;
    border: 1px solid #c3c7cd;
    color: #0d2538;
    padding: 0.25rem 0.65rem;
    border-radius: 12px;
    display: inline-block;
  }

  /* Status Pills */
  .status-pill {
    padding: 0.3rem 0.75rem;
    border-radius: 20px;
    font: 600 11px/14px 'JetBrains Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    display: inline-block;
    white-space: nowrap;
  }

  .status-amber {
    background: #fffbeb;
    color: #92400e;
    border: 1px solid #fde68a;
  }

  .status-green {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .status-blue {
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }

  .status-gray {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  /* Actions buttons */
  .print-issue-btn {
    border: 1px solid #c3c7cd;
    background: #eff4ff;
    color: #006398;
    border-radius: 8px;
    padding: 0.5rem 0.95rem;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font: 600 12.5px/16px 'Geist', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    box-shadow: 0 1px 2px rgba(0, 99, 152, 0.08);
  }

  .print-issue-btn:hover {
    background: #006398;
    color: #fff;
    border-color: #006398;
  }

  .print-issue-btn span.material-symbols-outlined {
    font-size: 1rem;
  }

  /* Store Selector Toolbar */
  .store-selector-toolbar {
    background: #fff;
    border: 1px solid #e5eeff;
    border-radius: 12px;
    padding: 0.85rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
    flex-wrap: wrap;
    box-shadow: 0 1px 4px rgba(13, 37, 56, 0.03);
  }

  .store-selector-field {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .store-field-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font: 600 13px/18px 'Geist', sans-serif;
    color: #0b1c30;
    white-space: nowrap;
  }

  .store-field-label span.material-symbols-outlined {
    color: #f65200;
    font-size: 1.2rem;
  }

  .store-dropdown-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .store-select-input {
    appearance: none;
    background: #f8f9ff;
    border: 1px solid #c3c7cd;
    border-radius: 8px;
    padding: 0.55rem 2.2rem 0.55rem 0.85rem;
    font: 600 13.5px/18px 'Geist', sans-serif;
    color: #0b1c30;
    cursor: pointer;
    min-width: 220px;
    outline: none;
    transition: border-color 0.2s;
  }

  .store-select-input:focus {
    border-color: #006398;
    box-shadow: 0 0 0 3px rgba(0, 99, 152, 0.12);
  }

  .select-chevron {
    position: absolute;
    right: 0.6rem;
    pointer-events: none;
    color: #73777d;
    font-size: 1.2rem;
  }

  .store-stock-search-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f8f9ff;
    border: 1px solid #c3c7cd;
    border-radius: 8px;
    padding: 0.45rem 0.85rem;
    min-width: 260px;
  }

  .store-stock-search-wrap span.material-symbols-outlined {
    color: #73777d;
    font-size: 1.1rem;
  }

  .store-search-input {
    border: none;
    background: transparent;
    outline: none;
    font: 400 13px/18px 'Geist', sans-serif;
    color: #0b1c30;
    width: 100%;
  }

  .clear-search-btn {
    background: none;
    border: none;
    color: #73777d;
    cursor: pointer;
    display: flex;
    padding: 0;
  }

  /* Shop-Wise Table Cells */
  .equipment-name-cell {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .item-lead-icon {
    color: #f65200;
    font-size: 1.15rem !important;
  }

  .store-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #eff4ff;
    color: #006398;
    border-radius: 6px;
    padding: 0.25rem 0.6rem;
    font-size: 12px;
    font-weight: 500;
  }

  .stock-qty-number {
    font: 700 13.5px/18px 'JetBrains Mono', monospace;
    color: #0d2538;
  }

  .dispatch-action-btn {
    border: 1px solid #c3c7cd;
    background: #fff;
    color: #0b1c30;
    border-radius: 8px;
    padding: 0.45rem 0.85rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font: 600 12px/16px 'Geist', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dispatch-action-btn:hover {
    background: #f65200;
    color: #fff;
    border-color: #f65200;
  }

  .dispatch-action-btn span.material-symbols-outlined {
    font-size: 1rem;
  }

  /* Empty table state */
  .empty-table-msg {
    text-align: center;
    padding: 3rem 1.5rem !important;
    color: #73777d;
  }

  .empty-icon {
    font-size: 2.5rem !important;
    opacity: 0.3;
    display: block;
    margin: 0 auto 0.5rem;
  }

  .empty-table-msg strong {
    display: block;
    font-size: 14px;
    color: #0b1c30;
    margin-bottom: 0.25rem;
  }

  .empty-table-msg p {
    font-size: 12.5px;
    color: #73777d;
    margin: 0;
  }

  /* Status Filter Select in Table header */
  .status-filter-select {
    background: #fff;
    border: 1px solid #c3c7cd;
    border-radius: 8px;
    padding: 0.55rem 0.85rem;
    font: 500 13px/18px 'Geist', sans-serif;
    color: #0b1c30;
    outline: none;
    cursor: pointer;
  }

  /* Modal Specific Styles */
  .modal-eyebrow {
    font: 600 10.5px/14px 'JetBrains Mono', monospace;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #f65200;
    display: block;
    margin-bottom: 0.2rem;
  }

  .close-btn-x {
    background: #eff4ff;
    color: #43474c;
    border: none;
    border-radius: 8px;
    width: 34px;
    height: 34px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn-x:hover {
    background: #ffe5e5;
    color: #ba1a1a;
  }

  .section-title-bar {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 1rem;
  }

  .title-marker {
    width: 4px;
    height: 16px;
    background: #f65200;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .section-title-bar h4 {
    font: 600 15px/22px 'Space Grotesk', sans-serif;
    color: #0b1c30;
    margin: 0;
  }

  .user-status-light {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.75rem 1rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    margin-top: 0.85rem;
    color: #166534;
    font-size: 13px;
    font-weight: 500;
  }

  .user-status-light span.material-symbols-outlined {
    font-size: 1.15rem;
    color: #16a34a;
  }

  .stock-list-section {
    border: 1px solid #e5eeff;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    margin-top: 0.5rem;
  }

  .stock-scroll-area {
    max-height: 220px;
    overflow-y: auto;
  }

  .stock-table-compact {
    width: 100%;
    border-collapse: collapse;
  }

  .stock-table-compact th {
    background: #eff4ff;
    text-align: left;
    padding: 0.75rem 1rem;
    font: 500 11px/14px 'JetBrains Mono', monospace;
    color: #43474c;
    position: sticky;
    top: 0;
    z-index: 5;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e5eeff;
  }

  .stock-table-compact td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f0f4fc;
    font-size: 13px;
  }

  .stock-table-compact tr.row-added {
    background: #f8fbff;
    opacity: 0.85;
  }

  .action-icon-btn {
    background: #eff4ff;
    color: #006398;
    border: none;
    border-radius: 6px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .action-icon-btn:hover:not(:disabled) {
    background: #006398;
    color: #fff;
  }

  .action-icon-btn.added {
    background: #f0fdf4;
    color: #16a34a;
    cursor: default;
  }

  /* Cart Container */
  .cart-container {
    margin-top: 1.25rem;
    background: #fff;
    border: 1.5px solid #006398;
    border-radius: 12px;
    padding: 1.15rem;
  }

  .cart-header {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 1rem;
  }

  .cart-icon {
    color: #006398;
    font-size: 1.25rem;
  }

  .cart-header h5 {
    flex: 1;
    margin: 0;
    font: 600 14px/20px 'Space Grotesk', sans-serif;
    color: #0b1c30;
  }

  .ghost-link.danger {
    background: none;
    border: none;
    color: #ba1a1a;
    font: 600 12px/16px 'Geist', sans-serif;
    cursor: pointer;
  }

  .cart-item-card {
    background: #f8f9ff;
    border: 1px solid #e5eeff;
    border-radius: 8px;
    padding: 0.85rem 1rem;
    margin-bottom: 0.75rem;
  }

  .cart-item-card:last-child {
    margin-bottom: 0;
  }

  .cart-item-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .cart-item-info .item-name {
    font-weight: 600;
    font-size: 13.5px;
    color: #0b1c30;
    margin: 0 0 0.15rem;
  }

  .cart-item-info .item-stock-ref {
    font-size: 11.5px;
    color: #555b63;
  }

  .cart-item-info .item-stock-ref strong {
    color: #006398;
  }

  .cart-qty-wrap {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .qty-stepper {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px solid #c3c7cd;
    border-radius: 8px;
    padding: 0.2rem;
  }

  .stepper-btn {
    background: #eff4ff;
    border: none;
    border-radius: 6px;
    color: #0b1c30;
    width: 28px;
    height: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .stepper-btn:hover {
    background: #006398;
    color: #fff;
  }

  .stepper-btn span {
    font-size: 1rem;
  }

  .stepper-field {
    width: 40px;
    border: none !important;
    background: transparent !important;
    text-align: center;
    font: 700 13px 'JetBrains Mono', monospace;
    color: #0b1c30;
    padding: 0 !important;
    min-height: unset !important;
  }

  .icon-btn.danger-text {
    background: none;
    border: none;
    color: #73777d;
    cursor: pointer;
    display: flex;
    padding: 0.3rem;
    border-radius: 6px;
    transition: color 0.2s;
  }

  .icon-btn.danger-text:hover {
    color: #ba1a1a;
    background: #ffe5e5;
  }

  .form-textarea {
    width: 100%;
    border: 1px solid #c3c7cd;
    border-radius: 8px;
    padding: 0.85rem 1rem;
    font: 400 13.5px/20px 'Geist', sans-serif;
    color: #0b1c30;
    box-sizing: border-box;
    outline: none;
  }

  .form-textarea:focus {
    border-color: #006398;
    box-shadow: 0 0 0 3px rgba(0, 99, 152, 0.12);
  }

  /* Toast Notification */
  .entry-confirmation-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0d2538;
    color: #fff;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    box-shadow: 0 12px 32px rgba(13, 37, 56, 0.35);
    z-index: 10000;
  }

  .entry-confirmation-toast span.material-symbols-outlined {
    color: #22c55e;
    font-size: 1.5rem;
  }

  .toast-content strong {
    display: block;
    font-size: 13.5px;
  }

  .toast-content p {
    margin: 0.2rem 0 0;
    font-size: 12px;
    color: #c3c7cd;
  }
`

export default IssueReturnPage
