import React, { useState, useEffect, useCallback } from 'react'
import { fetchStores } from '../api/storesApi'
import { fetchEquipment } from '../api/equipmentApi'
import { createOrder, returnItems, fetchOrders } from '../api/ordersApi'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function IssueReturnPage({ members = [], readOnly, userType, modal = false, onClose = () => { }, onContinue = () => { } }) {
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

  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      const data = await fetchOrders()
      // Sort by date/id descending to show latest first
      const sorted = data.sort((a, b) => b.id - a.id)
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
        setStores(storesData)
        setAllProducts(equipmentData.map(e => ({
          id: e.id,
          name: e.equipment_name,
          category: e.category_name || 'General',
          totalQty: e.quantity || 0
        })))
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

  const filteredProducts = allProducts
    .map(product => ({
      ...product,
      totalQty: getStoreProductQty(product.id)
    }))
    .filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((product) => transactionType === 'return' || product.totalQty > 0)

  const handleSelectProduct = (product) => {
    const uniqueId = `${product.id}-${selectedStore}`
    if (!selectedItems[uniqueId]) {
      setSelectedItems(prev => ({
        ...prev,
        [uniqueId]: {
          uniqueId: uniqueId,
          id: product.id,
          storeId: selectedStore,
          name: product.name,
          totalQty: product.totalQty,
          selectedQty: transactionType === 'issue' ? 1 : 0,
          issuedQty: transactionType === 'return' ? 1 : 0,
          returnedQty: transactionType === 'return' ? 1 : 0,
          condition: 'NEW',
          remainingQty: product.totalQty - (transactionType === 'issue' ? 1 : 0)
        }
      }))
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
    // setSelectedItems({}) // Allow multi-store selections
    setSearchQuery('')
    setEntryConfirmation(null)

    if (storeId) {
      try {
        setLoading(true)
        const response = await fetch(`/api/inventory/store/${storeId}`)
        if (!response.ok) throw new Error('Failed to fetch store inventory')
        const inventoryData = await response.json()
        const inventoryMap = {}
        inventoryData.forEach(item => {
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
          purpose: purpose || 'None',
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

      doc.setFillColor(33, 84, 185)
      doc.rect(0, 0, pageWidth, 72, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text('Issue Details Report', 40, 44)
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
          ['Actual Return Date', formatDate(order.actual_return_date)],
          ['Current Status', formatStatusLabel(order.status)],
          ['Issued To (Customer/User)', order.issued_to_name || 'N/A'],
          ['Customer Email', customerEmail],
          ['Customer Contact', customerPhone],
          ['Customer Address', customerAddress],
          ['Customer ID Proof', order.issued_to_id_proof || matchedMember?.id_proof_number || 'N/A'],
          ['Issuing Employee', order.approved_by_name || 'N/A'],
          ['Purpose', order.purpose || 'N/A'],
          ['Purpose Details', order.purpose_details || 'N/A']
        ],
        headStyles: { fillColor: [37, 99, 235] },
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
        String(item.quantity_lost ?? 0)
      ])

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 120) + 18,
        theme: 'striped',
        head: [['Equipment', 'Store', 'Issued Qty', 'Returned Qty', 'Pending Qty', 'Lost Qty']],
        body: itemRows.length > 0 ? itemRows : [['No items found', '-', '-', '-', '-', '-']],
        headStyles: { fillColor: [15, 118, 110] },
        styles: { fontSize: 10, cellPadding: 6 },
        margin: { left: 40, right: 40 }
      })

      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text('Generated by Giripremi Equipment Management System', 40, doc.internal.pageSize.getHeight() - 24)

      doc.save(`issue-order-${order.id}.pdf`)
    } catch (err) {
      console.error('Failed to generate issue PDF:', err)
      setError('Could not generate issue PDF. Please try again.')
    }
  }

  const renderModalContent = () => (
    <div className="modal-backdrop" role="presentation">
      <div className="issue-modal issue-modal-large" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h3>Issue Equipment</h3>
            <p>Issue flow: deduct items from selected store inventory</p>
          </div>
          <button onClick={onClose} type="button" className="close-btn-x">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-body issue-return-form">


          <div className="form-section">
            <div className="section-title-bar">
              <span className="title-marker"></span>
              <h4>User Identification</h4>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>User Name *</label>
                <div className="search-wrap">
                  <span className="material-symbols-outlined">person</span>
                  <input
                    placeholder="Enter user full name"
                    value={issuedToName}
                    onChange={(e) => setIssuedToName(e.target.value)}
                    type="text"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>ID Details</label>
                <div className="search-wrap">
                  <span className="material-symbols-outlined">badge</span>
                  <input
                    placeholder="Aadhar / Other (optional)"
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
                <span>Ready to {transactionType} to/from <strong>{issuedToName}</strong></span>
              </div>
            )}
          </div>

          <div className="form-section">
            <div className="section-title-bar">
              <span className="title-marker"></span>
              <h4>Store & Staff Details</h4>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Select Store *</label>
                <div className="select-wrap">
                  <select value={selectedStore} onChange={(e) => handleStoreChange(e.target.value)}>
                    <option value="">Choose a store...</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <span className="material-symbols-outlined">arrow_drop_down</span>
                </div>
              </div>
              <div className="form-group">
                <label>Issuing Employee *</label>
                <div className="search-wrap">
                  <span className="material-symbols-outlined">person</span>
                  <input
                    placeholder="Enter employee name"
                    value={approvedByName}
                    onChange={(e) => setApprovedByName(e.target.value)}
                    type="text"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-title-bar">
              <span className="title-marker"></span>
              <h4>Items Selection</h4>
            </div>
            <div className="search-wrap search-full" style={{ marginBottom: '1rem' }}>
              <span className="material-symbols-outlined">search</span>
              <input
                placeholder={selectedStore ? "Filter stock by name..." : 'Select store first...'}
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
                          <th style={{ textAlign: 'right' }}>Stock</th>
                          <th style={{ width: '60px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(product => {
                          const isAdded = !!selectedItems[`${product.id}-${selectedStore}`]
                          return (
                            <tr key={product.id} className={isAdded ? 'row-added' : ''}>
                              <td>{product.name}</td>
                              <td><span className="category-chip">{product.category}</span></td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{product.totalQty}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className={`action-icon-btn ${isAdded ? 'added' : ''}`}
                                  onClick={() => handleSelectProduct(product)}
                                  disabled={isAdded}
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
                  ) : <div className="no-results">No units available.</div>}
                </div>
              </div>
            )}

            {selectedItemsCount > 0 && (
              <div className="cart-container">
                <div className="cart-header">
                  <span className="material-symbols-outlined cart-icon">shopping_cart</span>
                  <h5>Selected Items ({selectedItemsCount})</h5>
                  <button type="button" className="ghost-link danger" onClick={() => setSelectedItems({})}>Clear All</button>
                </div>
                <div className="cart-list">
                  {Object.values(selectedItems).map(item => {
                    const itemKey = item.uniqueId || item.id;
                    const storeName = stores.find(s => String(s.id) === String(item.storeId))?.name || '';
                    return (
                      <div className="cart-item-card" key={itemKey}>
                        <div className="cart-item-main">
                          <div className="cart-item-info">
                            <p className="item-name">{item.name}</p>
                            <span className="item-stock-ref">Available: <strong>{item.totalQty}</strong> {storeName && `| ${storeName}`}</span>
                          </div>
                          <div className="cart-qty-wrap">
                            {transactionType === 'issue' ? (
                              <div className="qty-stepper">
                                <button type="button" onClick={() => handleIssueQuantityChange(itemKey, (item.selectedQty ?? 0) - 1)} className="stepper-btn">
                                  <span className="material-symbols-outlined">remove</span>
                                </button>
                                <input
                                  type="number"
                                  value={item.selectedQty ?? 0}
                                  onChange={(e) => handleIssueQuantityChange(itemKey, parseInt(e.target.value) || 0)}
                                  className="stepper-field"
                                />
                                <button type="button" onClick={() => handleIssueQuantityChange(itemKey, (item.selectedQty ?? 0) + 1)} className="stepper-btn">
                                  <span className="material-symbols-outlined">add</span>
                                </button>
                              </div>
                            ) : (
                              <div className="return-controls-wrap">
                                <input
                                  type="number"
                                  value={item.returnedQty ?? 0}
                                  onChange={(e) => handleReturnQtyChange(itemKey, parseInt(e.target.value) || 0)}
                                  className="mini-qty-input"
                                  placeholder="Qty"
                                />
                                <div className="mini-select-wrap">
                                  <select value={item.condition || 'NEW'} onChange={(e) => handleReturnConditionChange(itemKey, e.target.value)}>
                                    <option value="NEW">New</option>
                                    <option value="MODERATE">Moderate</option>
                                    <option value="DISCARD">Discard</option>
                                  </select>
                                </div>
                              </div>
                            )}
                            <button type="button" onClick={() => handleRemoveItem(itemKey)} className="icon-btn danger-text">
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

          <div className="form-section">
            <div className="section-title-bar">
              <span className="title-marker"></span>
              <h4>Purpose</h4>
            </div>
            <textarea
              placeholder="Enter purpose or additional notes..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows="3"
              className="form-textarea"
            />
          </div>
        </div>

        <div className="modal-foot">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button
            className="primary-btn"
            onClick={handleSubmitIssueReturn}
            disabled={!issuedToName.trim() || !selectedStore || !approvedByName.trim() || totalSelectedQty === 0}
          >
            Submit Issue
          </button>
        </div>

        {entryConfirmation && (
          <div className="entry-confirmation-toast">
            <span className="material-symbols-outlined">check_circle</span>
            <div className="toast-content">
              <strong>{entryConfirmation.transactionType} recorded!</strong>
              <p>For {entryConfirmation.issuedToName} ({entryConfirmation.quantityHandled} units)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderPageContent = () => (
    <section className="content-shell">
      <div className="section-head compact">
        <h2>{userType === "customer" ? "Your Issues" : "Issue Equipment"}</h2>
        {!readOnly ? (
          <button className="primary-btn" onClick={onContinue} type="button">
            <span className="material-symbols-outlined">arrow_forward</span>
            <span>Start Issue</span>
          </button>
        ) : null}
      </div>

      {readOnly ? (
        <div className="info-banner">Customer mode: requests can be updated only after item handover.</div>
      ) : null}

      <div className="history-section" style={{ marginBottom: '2rem' }}>
        <div className="section-title-bar">
          <span className="title-marker" style={{ height: '24px' }}></span>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-dark)' }}>Recorded Issues History</h3>
        </div>

        <div className="table-shell" style={{ marginTop: '1rem' }}>
          <table className="stock-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Issued To</th>
                <th>Approved By</th>
                <th>Purpose</th>
                <th>Items</th>
                <th>Total Qty</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.filter(o => (o.items?.length || 0) > 0).length > 0 ? (
                orders
                  .filter(o => (o.items?.length || 0) > 0)
                  .map((order) => {
                    const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity_issued || 0), 0)
                    const statusMap = {
                      'ISSUED': 'amber',
                      'RETURNED': 'green',
                      'COMPLETED': 'green',
                      'PARTIALLY_RETURNED': 'blue',
                      'CANCELLED': 'red'
                    }
                    return (
                      <tr key={order.id}>
                        <td><code style={{ fontSize: '0.8rem', opacity: 0.7 }}>#{order.id}</code></td>
                        <td style={{ fontSize: '0.9rem' }}>{formatDate(order.issue_date)}</td>
                        <td style={{ fontWeight: 600 }}>{order.issued_to_name || 'N/A'}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>{order.approved_by_name || '—'}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-soft)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.purpose}>{order.purpose || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {(order.items || []).map(item => (
                              <div key={item.id} className="items-badge">
                                <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>inventory</span>
                                <span style={{ fontSize: '0.78rem' }}>×{item.quantity_issued}{item.quantity_pending > 0 ? <span style={{ color: '#d97706', fontWeight: 700 }}> ({item.quantity_pending} pend)</span> : null}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, textAlign: 'center' }}>{totalQty}</td>
                        <td>
                          <span className={`status-pill ${statusMap[order.status] || 'blue'}`}>
                            {(order.status || '').replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="print-issue-btn"
                            onClick={() => handlePrintIssue(order)}
                            title={`Download issue report for Order #${order.id}`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>picture_as_pdf</span>
                            <span>Print Issue</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
              ) : (
                <tr>
                  <td colSpan="9" className="empty-table-msg">
                    {loadingOrders ? 'Loading issues...' : 'No recorded issues yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="inv-view-card">
        <div className="inv-view-header">
          <span className="icon-tone blue material-symbols-outlined" style={{ height: 38, width: 38, fontSize: '1.15rem' }}>store</span>
          <div>
            <h3 className="inv-view-title">View Store Inventory</h3>
            <p className="inv-view-sub">Check product-wise available counts per store</p>
          </div>
        </div>

        <div className="inv-view-select-row">
          <span className="material-symbols-outlined" style={{ color: 'var(--brand)', fontSize: '1.2rem' }}>location_on</span>
          <select
            id="store-view-select"
            value={selectedStore}
            onChange={(e) => handleStoreChange(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.95rem', color: 'var(--text)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">Choose a store to view inventory…</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>

        {selectedStore ? (
          <div className="inv-view-table-wrap">
            <p className="inv-view-store-title">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '0.4rem' }}>inventory_2</span>
              Current Stock — {selectedStoreRecord?.name}
            </p>
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th style={{ textAlign: 'right' }}>Available Qty</th>
                </tr>
              </thead>
              <tbody>
                {allProducts
                  .filter(p => getStoreProductQty(p.id) > 0)
                  .map((product) => (
                    <tr key={`view-${product.id}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--brand)', opacity: 0.7 }}>deployed_code</span>
                          {product.name}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="inv-qty-badge">{getStoreProductQty(product.id)}</span>
                      </td>
                    </tr>
                  ))}
                {allProducts.filter(p => getStoreProductQty(p.id) > 0).length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-soft)' }}>
                      <span className="material-symbols-outlined" style={{ display: 'block', fontSize: '2rem', opacity: 0.3, marginBottom: '0.4rem' }}>inventory_2</span>
                      No items currently in stock at this store.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-inventory-view">
            <span className="material-symbols-outlined">store</span>
            <p>Select a store above to see product-wise available counts</p>
          </div>
        )}
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

const styles = `
  /* Refined Issue/Return UI Styles */

  .history-section {
    animation: fadeIn 0.4s ease-out;
    padding: 0 0.5rem;
  }

  .items-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #f1f5f9;
    color: #475569;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .status-pill {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    display: inline-block;
  }

  .status-pill.amber { background: #fffbeb; color: #92400e; }
  .status-pill.green { background: #f0fdf4; color: #166534; }
  .status-pill.blue { background: #eff6ff; color: #1e40af; }

  .print-issue-btn {
    border: 1px solid #d8e1f5;
    background: #f8fbff;
    color: #1d4ed8;
    border-radius: 8px;
    padding: 0.38rem 0.6rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .print-issue-btn:hover {
    background: #eaf2ff;
    border-color: #bdd2ff;
  }

  .empty-table-msg {
    text-align: center;
    padding: 3rem !important;
    color: var(--text-muted);
    font-style: italic;
  }
  
  .issue-modal-large {
    max-width: 860px;
    width: 95%;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 24px 64px rgba(29, 43, 69, 0.15);
    display: flex;
    flex-direction: column;
    max-height: 92vh;
  }

  .modal-head {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    align-items: start;
    position: relative;
  }

  .close-btn-x {
    background: #f1f4f9;
    color: #576985;
    border: none;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn-x:hover {
    background: #e5e9f0;
    color: var(--danger);
  }

  .section-title-bar {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 1.25rem;
  }

  .title-marker {
    width: 4px;
    height: 18px;
    background: var(--brand);
    border-radius: 2px;
  }

  .modal-body {
    padding: 1.5rem 2rem;
    overflow-y: auto;
    flex: 1;
    background: #fff;
  }

  .form-section {
    margin-bottom: 2.5rem;
  }


  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.6rem;
    font-size: 0.85rem;
    color: var(--text-soft);
    font-weight: 700;
  }

  .search-wrap, .select-wrap, .mini-select-wrap {
    background: #fff;
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    display: flex;
    align-items: center;
    padding: 0 1rem;
    transition: all 0.2s;
  }

  .search-wrap:focus-within, .select-wrap:focus-within {
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(58, 111, 247, 0.08);
  }

  .search-wrap input, .select-wrap select {
    border: none !important;
    background: transparent !important;
    padding: 0.85rem 0;
    flex: 1;
    outline: none;
    font-size: 0.95rem;
    color: var(--text);
  }

  .select-wrap select {
    appearance: none;
    cursor: pointer;
    width: 100%;
  }

  .user-status-light {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.9rem 1.25rem;
    background: #f0faf4;
    border: 1px solid #d4ede0;
    border-radius: 12px;
    margin-top: 1.25rem;
    color: var(--success);
    font-size: 0.92rem;
    font-weight: 600;
  }

  /* Stock List Styles */
  .stock-list-section {
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
    background: #fff;
    margin-top: 0.5rem;
  }

  .stock-scroll-area {
    max-height: 240px;
    overflow-y: auto;
  }

  .stock-table-compact {
    width: 100%;
    border-collapse: collapse;
  }

  .stock-table-compact th {
    background: var(--surface-soft);
    text-align: left;
    padding: 0.85rem 1rem;
    font-size: 0.75rem;
    color: var(--text-soft);
    position: sticky;
    top: 0;
    z-index: 5;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--line);
  }

  .stock-table-compact td {
    padding: 0.9rem 1rem;
    border-bottom: 1px solid #f3f7ff;
    font-size: 0.92rem;
  }

  .stock-table-compact tr.row-added {
    background: #f8fbff;
    opacity: 0.8;
  }

  .action-icon-btn {
    background: #eef3ff;
    color: var(--brand);
    border: none;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .action-icon-btn:hover:not(:disabled) {
    background: var(--brand);
    color: #fff;
    transform: scale(1.1);
  }

  .action-icon-btn.added {
    background: #eaf9ef;
    color: var(--success);
    cursor: default;
  }

  /* Cart Container */
  .cart-container {
    margin-top: 1.5rem;
    background: #fcfdff;
    border: 1.5px solid var(--brand);
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 8px 24px rgba(58, 111, 247, 0.05);
  }

  .cart-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 1.25rem;
  }

  .cart-icon {
    color: var(--brand);
    font-variation-settings: 'FILL' 1;
  }

  .cart-header h5 {
    flex: 1;
    margin: 0;
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--text);
  }

  .cart-item-card {
    background: #fff;
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    padding: 1rem;
    margin-bottom: 1rem;
    transition: all 0.22s;
  }

  .cart-item-card:hover {
    border-color: var(--brand);
    box-shadow: 0 4px 12px rgba(58, 111, 247, 0.08);
  }

  .cart-item-main {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .cart-qty-wrap {
     margin-left: auto;
     display: flex;
     align-items: center;
     gap: 1.5rem;
  }

  .qty-stepper {
    display: flex;
    background: var(--surface-soft);
    border-radius: 10px;
    padding: 0.3rem;
    border: 1px solid var(--line);
    align-items: center;
  }

  .stepper-btn {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 8px;
    color: var(--brand);
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .stepper-btn:hover {
    background: var(--brand);
    color: #fff;
  }

  .stepper-btn span {
    font-size: 1.2rem;
  }

  .stepper-field {
    width: 45px;
    border: none !important;
    background: transparent !important;
    text-align: center;
    font-weight: 800;
    color: var(--text);
    font-size: 1rem;
    padding: 0 !important;
  }

  .return-controls-wrap {
    display: flex;
    gap: 0.8rem;
  }

  .mini-qty-input {
     width: 70px;
     padding: 0.6rem !important;
     border: 1px solid var(--line-strong);
     border-radius: 10px;
  }

  .mini-select-wrap {
     background: #fff;
     border: 1px solid var(--line-strong);
     border-radius: 10px;
     padding: 0 0.5rem;
  }

  .mini-select-wrap select {
     border: none !important;
     padding: 0.6rem 0;
     font-size: 0.85rem;
     font-weight: 600;
  }

  .item-name {
    font-weight: 700;
    color: var(--text);
    margin: 0 0 0.2rem;
    font-size: 0.95rem;
  }

  .item-stock-ref {
    font-size: 0.75rem;
    color: var(--text-soft);
  }

  .item-stock-ref strong {
    color: var(--brand);
  }

  .icon-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .icon-btn:hover {
    background: #f1f4f9;
  }

  .danger-text {
    color: var(--danger);
  }

  .form-textarea {
    width: 100%;
    border: 1px solid var(--line-strong);
    border-radius: 14px;
    padding: 1.15rem;
    font-family: inherit;
    font-size: 0.95rem;
    min-height: 100px;
  }

  .form-textarea:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(58, 111, 247, 0.08);
  }

  .modal-foot {
    padding: 1.25rem 2rem;
    background: var(--surface-soft);
    border-top: 1px solid var(--line);
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    border-radius: 0 0 18px 18px;
  }

  /* Page UI Style Fixes */
  .issue-page-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid var(--line);
    box-shadow: var(--shadow);
    overflow: hidden;
  }

  .issue-page-body {
    padding: 2rem;
  }


  .stock-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1.5rem;
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
  }

  .stock-table th {
    background: var(--surface-soft);
    padding: 1rem;
    text-align: left;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid var(--line);
  }

  .stock-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--line);
    font-size: 0.95rem;
  }

  /* ── Inventory View Card ────────────────────────────── */
  .inv-view-card {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 16px;
    box-shadow: 0 8px 28px rgba(48,79,140,0.07);
    overflow: hidden;
    margin-top: 1.5rem;
  }

  .inv-view-header {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1.2rem 1.5rem;
    border-bottom: 1px solid var(--line);
    background: #f8fbff;
  }

  .inv-view-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
  }

  .inv-view-sub {
    margin: 0.15rem 0 0;
    font-size: 0.8rem;
    color: var(--text-soft);
  }

  .inv-view-select-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1.5rem;
    border-bottom: 1px solid var(--line);
    background: #fff;
    transition: background 0.15s;
  }

  .inv-view-select-row:focus-within {
    background: #f4f8ff;
  }

  .inv-view-table-wrap {
    padding: 1.25rem 1.5rem 1.5rem;
  }

  .inv-view-store-title {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-soft);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 0 0 0.85rem;
  }

  .inv-qty-badge {
    background: var(--brand-soft);
    color: var(--brand);
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    display: inline-block;
  }

  .empty-inventory-view {
    text-align: center;
    padding: 3rem 2rem;
    color: var(--text-soft);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
  }

  .empty-inventory-view span {
    font-size: 2.5rem;
    opacity: 0.3;
  }

  .empty-inventory-view p {
    margin: 0;
    font-size: 0.9rem;
  }

  /* Success Toast */
  .entry-confirmation-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #10b981;
    color: #fff;
    padding: 1rem 1.5rem;
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 12px 32px rgba(16, 185, 129, 0.3);
    z-index: 1000;
    animation: slideInUp 0.3s ease-out;
  }

  @keyframes slideInUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .toast-content strong {
    display: block;
    font-size: 1rem;
  }

  .toast-content p {
    margin: 0.2rem 0 0;
    font-size: 0.82rem;
    opacity: 0.9;
  }

  @media (max-width: 600px) {
     .form-row { grid-template-columns: 1fr; }
     .cart-item-main { flex-direction: column; align-items: stretch; gap: 1rem; }
     .cart-qty-wrap { margin: 0; }
     .steps { display: none; }
     .modal-head, .modal-body, .modal-foot { padding: 1.25rem; }
  }
`
export default IssueReturnPage
