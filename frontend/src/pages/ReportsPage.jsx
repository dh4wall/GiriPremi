const REPORT_ICON = {
  'Monthly Inventory Health': 'inventory_2',
  'Issue And Return Summary': 'swap_horiz',
  'Inspection Compliance': 'task_alt',
}

function ReportsPage({ onExportReport = () => { }, readOnly, reports = [] }) {
  if (readOnly) {
    return (
      <section className="content-shell">
        <div className="section-head compact">
          <div>
            <h2>Reports</h2>
            <p className="subtle-title">System reports and analytics</p>
          </div>
        </div>
        <div className="empty-state" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>lock</span>
          This section is available only for Store Operator login.
        </div>
      </section>
    )
  }

  return (
    <section className="content-shell">
      <div className="section-head compact">
        <div>
          <h2>Reports</h2>
          <p className="subtle-title">{reports.length} report{reports.length !== 1 ? 's' : ''} available</p>
        </div>
        <button className="primary-btn" onClick={onExportReport} type="button">
          <span className="material-symbols-outlined">download</span>
          <span>Export Report</span>
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ display: 'block', fontSize: '2.5rem', opacity: 0.3, marginBottom: '0.5rem' }}>bar_chart</span>
          No reports available yet.
        </div>
      ) : (
        <div className="issue-grid">
          {reports.map((report) => {
            const icon = REPORT_ICON[report.title] || 'description'
            return (
              <article className="inspection-card" key={report.title}>
                <div className="inspection-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="icon-tone blue material-symbols-outlined" style={{ height: 34, width: 34, fontSize: '1.1rem' }}>
                      {icon}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '0.97rem' }}>{report.title}</h3>
                  </div>
                  <span className="status-tag green">READY</span>
                </div>
                <p style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', opacity: 0.6 }}>date_range</span>
                  {report.period}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.7rem' }}>
                  <small style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', opacity: 0.5 }}>schedule</span>
                    {report.generated}
                  </small>
                  <button className="icon-btn" title="Download" type="button" onClick={onExportReport}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ReportsPage
