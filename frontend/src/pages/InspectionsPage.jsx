const PRIORITY_ICON = { High: 'report', Medium: 'warning', Low: 'info' }
const PRIORITY_TONE = { High: 'red', Medium: 'amber', Low: 'green' }

function InspectionsPage({ inspections = [], onNewInspection = () => { }, readOnly }) {
  if (readOnly) {
    return (
      <section className="content-shell">
        <div className="section-head compact">
          <div>
            <h2>Inspections</h2>
            <p className="subtle-title">Equipment safety and compliance checks</p>
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
          <h2>Inspections</h2>
          <p className="subtle-title">{inspections.length} pending inspection{inspections.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="primary-btn" onClick={onNewInspection} type="button">
          <span className="material-symbols-outlined">add_task</span>
          <span>New Inspection</span>
        </button>
      </div>

      {inspections.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ display: 'block', fontSize: '2.5rem', opacity: 0.3, marginBottom: '0.5rem' }}>rule</span>
          No inspections scheduled.
        </div>
      ) : (
        <div className="issue-grid">
          {inspections.map((inspection) => {
            const tone = PRIORITY_TONE[inspection.priority] || 'blue'
            const icon = PRIORITY_ICON[inspection.priority] || 'rule'
            return (
              <article className="inspection-card" key={inspection.item}>
                <div className="inspection-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className={`icon-tone ${tone} material-symbols-outlined`} style={{ height: 34, width: 34, fontSize: '1.1rem' }}>
                      {icon}
                    </span>
                    <h3 style={{ margin: 0 }}>{inspection.item}</h3>
                  </div>
                  <span className={`status-tag ${tone}`}>{inspection.priority}</span>
                </div>
                <p style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', opacity: 0.6 }}>category</span>
                  {inspection.category}
                </p>
                <small style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.3rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', opacity: 0.5 }}>schedule</span>
                  {inspection.due}
                </small>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default InspectionsPage
