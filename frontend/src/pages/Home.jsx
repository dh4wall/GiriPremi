import { landingMedia } from '../api/config'

const { logo: LOGO_URL, hero: HERO_IMAGE, gear: GEAR_IMAGE, oxygen: OXYGEN_IMAGE } = landingMedia

const stars = Array.from({ length: 5 })

function StarRating() {
  return (
    <div className="reference-stars" aria-label="5 star rating">
      {stars.map((_, index) => <span className="material-symbols-outlined" key={index}>star</span>)}
    </div>
  )
}

function Home({ onHomeClick, onLoginClick }) {
  return (
    <div className="reference-home">
      <header className="reference-header">
        <div className="reference-container reference-header-inner">
          <button className="reference-brand" onClick={onHomeClick} type="button">
            <img alt="Giripremi Light Emblem" src={LOGO_URL} />
            <span>
              <strong>GIRIPREMI</strong>
              <small>EXPEDITION OPS</small>
            </span>
          </button>
          <div className="reference-header-actions">
            <button className="reference-sign-in" onClick={onLoginClick} type="button">Sign In</button>
            <button className="reference-orange-btn" onClick={onLoginClick} type="button">Get Started Free</button>
            <span className="reference-avatar material-symbols-outlined">person</span>
          </div>
        </div>
      </header>

      <main>
        <section className="reference-hero">
          <div className="reference-container reference-hero-content">
            <div className="reference-pill"><span />UIAA Verified High-Altitude Logistics System</div>
            <h1>GIRIPREMI</h1>
            <p className="reference-kicker">Expedition Gear &amp; Altitude Inventory Platform</p>
            <p className="reference-lead">From Everest base camps to Sahyadri ridges, Giripremi equips elite mountaineering expeditions with real-time RFID gear tracking, oxygen level telemetry, and UIAA safety compliance.</p>
            <div className="reference-actions">
              <button className="reference-orange-btn" onClick={onLoginClick} type="button">Get Started</button>
              <a className="reference-outline-btn" href="#gear-gallery">Explore Vault <span className="material-symbols-outlined">arrow_forward</span></a>
            </div>

            <div className="reference-hero-image">
              <img alt="High-altitude Himalayan summit ridge with climbers ascending at sunrise" src={HERO_IMAGE} />
              <div className="reference-image-scrim" />
              <div className="reference-telemetry">
                <div><span className="material-symbols-outlined">ac_unit</span><strong>8,000m+ Death Zone<small>Field Verified In Extremis</small></strong></div>
                <i />
                <div><span className="material-symbols-outlined">inventory_2</span><strong>42,000+ Tracked Live<small>Ropes, Carabiners &amp; O2 Cylinders</small></strong></div>
                <i />
                <div><span className="material-symbols-outlined">shield</span><strong>Zero Failures<small>Across 18 Global Expeditions</small></strong></div>
              </div>
            </div>
          </div>
        </section>

        <section className="reference-section reference-surface">
          <div className="reference-container">
            <div className="reference-section-heading"><div><label>Engineered For Zero Tolerance</label><h2>Pristine Architecture Under Harsh Alpine Cold</h2></div><p>Hardware-software integration operating without friction from Lukla base camps to South Col high caches.</p></div>
            <div className="reference-feature-grid">
              {[
                ['contactless', 'RFID Cold-Scan', 'Instant sub-zero manifest tallying. Detect and read all carabiners, snow pickets, and harness gear through thick down mitts at -45°C without manual entry.', 'Sub-Zero Tolerant'],
                ['satellite_alt', 'Satellite Sync', 'Asynchronous burst updates via Iridium & Garmin InReach constellations. Keeps HQ, lead sherpas, and valley staging in seamless sync with zero cellular range.', 'Global Constellation Mesh'],
                ['crisis_alert', 'Smart Cache Alerts', 'Predictive consumable drawdown warnings for Camp II, III, and IV caches. Automated alert vectors on remaining O2 bars, stove fuel canisters, and dynamic ropes.', 'Automated Survival Margins'],
              ].map(([icon, title, copy, tag]) => (
                <article className="reference-feature" key={title}>
                  <span className="reference-feature-icon material-symbols-outlined">{icon}</span>
                  <h3>{title}</h3><p>{copy}</p>
                  <button onClick={onLoginClick} type="button">{tag} <span className="material-symbols-outlined">arrow_forward</span></button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="reference-section reference-gallery" id="gear-gallery">
          <div className="reference-container">
            <div className="reference-section-heading"><div><label>Active Expedition Vault</label><h2>High-Altitude Mission Hardware</h2></div><div className="reference-tags"><span>Camp IV Depot</span><span>Live Telemetry Synced</span></div></div>
            <div className="reference-gear-grid">
              <GearCard image={GEAR_IMAGE} label="Summit Ascent Hardware" status="Active in Basecamp" title="Ropes, Technical Axes & Carabiners" kit="KIT #8820-A" copy="Precision-inspected dynamic cordage and matched technical dry-tooling axes allocated for 7,000m+ couloir fixes." tags={['UIAA Certified', 'Dry-Treated Core', 'Micro-Inspected 04/2025', '24kN Gate Rating']} />
              <GearCard image={OXYGEN_IMAGE} label="High-Altitude Life Support" status="Ready for Drop" title="Composite O2 & Geodesic Shelters" kit="KIT #9401-O2" copy="Carbon-wound oxygen canisters, cryogenic regulators, and extreme storm shelters rated for severe Himalayan high-pressure drops." tags={['300 Bar Pressure', '-50°C Rated', 'Ultralight Carbon Shell', 'Geodesic 5-Pole']} />
            </div>
          </div>
        </section>

        <section className="reference-section reference-reviews">
          <div className="reference-container">
            <div className="reference-section-heading"><div><label>Field Validation</label><h2>Tested Where Margins Do Not Exist</h2></div><div className="reference-rating"><StarRating /><strong>4.9 / 5 Rating<small>From 120+ International Alpine Expeditions</small></strong></div></div>
            <div className="reference-review-grid">
              <Review quote="“Giripremi turned our chaotic 3-ton expedition load into flawless precision on K2. We knew the location and status of every single carabiner and O2 cylinder.”" initials="RS" name="Capt. Rajesh Sharma" role="K2 & Everest Expedition Leader" />
              <Review quote="“In whiteout conditions at 7,400m on Annapurna, knowing our gear caches were audited and intact saved our assault window.”" initials="AK" name="Anita Kulkarni" role="High-Altitude Technical Climber" />
              <Review quote="“The cleanest gear management system the Himalayan mountaineering community has ever seen. Essential for large guiding agencies.”" initials="TD" name="Tenzing Dorjee" role="Chief Climbing Guide, IMF Certified" />
            </div>
          </div>
        </section>

        <section className="reference-section reference-cta" id="expedition-cta">
          <div className="reference-container"><div className="reference-cta-card">
            <div className="reference-contours" />
            <div className="reference-cta-content"><label>Instant Mission Setup</label><h2>Equip Your Next Alpine Objective With Giripremi</h2><p>Deploy full expedition roster tracking, UIAA inspection audits, and satellite telemetry caches in under 5 minutes.</p>
              <form onSubmit={(event) => { event.preventDefault(); onLoginClick() }}><input aria-label="Expedition email" placeholder="leader@alpine-expedition.org" required type="email" /><button className="reference-orange-btn" type="submit">Start Free Trial</button></form>
              <div className="reference-checks"><span><span className="material-symbols-outlined">check_circle</span>No satellite terminal fees</span><span><span className="material-symbols-outlined">check_circle</span>Instant offline sync</span></div>
            </div>
          </div></div>
        </section>
      </main>

      <footer className="reference-footer">
        <div className="reference-container reference-footer-grid">
          <div><div className="reference-footer-brand"><img alt="Giripremi Light Emblem" src={LOGO_URL} /><strong>GIRIPREMI</strong></div><p>Extreme alpine expedition logistics, telemetry-grade inventory allocation, and survival equipment readiness standard.</p><span className="reference-footer-verified"><span className="material-symbols-outlined">verified_user</span>UIAA Certified Manifest Engine</span></div>
          <FooterColumn title="Operations" items={['Gear Vault Core', 'High-Altitude Manifests', 'Telemetry & Weight Gauges', 'Load Distribution Engine']} />
          <FooterColumn title="Expeditions" items={['Himalayan 8000m Protocols', 'Alpine Fast & Light Sets', 'Glacial Traverse Kits', 'Expedition Debriefs']} />
          <FooterColumn title="Resources" items={['Safety Compliance', 'Field Operations Guide', 'Partner Network', 'Contact Support']} />
          <div><h4>Access Portal</h4><p>Manage your expedition inventory and gear manifest.</p><button className="reference-orange-btn" onClick={onLoginClick} type="button">Sign In</button></div>
        </div>
      </footer>
    </div>
  )
}

function GearCard({ image, label, status, title, kit, copy, tags }) {
  return <article className="reference-gear-card"><div className="reference-gear-image"><img alt={title} src={image} /><span>{label}</span><b>{status}</b></div><div className="reference-gear-copy"><div className="reference-gear-title"><h3>{title}</h3><small>{kit}</small></div><p>{copy}</p><div className="reference-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></article>
}

function Review({ quote, initials, name, role }) {
  return <article className="reference-review"><StarRating /><p>{quote}</p><div><strong>{initials}</strong><span><b>{name}</b><small>{role}</small></span></div></article>
}

function FooterColumn({ title, items }) {
  return <div><h4>{title}</h4><ul>{items.map((item) => <li key={item}><a href="#expedition-cta">{item}</a></li>)}</ul></div>
}

export default Home
