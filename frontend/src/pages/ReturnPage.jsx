import React, { useState, useEffect, useCallback } from 'react'
import { fetchOrders, returnItems } from '../api/ordersApi'
import { fetchEquipment } from '../api/equipmentApi'

function ReturnPage({ members, userType, readOnly, stores, showToast }) {
    const [orders, setOrders] = useState([])
    const [equipmentList, setEquipmentList] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [returnDetails, setReturnDetails] = useState({}) // item_id -> { qty, condition }

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [orderData, eqData] = await Promise.all([
                fetchOrders(),
                fetchEquipment()
            ])
            // Filter only orders that are NOT completed or cancelled
            const activeOrders = orderData.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'RETURNED')
            setOrders(activeOrders.sort((a, b) => b.id - a.id))
            setEquipmentList(eqData)
        } catch (err) {
            showToast('Failed to load data: ' + err.message, 'error')
        } finally {
            setLoading(false)
        }
    }, [showToast])

    useEffect(() => {
        loadData()
    }, [loadData])

    const getEquipmentName = (id) => {
        const eq = equipmentList.find(e => e.id === id)
        return eq ? eq.equipment_name : id
    }

    const formatDate = (isoStr) => {
        if (!isoStr) return '-'
        const parts = isoStr.split('T')[0].split('-')
        if (parts.length !== 3) return isoStr
        return `${parts[2]}/${parts[1]}/${parts[0]}`
    }

    const handleOpenReturnModal = (order) => {
        setSelectedOrder(order)
        const initialReturn = {}
        order.items.forEach(item => {
            initialReturn[item.id] = {
                qty: item.quantity_pending,
                condition: 'NEW'
            }
        })
        setReturnDetails(initialReturn)
    }

    const handleQtyChange = (itemId, newQty, max) => {
        setReturnDetails(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], qty: Math.max(0, Math.min(newQty, max)) }
        }))
    }

    const handleConditionChange = (itemId, newCondition) => {
        setReturnDetails(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], condition: newCondition }
        }))
    }

    const handleSubmitReturn = async () => {
        try {
            const payload = {
                order_id: selectedOrder.id,
                actual_return_date: new Date().toISOString().split('T')[0],
                items: Object.entries(returnDetails)
                    .filter(([_, details]) => details.qty > 0)
                    .map(([itemId, details]) => ({
                        order_item_id: parseInt(itemId),
                        quantity_returned: details.qty,
                        quantity_lost: 0,
                        return_condition: details.condition
                    }))
            }

            if (payload.items.length === 0) {
                showToast('Please select items to return', 'error')
                return
            }

            await returnItems(payload)
            showToast('Items returned successfully!', 'success')
            setSelectedOrder(null)
            loadData()
        } catch (err) {
            showToast('Error returning items: ' + err.message, 'error')
        }
    }

    return (
        <section className="content-shell">
            <div className="section-head compact">
                <h2>Return Equipment</h2>
            </div>

            <div className="table-shell" style={{ marginTop: '1rem' }}>
                <table className="stock-table">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Issued To</th>
                            <th>Issued By</th>
                            <th>Date Issued</th>
                            <th>Items</th>
                            <th>Qty Pending</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" className="empty-table-msg">Loading orders...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan="8" className="empty-table-msg">No active issues found.</td></tr>
                        ) : (
                            orders.map(order => {
                                const totalPending = (order.items || []).reduce((s, i) => s + (i.quantity_pending || 0), 0)
                                const statusColor = order.status === 'ISSUED' ? 'amber' : 'blue'
                                return (
                                    <tr key={order.id}>
                                        <td><code style={{ opacity: 0.7 }}>#{order.id}</code></td>
                                        <td style={{ fontWeight: 600 }}>{order.issued_to_name || 'N/A'}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>{order.approved_by_name || '—'}</td>
                                        <td style={{ fontSize: '0.9rem' }}>{formatDate(order.issue_date)}</td>
                                        <td>
                                            <div className="item-summary-list">
                                                {order.items.map(item => (
                                                    <div key={item.id} className={`item-summary-chip ${item.quantity_pending === 0 ? 'completed' : ''}`}>
                                                        {getEquipmentName(item.equipment_id)}&nbsp;<strong>({item.quantity_pending} pend / {item.quantity_issued} total)</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 800,
                                                fontSize: '1rem',
                                                color: totalPending > 0 ? '#d97706' : '#059669'
                                            }}>{totalPending}</span>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${statusColor}`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                className="action-icon-btn"
                                                onClick={() => handleOpenReturnModal(order)}
                                                title="Return Items"
                                            >
                                                <span className="material-symbols-outlined">assignment_return</span>
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Return Modal */}
            {selectedOrder && (
                <div className="modal-backdrop">
                    <div className="issue-modal issue-modal-medium">
                        <div className="modal-head">
                            <div>
                                <h3>Handle Return: #{selectedOrder.id}</h3>
                                <p>Returning items from <strong>{selectedOrder.issued_to_name}</strong></p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} type="button" className="close-btn-x">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="return-items-grid">
                                {selectedOrder.items.map(item => {
                                    const details = returnDetails[item.id] || { qty: 0 }
                                    return (
                                        <div key={item.id} className={`return-item-card ${item.quantity_pending === 0 ? 'inactive' : ''}`}>
                                            <div className="return-item-info">
                                                <strong>{getEquipmentName(item.equipment_id)}</strong>
                                                <small>Total Pending: {item.quantity_pending}</small>
                                            </div>

                                            <div className="return-item-controls" style={{ display: 'flex', alignItems: 'center' }}>
                                                <div className="qty-stepper compact">
                                                    <button
                                                        type="button"
                                                        disabled={item.quantity_pending === 0}
                                                        onClick={() => handleQtyChange(item.id, details.qty - 1, item.quantity_pending)}
                                                        className="stepper-btn"
                                                    >
                                                        <span className="material-symbols-outlined">remove</span>
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={details.qty}
                                                        readOnly
                                                        className="stepper-field"
                                                    />
                                                    <button
                                                        type="button"
                                                        disabled={item.quantity_pending === 0}
                                                        onClick={() => handleQtyChange(item.id, details.qty + 1, item.quantity_pending)}
                                                        className="stepper-btn"
                                                    >
                                                        <span className="material-symbols-outlined">add</span>
                                                    </button>
                                                </div>
                                                <div className="mini-select-wrap" style={{ marginLeft: '12px' }}>
                                                    <select value={details.condition || 'NEW'} onChange={(e) => handleConditionChange(item.id, e.target.value)} disabled={item.quantity_pending === 0}>
                                                        <option value="NEW">New</option>
                                                        <option value="MODERATE">Moderate</option>
                                                        <option value="NEEDS_REPAIR">Needs Repair</option>
                                                        <option value="DISCARD">Discard</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                        </div>

                        <div className="modal-foot">
                            <button className="secondary-btn" onClick={() => setSelectedOrder(null)}>Cancel</button>
                            <button
                                className="primary-btn"
                                onClick={handleSubmitReturn}
                                disabled={Object.values(returnDetails).every(d => d.qty === 0)}
                            >
                                Finalize Return
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .item-summary-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .item-summary-chip {
          font-size: 0.75rem; background: #f1f5f9; padding: 2px 8px;
          border-radius: 4px; color: #475569; border: 1px solid var(--line);
        }
        .item-summary-chip.completed { opacity: 0.5; text-decoration: line-through; background: #f8fafc; }

        .modal-backdrop {
          position: fixed !important;
          inset: 0 !important;
          background: transparent !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 9999 !important;
          padding: 2rem !important;
        }
        .issue-modal-medium {
          background: #fff !important;
          border-radius: 20px !important;
          width: 100% !important;
          max-width: 600px !important;
          display: flex !important;
          flex-direction: column !important;
          max-height: 85vh !important;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25) !important;
          overflow: hidden !important;
          border: 1px solid var(--line) !important;
          margin: auto !important;
        }
        .modal-head { 
          padding: 1.5rem 2rem !important; 
          border-bottom: 1px solid var(--line) !important; 
          display: flex !important; 
          justify-content: space-between !important; 
          align-items: flex-start !important;
          background: #fff !important;
        }
        .modal-head h3 { margin: 0 !important; font-size: 1.25rem !important; font-weight: 800 !important; color: var(--text) !important; }
        .modal-head p { margin: 0.3rem 0 0 !important; font-size: 0.9rem !important; color: var(--text-soft) !important; }
        
        .modal-body { 
          padding: 2rem !important; 
          overflow-y: auto !important; 
          flex: 1 !important;
          background: #fff !important;
        }
        
        .modal-foot { 
          padding: 1.25rem 2rem !important; 
          border-top: 1px solid var(--line) !important; 
          background: #f8fbff !important; 
          display: flex !important; 
          justify-content: flex-end !important; 
          gap: 1rem !important; 
        }

        .return-items-grid { display: flex !important; flex-direction: column !important; gap: 12px !important; }
        .return-item-card {
          display: flex !important; 
          justify-content: space-between !important; 
          align-items: center !important;
          padding: 1.1rem 1.4rem !important; 
          background: #fff !important; 
          border: 1px solid var(--line) !important;
          border-radius: 16px !important; 
          transition: all 0.2s !important;
        }
        .return-item-card:hover { border-color: var(--brand) !important; box-shadow: 0 4px 12px rgba(58, 111, 247, 0.08) !important; }
        .return-item-card.inactive { opacity: 0.5 !important; background: #f8fafc !important; border-style: dashed !important; }
        
        .return-item-info { display: flex !important; flex-direction: column !important; gap: 3px !important; }
        .return-item-info strong { font-size: 1rem !important; color: var(--text) !important; font-weight: 700 !important; }
        .return-item-info small { color: var(--text-soft) !important; font-size: 0.82rem !important; font-weight: 600 !important; }

        .qty-stepper { 
          display: flex !important; 
          align-items: center !important; 
          background: #f3f6fa !important; 
          border-radius: 12px !important; 
          padding: 4px !important; 
          border: 1px solid var(--line-strong) !important; 
        }
        .stepper-btn {
          width: 32px !important; 
          height: 32px !important; 
          background: #fff !important; 
          border: 1px solid var(--line-strong) !important;
          border-radius: 10px !important; 
          color: var(--brand) !important; 
          display: flex !important; 
          align-items: center !important; 
          justify-content: center !important; 
          cursor: pointer !important;
          transition: all 0.2s !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
        }
        .stepper-btn:hover:not(:disabled) { background: var(--brand) !important; color: #fff !important; border-color: var(--brand) !important; }
        .stepper-btn:disabled { opacity: 0.4 !important; cursor: not-allowed !important; }
        
        .stepper-field {
          width: 50px !important; 
          border: none !important; 
          background: transparent !important;
          text-align: center !important; 
          font-weight: 800 !important; 
          color: var(--text) !important; 
          font-size: 1.1rem !important; 
          outline: none !important;
          padding: 0 !important;
          margin: 0 !important;
          appearance: textfield !important;
          -moz-appearance: textfield !important;
        }
        .stepper-field::-webkit-outer-spin-button,
        .stepper-field::-webkit-inner-spin-button {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }
      `}</style>
        </section>
    )
}

export default ReturnPage
