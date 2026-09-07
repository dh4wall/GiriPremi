function DashboardPage({ onChangeRange, onOpenIssue, onOpenReports, onOpenReturn, onPageChange, recentActivity, readOnly, summaryCards }) {
  return (
    <section className="content-shell">
      <div className="section-head">
        <div>
          <h2>Store Overview</h2>
          <p>Manage equipment status and tracking from a central hub.</p>
        </div>
        <button className="secondary-btn" onClick={onChangeRange} type="button">
          <span className="material-symbols-outlined">calendar_today</span>
          <span>Last 30 Days</span>
        </button>
      </div>

      {readOnly ? (
        <div className="info-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>admin_panel_settings</span>
          Super Admin mode: new product add/delete is available in Inventory.
        </div>
      ) : null}

      <div className="card-grid">
        {summaryCards.map((card) => (
          <article className="metric-card" key={card.title} style={{ cursor: 'default' }}>
            <div className="metric-head">
              <span className={`icon-tone ${card.tone} material-symbols-outlined`}>{card.icon}</span>
              {card.tag ? <span className={`mini-tag ${card.tone}`}>{card.tag}</span> : null}
            </div>
            <p>{card.title}</p>
            <h3>{card.value}</h3>
          </article>
        ))}
      </div>

      {!readOnly ? (
        <div className="quick-actions">
          <button
            className="quick-primary"
            onClick={onOpenIssue}
            type="button"
            style={{ flex: 'none', width: '320px' }}
          >
            <div>
              <p>New Issue</p>
              <span>Checkout equipment to a member</span>
            </div>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>

          <button
            className="quick-ghost"
            onClick={onOpenReturn}
            type="button"
            style={{ flex: 'none', width: '260px' }}
          >
            <div>
              <p>Return Equipment</p>
              <span>Process pending returns</span>
            </div>
            <span className="material-symbols-outlined">assignment_return</span>
          </button>
        </div>
      ) : null}

      <div className="table-shell">
        <div className="table-head">
          <h3>Recent Activity</h3>
          <button onClick={onOpenReports} type="button">View All History</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Member Name</th>
              <th>Action</th>
              <th>Date &amp; Time</th>
              <th>Status</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((row) => (
              <tr key={row.item}>
                <td>
                  <div className="item-cell">
                    <span className="material-symbols-outlined">{row.icon}</span>
                    <span>{row.item}</span>
                  </div>
                </td>
                <td>{row.member}</td>
                <td>{row.action}</td>
                <td>{row.time}</td>
                <td>
                  <span className={`status-pill ${row.statusTone}`}>{row.status}</span>
                </td>
                <td className="table-options">
                  <div className="action-btns">
                    <button className="icon-btn" title="More options" type="button">
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>more_horiz</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {recentActivity.length === 0 && (
              <tr>
                <td className="empty-row" colSpan="6">
                  <span className="material-symbols-outlined" style={{ display: 'block', fontSize: '2rem', opacity: 0.3, marginBottom: '0.4rem' }}>history</span>
                  No recent activity
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="table-foot">
          <small style={{ fontSize: '0.75rem', opacity: 0.65 }}>
            {recentActivity.length} transaction{recentActivity.length !== 1 ? 's' : ''} shown
          </small>
          <div className="pager">
            <button className="secondary-btn" style={{ minHeight: 32, padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => onPageChange('back')} type="button">Prev</button>
            <button className="secondary-btn" style={{ minHeight: 32, padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => onPageChange('forward')} type="button">Next</button>
          </div>
        </div>
      </div>

      <div className="issue-grid" style={{ marginTop: '1rem' }}>
        <article className="inspection-card">
          <div className="inspection-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="icon-tone red material-symbols-outlined" style={{ height: 34, width: 34, fontSize: '1.1rem' }}>report</span>
              <h3 style={{ margin: 0 }}>Critical Maintenance</h3>
            </div>
            <span className="status-tag red">High</span>
          </div>
          <p style={{ marginTop: '0.5rem' }}>2 technical items require immediate safety inspection.</p>
          <small style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: 0.6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>schedule</span>
            Updated 25 min ago
          </small>
        </article>

        <article className="inspection-card">
          <div className="inspection-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="icon-tone amber material-symbols-outlined" style={{ height: 34, width: 34, fontSize: '1.1rem' }}>assignment_return</span>
              <h3 style={{ margin: 0 }}>Upcoming Returns Today</h3>
            </div>
            <span className="status-tag amber">4 Due</span>
          </div>
          <p style={{ marginTop: '0.5rem' }}>Member returns expected before 6:00 PM.</p>
          <small style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: 0.6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>sync</span>
            Auto synced with issue records
          </small>
        </article>
      </div>
    </section>
  )
}

export default DashboardPage
