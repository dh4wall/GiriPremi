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
import { getToken, clearToken, getMe } from './api/authApi'
import StoresModal from './pages/StoresModal'
import ReturnPage from './pages/ReturnPage'
import { fetchDashboardTelemetry } from './api/dashboardApi'

// ─── Static/mock data (pages not yet wired to backend) ───────────────────────

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

const ROLE_CONFIG = {
  superAdmin: { label: 'Super Admin', initials: 'SU', color: '#8a4fff', bg: '#f2ebff', badge: 'violet' },
  storeAdmin: { label: 'Store Admin', initials: 'SA', color: '#3a6ff7', bg: '#edf3ff', badge: 'blue' },
}

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'inventory', label: 'Inventory', icon: 'backpack' },
  { id: 'issue-return', label: 'Issue Equipment', icon: 'outbox' },
  { id: 'return', label: 'Return Equipment', icon: 'move_to_inbox' },
  { id: 'members', label: 'Members', icon: 'group' },
  { id: 'inspections', label: 'Inspections', icon: 'verified' },
  { id: 'reports', label: 'Reports', icon: 'analytics' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

const ROLE_PAGE_ACCESS = {
  superAdmin: pages.map((page) => page.id),
  storeAdmin: ['dashboard', 'inventory', 'issue-return', 'return', 'members', 'inspections', 'reports', 'settings'],
}

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
  const pageForPath = (path) => {
    const page = path.replace(/^\/+/, '').split('/')[0]
    return pages.some((candidate) => candidate.id === page) ? page : 'dashboard'
  }
  const [activePage, setActivePage] = useState(() => pageForPath(window.location.pathname))
  const [showLogin, setShowLogin] = useState(() => window.location.pathname === '/login')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [showStoresModal, setShowStoresModal] = useState(false)
  const [userType, setUserType] = useState('storeAdmin')
  const [fullName, setFullName] = useState('')
  const [addEquipmentRequest, setAddEquipmentRequest] = useState(0)
  const [toast, setToast] = useState(null)

  const navigate = useCallback((path) => {
    window.history.pushState({}, '', path)
    setShowLogin(path === '/login')
    setActivePage(pageForPath(path))
  }, [])

  useEffect(() => {
    const handleNavigation = () => {
      setShowLogin(window.location.pathname === '/login')
      setActivePage(pageForPath(window.location.pathname))
    }
    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [])

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Live data from backend ──────────────────────────────────────────────────
  const [inventoryItems, setInventoryItems] = useState([])
  const [categories, setCategories] = useState([])
  const [stores, setStores] = useState([])
  const [members, setMembers] = useState([])
  const [landingStats, setLandingStats] = useState(null)
  const [landingStatsError, setLandingStatsError] = useState('')
  const [dashboardTelemetry, setDashboardTelemetry] = useState(null)

  // ── On mount: restore session from localStorage ───────────────────────────
  useEffect(() => {
    const token = getToken()
    if (token) {
      getMe()
        .then((me) => {
          setUserType(me.user_type)
          setFullName(me.full_name)
          setIsLoggedIn(true)
        })
        .catch(() => {
          clearToken()
        })
    }
  }, [])

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

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchEquipment(), fetchCategories(), fetchInventory(), fetchStores()])
      .then(([equipment, cats, inventory, storeList]) => {
        if (cancelled) return
        setLandingStats({
          equipment: equipment.length,
          categories: cats.length,
          inventoryUnits: inventory.reduce((total, item) => total + (item.quantity || 0), 0),
          stores: storeList.length,
        })
      })
      .catch((err) => {
        if (!cancelled) setLandingStatsError(err.message || 'Unable to load platform statistics.')
      })

    return () => {
      cancelled = true
    }
  }, [])

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
  const allowedPages = ROLE_PAGE_ACCESS[userType] || ROLE_PAGE_ACCESS.storeAdmin

  // ── Fetch equipment + categories from API ───────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [equipment, cats, membersData, storesData, inventoryData, telemetry] = await Promise.all([
        fetchEquipment(),
        fetchCategories(),
        fetchUsers(),
        fetchStores(),
        fetchInventory(),
        fetchDashboardTelemetry()
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
      setDashboardTelemetry(telemetry)
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
  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleLogin(name, type, tokenData) {
    setUserType(type || tokenData?.user_type || 'storeAdmin')
    setFullName(name || tokenData?.full_name || '')
    navigate('/dashboard')
    setIsLoggedIn(true)
  }

  function handleLogout() {
    clearToken()
    setIsLoggedIn(false)
    navigate('/')
    setShowIssueModal(false)
    setInventoryItems([])
    setCategories([])
    setFullName('')
    setUserType('storeAdmin')
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
      return (
        <Home
          landingStats={landingStats}
          landingStatsError={landingStatsError}
          onLoginClick={() => navigate('/login')}
          onHomeClick={() => navigate('/')}
        />
      )
    }

    const pageToRender = allowedPages.includes(activePage) ? activePage : 'dashboard'

    switch (pageToRender) {
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
            readOnly={false}
            userType={userType}
            stores={stores}
            showToast={showToast}
          />
        )
      case 'members':
        return <MembersPage members={members} onAddMember={() => window.alert('Add member flow.')} readOnly={isStoreAdmin} />
      case 'inspections':
        return <InspectionsPage inspections={inspections} onNewInspection={() => window.alert('Create inspection flow.')} readOnly={false} />
      case 'reports':
        return <ReportsPage onExportReport={() => window.alert('Report export triggered.')} readOnly={false} reports={reports} />
      default:
        return (
          <DashboardPage
            onChangeRange={() => window.alert('Date range selector.')}
            onOpenIssue={() => setShowIssueModal(true)}
            onOpenReports={() => navigate('/reports')}
            onOpenReturn={() => navigate('/return')}
            onPageChange={() => { }}
            onRefresh={loadData}
            telemetry={dashboardTelemetry}
            loading={loading}
          />
        )
    }
  }

  const roleInfo = ROLE_CONFIG[userType] || ROLE_CONFIG.storeAdmin

  if (!isLoggedIn) return renderPage()

  return (
    <div className="app-shell min-h-screen bg-surface">
      <aside className="sidebar fixed left-0 top-0 h-full w-72 bg-surface-container-low/90 backdrop-blur-xl z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(13,37,56,0.04)]">
        <div className="flex flex-col sidebar-top">
          <div
            className="sidebar-brand h-20 px-space-lg flex items-center gap-space-md cursor-pointer select-none"
            onClick={() => navigate('/dashboard')}
          >
            <div className="sidebar-brand-mark w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[22px]">terrain</span>
            </div>
            <div className="flex flex-col sidebar-brand-text">
              <span className="sidebar-brand-title font-headline-sm text-headline-sm tracking-tight text-primary leading-tight">Giripremi Store</span>
              <span className="sidebar-brand-subtitle font-label-md text-label-md uppercase tracking-wider text-secondary">IMS Portal</span>
            </div>
          </div>

          <div className="sidebar-nav-wrap px-space-md py-space-sm">
            <nav className="sidebar-nav flex flex-col gap-space-xs" data-active-classes="bg-primary-container text-on-primary font-medium rounded-xl shadow-sm">
              {pages.filter((page) => allowedPages.includes(page.id)).map((page) => {
                const isActive = activePage === page.id
                return (
                  <button
                    key={page.id}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    className={`sidebar-link flex items-center gap-space-md px-space-md py-space-sm rounded-xl transition-all w-full text-left border-0 cursor-pointer ${
                      isActive
                        ? 'active bg-primary-container text-on-primary font-medium rounded-xl shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface bg-transparent'
                    }`}
                    onClick={() => {
                      if (page.id === 'settings') {
                        setShowStoresModal(true)
                      } else {
                        navigate(`/${page.id}`)
                      }
                    }}
                  >
                    <span className="material-symbols-outlined text-[20px]">{page.icon}</span>
                    <span className="font-body-md text-body-md sidebar-link-label">{page.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="sidebar-footer p-space-md">
          <div className="sidebar-profile flex items-center justify-between p-space-sm bg-surface-container-lowest/80 backdrop-blur-md rounded-xl shadow-[0_1px_8px_rgba(13,37,56,0.04)]">
            <div className="sidebar-profile-user flex items-center gap-space-sm overflow-hidden">
              <div
                className="sidebar-avatar w-9 h-9 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-label-md text-label-md font-semibold tracking-wider flex-shrink-0"
              >
                {roleInfo.initials}
              </div>
              <div className="sidebar-profile-info flex flex-col truncate">
                <span className="sidebar-profile-name font-body-sm text-body-sm font-semibold text-on-surface truncate">
                  {fullName || roleInfo.label}
                </span>
                <span className="sidebar-profile-role font-label-sm text-label-sm uppercase tracking-wider text-secondary truncate">
                  {roleInfo.label}
                </span>
              </div>
            </div>
            <button
              className="sidebar-logout w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors flex-shrink-0 bg-transparent border-0 cursor-pointer"
              type="button"
              onClick={handleLogout}
              title="Logout"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="app-frame flex flex-col min-h-screen">
        <main className="app-body">
          {loading ? (
            <section className="content-shell">
              <div className="workspace-state">
                <span className="workspace-state-spinner" />
                <strong>Loading expedition inventory</strong>
                <span>Syncing equipment, stores, categories, and members.</span>
              </div>
            </section>
          ) : error ? (
            <section className="content-shell">
              <div className="workspace-state workspace-state-error">
                <span className="material-symbols-outlined">cloud_off</span>
                <strong>Could not connect to the workspace</strong>
                <span>{error}. Make sure the backend API server is online and reachable.</span>
                <button className="primary-btn" onClick={loadData} type="button">Retry sync</button>
              </div>
            </section>
          ) : renderPage()}
        </main>
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
        <div className={`app-toast app-toast--${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App