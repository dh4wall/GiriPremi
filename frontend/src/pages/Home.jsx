function Home({ onHomeClick, onLoginClick }) {
  return (
    <div className="home-page">
      <header className="home-topbar">
        <div className="home-container home-topbar-inner">
          <button className="home-brand" onClick={onHomeClick} type="button">
            <span className="material-symbols-outlined home-brand-icon">terrain</span>
            <div className="home-brand-text">
              <h2>Giripremi <span>Store</span></h2>
              <small>Store Manager</small>
            </div>
          </button>

          <button className="home-login-btn" onClick={onLoginClick} type="button">
            Login
          </button>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-overlay" />
        <div className="home-container home-hero-content">
          <h1>
            Peak Performance, Managed. Professional Gear Logistics.
          </h1>

          <p>
            Streamline inventory, ensure safety compliance, and coordinate
            multi-store logistics for Giripremi mountaineering teams across the globe.
          </p>

          <div className="home-hero-actions">
            <button className="home-primary-btn" onClick={onLoginClick} type="button">
              Get Started
            </button>

            <button className="home-secondary-btn" onClick={onLoginClick} type="button">
              Login to Portal
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home