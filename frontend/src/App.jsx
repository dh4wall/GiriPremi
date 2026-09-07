import { useState, useEffect, useCallback } from 'react'
import DashboardPage from './pages/DashboardPage'
import Home from './pages/Home'
import InspectionsPage from './pages/InspectionsPage'
import InventoryPage from './pages/InventoryPage'
import IssueReturnPage from './pages/IssueReturnPage'
import LoginPage from './pages/LoginPage'
import MembersPage from './pages/MembersPage'
import ReportsPage from './pages/ReportsPage'
import CategoriesModal from './pages/CategoriesModal'
import EquipmentModal from './pages/EquipmentModal'
import { fetchEquipment, createEquipment, deleteEquipment, uploadEquipmentExcel } from './api/equipmentApi'
import { fetchCategories, createCategory, uploadCategoriesExcel, deleteCategory } from './api/categoriesApi'
import { fetchUsers } from './api/usersApi'
import { createOrder } from './api/ordersApi'
import { fetchStores, createStore, deleteStore } from './api/storesApi'
import { fetchInventory } from './api/inventoryApi'
import StoresModal from './pages/StoresModal'
import ReturnPage from './pages/ReturnPage'

// ─── Static/mock data (pages not yet wired to backend) ───────────────────────

// removed static members

const inspections = [
  { item: 'Dynamic Rope Lot A', priority: 'High', category: 'Ropes', due: 'Due today at 6:00 PM', statusTone: 'red' },
  { item: 'Helmet Batch C', priority: 'Medium', category: 'Helmets', due: 'Due tomorrow at 10:00 AM', statusTone: 'amber' },
  { item: 'Harness Set 12', priority: 'Low', category: 'Harness', due: 'Due on 18 Mar 2026', statusTone: 'green' },
]

const reports = [
  { title: 'Monthly Inventory Health', period: 'Mar 2026', generated: '14 Mar 2026, 11:00 AM' },
  { title: 'Issue And Return Summary', period: 'Week 11', generated: '14 Mar 2026, 10:40 AM' },
  { title: 'Inspection Compliance', period: 'Q1 2026', generated: '13 Mar 2026, 05:15 PM' },
]

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: 'space_dashboard' },
  { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
  { id: 'issue-return', label: 'Issue Equipment', icon: 'outbound' },
  { id: 'return', label: 'Return Equipment', icon: 'assignment_return' },
  { id: 'members', label: 'Members', icon: 'group' },
  { id: 'inspections', label: 'Inspections', icon: 'rule' },
  { id: 'reports', label: 'Reports', icon: 'bar_chart' },
]

// ─── Store name → id mapping (matches seeded stores) ─────────────────────────
const STORE_MAP = { 'Store 1': 1, 'Store 2': 2, 'Base Camp Warehouse': 3 }

function formatDate(isoStr) {
  if (!isoStr) return '-'
  const parts = isoStr.split('T')[0].split('-')
  if (parts.length !== 3) return isoStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function parseInputDate(d) {
  if (!d) return null
  const clean = d.trim().replace(/[\/\s.]/g, '-')
  const parts = clean.split('-')
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    }
  }
  return null
}

