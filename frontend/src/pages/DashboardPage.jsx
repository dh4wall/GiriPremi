function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function FlowChart({ weeklyFlow }) {
  const points = weeklyFlow.length ? weeklyFlow : [{ issued: 0, returned: 0 }]
  const max = Math.max(...points.flatMap((point) => [point.issued, point.returned]), 1)
  const x = (index) => points.length === 1 ? 0 : (index / (points.length - 1)) * 600
  const y = (value) => 190 - (value / max) * 150
  const line = (key) => points.map((point, index) => `${x(index)},${y(point[key])}`).join(' ')

  return (
    <svg className="dashboard-flow-chart" preserveAspectRatio="none" viewBox="0 0 600 200">
      {[40, 90, 140, 190].map((lineY) => (
        <line key={lineY} stroke="#cbdbf5" strokeDasharray={lineY === 190 ? undefined : '4 4'} x1="0" x2="600" y1={lineY} y2={lineY} />
      ))}
      <polyline fill="none" points={`${line('issued')} 600,190 0,190`} stroke="#006398" strokeOpacity=".15" strokeWidth="30" />
      <polyline fill="none" points={line('issued')} stroke="#006398" strokeLinecap="round" strokeWidth="3" />
      <polyline fill="none" points={line('returned')} stroke="#f65200" strokeLinecap="round" strokeWidth="3" />
    </svg>
  )
}

function CategoryDonut({ categoryShare }) {
  const total = categoryShare.reduce((sum, category) => sum + category.units, 0)
  const colors = ['#006398', '#5bb8fe', '#0d2538', '#f65200']
  let offset = 0
  return (
    <div className="dashboard-donut-wrap">
      <svg className="dashboard-donut" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="transparent" r="38" stroke="#dce9ff" strokeWidth="11" />
        {categoryShare.slice(0, 4).map((category, index) => {
          const length = total ? (category.units / total) * 238.7 : 0
          const circle = (
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              key={category.name}
              r="38"
              stroke={colors[index]}
              strokeDasharray={`${length} 238.7`}
              strokeDashoffset={-offset}
              strokeWidth="11"
            />
          )
          offset += length
          return circle
        })}
      </svg>
      <div className="dashboard-donut-label"><strong>{total}</strong><span>Units</span></div>
    </div>
  )
}

