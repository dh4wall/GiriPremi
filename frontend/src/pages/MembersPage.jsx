import { useMemo, useState, useEffect } from 'react'
import { fetchOrders } from '../api/ordersApi'
import { fetchEquipment } from '../api/equipmentApi'
import './MembersPage.css'

function formatDate(isoStr) {
  if (!isoStr) return 'N/A'
  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  try {
    return new Date(isoStr).toLocaleDateString(undefined, dateOptions)
  } catch (e) {
    return isoStr
  }
}

function getStatusColor(status) {
  switch ((status || '').toUpperCase()) {
    case 'COMPLETED': return { bg: '#dcfce7', color: '#166534', dot: '#22c55e' }
    case 'ISSUED': return { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b' }
    case 'PARTIALLY_RETURNED': return { bg: '#eff6ff', color: '#1e40af', dot: '#3b82f6' }
    case 'CANCELLED': return { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' }
    default: return { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' }
  }
}

function MemberHistoryModal({ member, orders, equipmentMap, onClose }) {
  if (!member) return null

  return (
    <div role="presentation" onClick={onClose} className="member-modal-overlay">
      <div className="member-history-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mhm-header">
          <div className="mhm-avatar">{(member.full_name || '?')[0].toUpperCase()}</div>
          <div className="mhm-headerinfo">
            <h3>{member.full_name}</h3>
            <span>{member.email || 'No email'} · {orders.length} order{orders.length !== 1 ? 's' : ''}</span>
          </div>
          <button onClick={onClose} type="button" className="mhm-close-btn">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Timeline Body */}
        <div className="mhm-body">
          {orders.length === 0 ? (
            <div className="mhm-empty">
              <span className="material-symbols-outlined">history</span>
              <p>No order history found for this member.</p>
            </div>
          ) : (
            <div className="git-timeline">
              {orders.map((order, idx) => {
                const sc = getStatusColor(order.status)
                const isLast = idx === orders.length - 1
                return (
                  <div className="git-node-row" key={order.id}>
                    {/* Vertical line + node */}
                    <div className="git-track">
                      <div className="git-node" style={{ background: sc.dot, boxShadow: `0 0 0 3px ${sc.bg}` }} />
                      {!isLast && <div className="git-line" />}
                    </div>

                    {/* Content card */}
                    <div className="git-card">
                      <div className="git-card-head">
                        <div className="git-card-meta">
                          <code className="git-order-id">#{order.id}</code>
                          <span className="git-date">
                            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>calendar_today</span>
                            &nbsp;{formatDate(order.issue_date)}
                          </span>
                          {order.actual_return_date && (
                            <span className="git-date git-date-return">
                              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>assignment_return</span>
                              &nbsp;Returned {formatDate(order.actual_return_date)}
                            </span>
                          )}
                        </div>
                        <span className="git-status-pill" style={{ background: sc.bg, color: sc.color }}>
                          {(order.status || '').replace('_', ' ')}
                        </span>
                      </div>

                      {order.purpose && (
                        <p className="git-purpose">
                          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>description</span>
                          &nbsp;{order.purpose}
                        </p>
                      )}

                      <div className="git-items-grid">
                        {order.items.map(item => {
                          const eqName = equipmentMap[item.equipment_id] || item.equipment_id
                          const pending = item.quantity_pending || 0
                          return (
                            <div key={item.id} className="git-item-chip">
                              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: 'var(--brand)' }}>inventory_2</span>
                              <span className="git-item-name">{eqName}</span>
                              <span className="git-item-qty">
                                ×{item.quantity_issued}
                                {item.quantity_returned > 0 && <span className="git-item-ret"> · ret {item.quantity_returned}</span>}
                                {pending > 0 && <span className="git-item-pend"> · {pending} pending</span>}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MembersPage({ members = [], onAddMember = () => { }, readOnly }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [orders, setOrders] = useState([])
  const [equipmentList, setEquipmentList] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [ordersData, eqData] = await Promise.all([
          fetchOrders().catch(() => []),
          fetchEquipment().catch(() => [])
        ])
        setOrders(ordersData)
        setEquipmentList(eqData)
      } catch (err) {
        console.error("Failed to load extra data for members page", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const equipmentMap = useMemo(() => {
    const map = {}
    equipmentList.forEach(eq => { map[eq.id] = eq.equipment_name })
    return map
  }, [equipmentList])

  const membersWithContext = useMemo(() => {
    return members.map(member => {
      const memberOrders = orders.filter(o => o.user_id === member.id)
      const issuedCount = memberOrders.length

      const activeItemsList = []
      memberOrders.filter(o => o.status !== 'Returned').forEach(o => {
        o.items.forEach(item => {
          if (item.quantity_pending > 0) {
            activeItemsList.push(equipmentMap[item.equipment_id] || item.equipment_id)
          }
        })
      })

      const pendingCount = activeItemsList.length

      return {
        ...member,
        joinedOn: formatDate(member.created_at),
        issuedCount,
        activeItems: activeItemsList,
        pendingCount,
        status: member.is_active ? 'Active' : 'Inactive',
        statusTone: member.is_active ? 'green' : 'red'
      }
    })
  }, [members, orders, equipmentMap])

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return membersWithContext
    return membersWithContext.filter((member) =>
      (member.full_name || '').toLowerCase().includes(query) ||
      (member.email || '').toLowerCase().includes(query)
    )
  }, [membersWithContext, searchQuery])

  const selectedMemberOrders = useMemo(() => {
    if (!selectedMember) return []
    return orders.filter(o => o.user_id === selectedMember.id).sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date))
  }, [orders, selectedMember])

  return (
    <section className="content-shell">
      <div className="section-head compact">
        <div>
          <h2>Members</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-soft)' }}>{filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="member-head-actions">
          <div className="search-wrap member-search-wrap">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or email..."
              aria-label="Search members"
            />
          </div>
          {!readOnly && (
            <button className="primary-btn" onClick={onAddMember} type="button">
              <span className="material-symbols-outlined">person_add</span>
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      <div className="table-shell">
        {isLoading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Loading member data...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Contact</th>
                <th>ID Proof</th>
                <th>Active Issues</th>
                <th>Total Orders</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>History</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="member-name-cell">
                      <div className="member-avatar-inline">{(member.full_name || '?')[0].toUpperCase()}</div>
                      <div>
                        <strong>{member.full_name}</strong>
                        <small>Joined {member.joinedOn} · #{member.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="member-contact-cell">
                      <span>{member.email || 'No email'}</span>
                      {member.phone && <small>{member.phone}</small>}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>
                    {member.id_proof_type ? `${member.id_proof_type}: ${member.id_proof_number || ''}` : member.id_proof_number || 'No ID'}
                  </td>
                  <td>
                    <div className="member-options-cell" style={{ maxWidth: '200px' }}>
                      {member.activeItems.length > 0 ? (
                        <>
                          {member.activeItems.slice(0, 2).map((item, idx) => (
                            <span className="member-option-chip" key={idx}>{item}</span>
                          ))}
                          {member.activeItems.length > 2 && (
                            <span className="member-option-chip" style={{ background: '#f1f5f9', color: '#64748b' }}>+{member.activeItems.length - 2} more</span>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>No active issue</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{member.issuedCount}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>orders</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-tag ${member.statusTone}`}>{member.status}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="action-icon-btn"
                      title="View History"
                      onClick={() => setSelectedMember(member)}
                      disabled={member.issuedCount === 0}
                      style={{ opacity: member.issuedCount === 0 ? 0.4 : 1 }}
                    >
                      <span className="material-symbols-outlined">history</span>
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredMembers.length ? (
                <tr>
                  <td colSpan={7} className="inventory-empty">No members found matching your search.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>

      <MemberHistoryModal
        member={selectedMember}
        orders={selectedMemberOrders}
        equipmentMap={equipmentMap}
        onClose={() => setSelectedMember(null)}
      />
    </section>
  )
}

export default MembersPage