// ─── Transform backend equipment → shape the table expects ───────────────────
function toTableItem(equipment, categories, storeName = 'Total/Mixed', qty = null) {
  const cat = categories.find((c) => c.id === equipment.category_id)
  return {
    id: equipment.id,
    name: equipment.equipment_name,
    category: cat ? cat.name : `Category ${equipment.category_id}`,
    inspected: formatDate(equipment.purchase_date),
    status: equipment.is_available !== false ? 'Available' : 'Issued',
    statusTone: equipment.is_available !== false ? 'green' : 'amber',
    quantity: qty !== null ? qty : (equipment.quantity || 0),
    store_name: storeName,
    icon: 'inventory_2',
  }
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [showLogin, setShowLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [showStoresModal, setShowStoresModal] = useState(false)
  const [userType, setUserType] = useState('storeAdmin')
  const [addEquipmentRequest, setAddEquipmentRequest] = useState(0)
  const [toast, setToast] = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Live data from backend ──────────────────────────────────────────────────
  const [inventoryItems, setInventoryItems] = useState([])
  const [categories, setCategories] = useState([])
  const [stores, setStores] = useState([])
  const [members, setMembers] = useState([])

  const loadStores = useCallback(async () => {
    try {
      const data = await fetchStores()
      setStores(data)
    } catch (err) {
      console.error('Failed to fetch stores:', err)
    }
  }, [])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  const handleAddStore = async (storeData) => {
    const newStore = await createStore(storeData)
    setStores((prev) => [...prev, newStore])
    showToast(`Store "${newStore.name}" added successfully.`)
  }

  const handleDeleteStore = async (storeId) => {
    try {
      await deleteStore(storeId)
      setStores((prev) => prev.filter((s) => s.id !== storeId))
      showToast('Store deleted successfully.')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const isStoreAdmin = userType === 'storeAdmin'
  const isSuperAdmin = userType === 'superAdmin'

  // ── Fetch equipment + categories from API ───────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [equipment, cats, membersData, storesData, inventoryData] = await Promise.all([
        fetchEquipment(),
        fetchCategories(),
        fetchUsers(),
        fetchStores(),
        fetchInventory()
      ])
      setCategories(cats)
      setMembers(membersData)
      setStores(storesData)

      // ✅ Granular mapping: one row per physical stock entry (Equipment + Store)
      const granularItems = []

      // Keep track of which equipment has at least one inventory entry
      const eqWithInventory = new Set()

      inventoryData.forEach(inv => {
        const eq = equipment.find(e => e.id === inv.equipment_id)
        if (!eq) return

        const store = storesData.find(s => s.id === inv.store_id)
        eqWithInventory.add(eq.id)

        granularItems.push({
          ...toTableItem(eq, cats, store ? store.name : 'Unknown', inv.quantity),
          id: inv.id, // Use unique inventory record ID
          condition: inv.curr_condition,
          equipment_id: eq.id // Keep original eq_id for actions
        })
      })

      // Add equipment that has NO inventory entries (e.g. qty 0)
      equipment.forEach(eq => {
        if (!eqWithInventory.has(eq.id)) {
          granularItems.push({
            ...toTableItem(eq, cats, '-', 0),
            condition: 'N/A',
            equipment_id: eq.id
          })
        }
      })

      setInventoryItems(granularItems)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      loadData()
    }
  }, [isLoggedIn, loadData])

  // ── Summary cards (computed from live data) ─────────────────────────────────
  const summaryCards = [
    {
      title: 'Available Gear',
      value: loading ? '…' : String(inventoryItems.filter((i) => i.status === 'Available').length),
      icon: 'inventory_2',
      tone: 'green',
      tag: 'In Stock',
    },
    { title: 'Issued Today', value: '—', icon: 'outbound', tone: 'amber', tag: 'Live' },
    { title: 'Due For Inspection', value: String(inspections.length), icon: 'rule', tone: 'red', tag: 'Action' },
    { title: 'Active Members', value: String(members.length), icon: 'groups', tone: 'blue', tag: 'Updated' },
  ]

  const recentActivity = []

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleLogin(_username, _password, selectedUserType) {
    setUserType(selectedUserType)
    setShowLogin(false)
    setIsLoggedIn(true)
    setActivePage('dashboard')
  }

  async function handleAddEquipment(formData) {
    if (!isSuperAdmin) return
    try {
      const payload = {
        equipment_name: formData.name,
        category_id: categories.find((c) => c.name === formData.category)?.id,
        brand: formData.brand || null,
        description: formData.description || null,
        purchase_date: parseInputDate(formData.purchaseDate),
        date_of_expiry: parseInputDate(formData.expiryDate),
        date_of_manufacturing: parseInputDate(formData.manufactureDate),
        current_store_id: STORE_MAP[formData.store] || 1,
      }
      if (!payload.category_id) {
        showToast('Please select a valid category.', 'error')
        return
      }
      await createEquipment(payload)
      await loadData()           // refresh list from backend
      setShowEquipmentModal(false)
      showToast('Equipment added successfully!', 'success')
      setAddEquipmentRequest(0)
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
  }

  async function handleAddCategory(data) {
    try {
      await createCategory(data)
      await loadData()   // refresh categories list
      setShowCategoriesModal(false)
      showToast('Category added successfully!', 'success')
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
  }

  async function handleImportEquipment(file) {
    try {
      const result = await uploadEquipmentExcel(file)
      showToast(`Imported ${result.created_count} items. ${result.errors?.length ? `${result.errors.length} errors.` : ''}`, result.errors?.length ? 'error' : 'success')
      await loadData()
      setShowEquipmentModal(false)
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error')
    }
  }

  async function handleImportCategories(file) {
    try {
      const result = await uploadCategoriesExcel(file)
      await loadData()
      showToast(`Imported ${result.inserted} categories.`, 'success')
      setShowCategoriesModal(false)
      return result
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error')
      throw err
    }
  }

  async function handleDeleteItem(itemId) {
    if (!isSuperAdmin) return
    try {
      await deleteEquipment(itemId)
      await loadData()           // refresh list from backend
      showToast('Equipment deleted successfully', 'success')
    } catch (err) {
      showToast(`Error deleting: ${err.message}`, 'error')
    }
  }

  async function handleDeleteCategory(categoryId) {
    if (!isSuperAdmin) return
    try {
      if (!window.confirm('Are you sure you want to delete this category? Related equipment might be affected.')) return
      await deleteCategory(categoryId)
      await loadData()
      showToast('Category deleted successfully', 'success')
    } catch (err) {
      showToast(`Error deleting category: ${err.message}`, 'error')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  function renderPage() {
    if (!isLoggedIn) {
      if (showLogin) return <LoginPage onLogin={handleLogin} />
      return <Home onLoginClick={() => setShowLogin(true)} />
    }

    if (loading) {
      return (
        <section className="content-shell">
          <p style={{ padding: '2rem', color: 'var(--text-muted, #888)' }}>Loading data…</p>
        </section>
      )
    }

    if (error) {
      return (
        <section className="content-shell">
          <div className="info-banner" style={{ background: 'var(--red-light, #fee)', color: '#c00' }}>
            ⚠ Could not connect to backend: {error}. Make sure the server is running on port 8000.
          </div>
        </section>
      )
    }

    switch (activePage) {
      case 'inventory':
        return (
          <InventoryPage
            canAddProduct={isSuperAdmin}
            canDeleteProduct={isSuperAdmin}
            categories={categories}
            inventoryItems={inventoryItems}
            isStoreAdmin={isStoreAdmin}
            onDeleteItem={handleDeleteItem}
            onManageEquipment={() => setShowEquipmentModal(true)}
            onManageCategories={() => setShowCategoriesModal(true)}
            onManageStores={() => setShowStoresModal(true)}
            onPageChange={() => { }}
            onUpdateItem={(itemName) => window.alert(`Update flow for ${itemName} can be connected here.`)}
            onRefresh={loadData}
          />
        )
      case 'issue-return':
        return (
          <IssueReturnPage
            members={members}
            onContinue={() => setShowIssueModal(true)}
            readOnly={false}
            userType={userType}
          />
        )
      case 'return':
        return (
          <ReturnPage
            members={members}
            readOnly={isSuperAdmin}
            userType={userType}
            stores={stores}
            showToast={showToast}
          />
        )
      case 'members':
        return <MembersPage members={members} onAddMember={() => window.alert('Add member flow.')} readOnly={isSuperAdmin} />
      case 'inspections':
        return <InspectionsPage inspections={inspections} onNewInspection={() => window.alert('Create inspection flow.')} readOnly={isSuperAdmin} />
      case 'reports':
        return <ReportsPage onExportReport={() => window.alert('Report export triggered.')} readOnly={isSuperAdmin} reports={reports} />
      default:
        return (
          <DashboardPage
            onChangeRange={() => window.alert('Date range selector.')}
            onOpenIssue={() => setShowIssueModal(true)}
            onOpenReports={() => setActivePage('reports')}
            onOpenReturn={() => setActivePage('return')}
            onPageChange={() => { }}
            readOnly={isSuperAdmin}
            recentActivity={recentActivity}
            summaryCards={summaryCards}
          />
        )
    }
  }

  if (!isLoggedIn) return renderPage()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="sidebar-brand" type="button" onClick={() => setActivePage('dashboard')}>
          <div className="sidebar-brand-mark">
            <span className="material-symbols-outlined">terrain</span>
          </div>
          <div>
            <strong>Giripremi Store</strong>
            <small>Store Manager</small>
          </div>
        </button>

        <nav className="sidebar-nav">
          <small>Main Navigation</small>
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              className={`sidebar-link ${activePage === page.id ? 'active' : ''}`}
              onClick={() => setActivePage(page.id)}
            >
              <span className="material-symbols-outlined">{page.icon}</span>
              <span>{page.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-settings" type="button">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </button>

          <div className="sidebar-profile">
            <div className="sidebar-avatar">{isStoreAdmin ? 'SA' : 'SU'}</div>
            <div>
              <strong>{isStoreAdmin ? 'Store Admin' : 'Super Admin'}</strong>
              <small>Logged in</small>
            </div>
            <button
              className="sidebar-logout"
              type="button"
              onClick={() => {
                setIsLoggedIn(false)
                setShowLogin(false)
                setShowIssueModal(false)
                setInventoryItems([])
                setCategories([])
              }}
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="app-frame">
        <main className="app-body">{renderPage()}</main>
      </div>

      {
        showIssueModal ? (
          <IssueReturnPage
            members={members}
            modal
            onClose={() => setShowIssueModal(false)}
            onContinue={() => setShowIssueModal(false)}
            readOnly={false}
            userType={userType}
          />
        ) : null
      }

      {
        showCategoriesModal ? (
          <CategoriesModal
            categories={categories}
            onClose={() => setShowCategoriesModal(false)}
            onAddCategory={handleAddCategory}
            onImportCategories={handleImportCategories}
            onDeleteCategory={handleDeleteCategory}
          />
        ) : null
      }

      {
        showEquipmentModal ? (
          <EquipmentModal
            categories={categories}
            inventoryItems={inventoryItems}
            onClose={() => setShowEquipmentModal(false)}
            onAddEquipment={handleAddEquipment}
            onImportEquipment={handleImportEquipment}
          />
        ) : null
      }

      {
        showStoresModal ? (
          <StoresModal
            stores={stores}
            onClose={() => setShowStoresModal(false)}
            onAddStore={handleAddStore}
            onDeleteStore={handleDeleteStore}
          />
        ) : null
      }

      {/* Global Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'error' ? '#fef2f2' : '#ecfdf5',
          color: toast.type === 'error' ? '#991b1b' : '#065f46',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 500,
          fontSize: '0.9rem',
          animation: 'slideIn 0.3s ease-out forwards'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App