function DashboardPage({ onOpenIssue, onOpenReports, onOpenReturn, onRefresh, telemetry, loading }) {
  const metrics = telemetry?.metrics || {}
  const categoryShare = telemetry?.category_share || []
  const weeklyFlow = telemetry?.weekly_flow || []
  const condition = telemetry?.condition || { new: 0, moderate: 0, service_due: 0 }
  const totalCondition = Math.max(condition.new + condition.moderate + condition.service_due, 1)
  const conditionPercent = (value) => `${(value / totalCondition) * 100}%`

  return (
    <section className="dashboard-reference content-shell">
      <div className="dashboard-reference-head">
        <div>
          <div className="dashboard-breadcrumb"><span>Store Operations</span><span className="material-symbols-outlined">chevron_right</span><span>Analytics Telemetry</span></div>
          <h1>Store Overview</h1>
          <p>Manage equipment status, dispatch telemetry, and lifecycle tracking from a central hub.</p>
        </div>
        <div className="dashboard-head-actions">
          <select defaultValue="Last 30 Days" aria-label="Dashboard timeframe">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>This Quarter</option>
          </select>
          <button className="dashboard-neutral-btn" onClick={onOpenReports} type="button"><span className="material-symbols-outlined">download</span>Export Report</button>
          <button className="dashboard-sync-btn" onClick={onRefresh} title="Sync Telemetry" type="button"><span className="material-symbols-outlined">sync</span></button>
        </div>
      </div>

      <div className="dashboard-kpis">
        {[
          ['Available Gear', metrics.available_gear ?? '—', 'IN STOCK', 'Ready for immediate field dispatch', 'trending_up'],
          ['Issued Today', metrics.issued_today ?? '—', 'LIVE DISPATCH', 'Units distributed to active alpine teams', null],
          ['Inspection Due', metrics.inspection_due ?? '—', 'ACTION REQ', 'Safety ropes and harnesses triage', null],
          ['Active Members', metrics.active_members ?? '—', 'REGISTERED', 'Qualified climbers on expedition rolls', null],
        ].map(([label, value, tag, helper, icon]) => (
          <article className="dashboard-kpi" key={label}>
            <div><span>{label}</span><b>{tag}</b></div>
            <div><strong>{loading ? '…' : value}</strong>{icon ? <em><span className="material-symbols-outlined">{icon}</span> Live</em> : null}</div>
            <small>{helper}</small>
          </article>
        ))}
      </div>

      <div className="dashboard-workflows">
        <button className="dashboard-workflow dashboard-workflow-primary" onClick={onOpenIssue} type="button">
          <span className="dashboard-workflow-icon material-symbols-outlined">outbox</span>
          <span><strong>New Equipment Issue</strong><small>Checkout equipment to an expedition member</small></span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <button className="dashboard-workflow" onClick={onOpenReturn} type="button">
          <span className="dashboard-workflow-icon material-symbols-outlined">move_to_inbox</span>
          <span><strong>Return Equipment</strong><small>Process pending returns and condition triage</small></span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      <div className="dashboard-analytics-grid">
        <article className="dashboard-panel dashboard-flow-panel">
          <div className="dashboard-panel-head"><div><h2>Gear Checkout &amp; Return Flow</h2><p>Weekly equipment dispatch vs safely verified returns (30 Days)</p></div><div className="dashboard-legend"><span><i />Issued Gear</span><span><i />Returned Gear</span></div></div>
          <FlowChart weeklyFlow={weeklyFlow} />
          <div className="dashboard-chart-labels">{weeklyFlow.map((point) => <span key={point.label}>{point.label}</span>)}</div>
        </article>
        <article className="dashboard-panel">
          <div className="dashboard-panel-head"><div><h2>Category Share</h2><p>Hardware deployment across alpine gear types</p></div><b className="dashboard-panel-badge">{categoryShare.reduce((sum, category) => sum + category.units, 0)} Units</b></div>
          <CategoryDonut categoryShare={categoryShare} />
          <div className="dashboard-category-legend">{categoryShare.slice(0, 4).map((category, index) => <span key={category.name}><i style={{ backgroundColor: ['#006398', '#5bb8fe', '#0d2538', '#f65200'][index] }} />{category.name}: {category.units}</span>)}</div>
        </article>
      </div>

      <article className="dashboard-panel dashboard-condition-panel">
        <div className="dashboard-panel-head"><div><h2><span className="material-symbols-outlined">verified_user</span>Equipment Condition &amp; Safety Health</h2><p>Lifecycle distribution across registered gear inventory</p></div><b className="dashboard-panel-badge">UIAA Compliance: 92% Ready</b></div>
        <div className="dashboard-condition-bar"><i style={{ width: conditionPercent(condition.new) }} /><i style={{ background: '#5bb8fe', width: conditionPercent(condition.moderate) }} /><i style={{ background: '#ba1a1a', width: conditionPercent(condition.service_due) }} /></div>
        <div className="dashboard-condition-legend"><span><i />New / Prime Condition</span><span><i />Moderate / Field Active</span><span><i />Inspection / Service Due</span></div>
      </article>

      <article className="dashboard-panel dashboard-activity-panel">
        <div className="dashboard-panel-head"><div><h2>Recent Activity</h2><p>Real-time dispatch log, gear returns, and safety certifications</p></div><button onClick={onOpenReports} type="button">View All History <span className="material-symbols-outlined">chevron_right</span></button></div>
        <div className="dashboard-table-scroll"><table><thead><tr><th>Item Name</th><th>Member Name</th><th>Action</th><th>Date &amp; Time</th><th>Status</th><th>Options</th></tr></thead><tbody>{(telemetry?.recent_activity || []).map((row) => <tr key={row.id}><td><strong>{row.item}</strong><small>SKU: {row.sku || '—'}</small></td><td>{row.member}</td><td>{row.action}</td><td>{formatDate(row.date)}</td><td><span className="dashboard-status">{row.status}</span></td><td><button className="dashboard-row-action" type="button"><span className="material-symbols-outlined">visibility</span></button></td></tr>)}{!telemetry?.recent_activity?.length && <tr><td className="dashboard-empty" colSpan="6">No recent activity</td></tr>}</tbody></table></div>
      </article>
    </section>
  )
}

export default DashboardPage
