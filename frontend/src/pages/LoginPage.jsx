import { useState } from 'react'
import { login as apiLogin, setToken } from '../api/authApi'
import { landingMedia } from '../api/config'

const HERO_IMAGE = landingMedia.hero

const ROLE_CONFIG = {
  superAdmin: {
    label: 'Super Admin',
    description: 'Master vault permissions, satellite telemetry config & security protocols.',
    icon: 'manage_accounts',
  },
  storeAdmin: {
    label: 'Store Admin',
    description: 'Issue & return workflow, high-camp inventory tallies, and RFID dispatch.',
    icon: 'store',
  },
}

const DEMO_CREDENTIALS = {
  superAdmin: { email: 'demo.admin@giripremi.com', password: 'DemoAdmin@123' },
  storeAdmin: { email: 'demo.store@giripremi.com', password: 'DemoStore@123' },
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState('storeAdmin')
  const [useDemo, setUseDemo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const role = ROLE_CONFIG[userType]

  function selectRole(nextRole) {
    setUserType(nextRole)
    if (useDemo) {
      setEmail(DEMO_CREDENTIALS[nextRole].email)
      setPassword(DEMO_CREDENTIALS[nextRole].password)
    }
    setError('')
  }

  function toggleDemoCredentials(event) {
    const checked = event.target.checked
    setUseDemo(checked)
    setEmail(checked ? DEMO_CREDENTIALS[userType].email : '')
    setPassword(checked ? DEMO_CREDENTIALS[userType].password : '')
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiLogin(email, password)
      setToken(data.access_token)
      onLogin(data.full_name, data.user_type, data)
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reference-login">
      <header className="reference-login-header">
        <div className="reference-login-header-inner">
          <div className="reference-login-brand">
            <span className="reference-login-mark"><span className="material-symbols-outlined">terrain</span></span>
            <span><strong>GIRIPREMI</strong><small>Expedition Ops</small></span>
          </div>
          <div className="reference-login-status">
            <span><i />Node: <strong>LHOTSE-04</strong></span>
            <span className="reference-mesh"><span className="material-symbols-outlined">verified</span>UIAA Encrypted Mesh</span>
            <a href="#support">Support Desk</a>
          </div>
        </div>
      </header>

      <main className="reference-login-main">
        <div className="reference-login-card">
          <section className="reference-login-showcase">
            <img src={HERO_IMAGE} alt="Cinematic shot of Himalayan expedition team climbing high ridge" />
            <div className="reference-login-overlay" />
            <div className="reference-login-showcase-copy">
              <span className="reference-login-badge"><i />Field Ops Portal v2.4</span>
              <h1>Precision Gear Allocation Under Extreme Conditions</h1>
              <p>Instant sub-zero manifests, automated O2 canister tracking, and telemetry sync across Himalayan high camps.</p>
            </div>
            <div className="reference-login-metrics">
              <div><small>Active Vaults</small><strong>42,000+</strong><span>Ropes, axes &amp; O2 units</span></div>
              <div><small>Field Sync</small><strong>Iridium OK</strong><span className="reference-online"><i />99.98% uptime</span></div>
            </div>
            <blockquote>
              “Giripremi turned our chaotic multi-camp staging into military precision on K2. We knew the safety margin of every single carabiner.”
              <footer><strong>Capt. Rajesh Sharma</strong><span>Himalayan Expedition Leader</span></footer>
            </blockquote>
          </section>

          <section className="reference-login-form-panel">
            <div className="reference-login-form-wrap">
              <div className="reference-login-heading">
                <span className="reference-login-form-icon material-symbols-outlined">lock_open</span>
                <div><span>SECURE ACCESS</span><small>Encrypted expedition operations portal</small></div>
              </div>
              <h2>Welcome back, <em>climber.</em></h2>
              <p className="reference-login-intro">Sign in to access your gear vault, manifests, and field telemetry.</p>

              {error && <div className="reference-login-error" role="alert"><span className="material-symbols-outlined">error</span>{error}</div>}

              <form onSubmit={handleSubmit}>
                <label htmlFor="reference-email">Email address</label>
                <div className="reference-login-input-wrap">
                  <span className="material-symbols-outlined">mail</span>
                  <input id="reference-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="leader@alpine-expedition.org" required autoComplete="email" />
                </div>
                <div className="reference-login-label-row"><label htmlFor="reference-password">Password</label><button type="button">Forgot Password?</button></div>
                <div className="reference-login-input-wrap">
                  <span className="material-symbols-outlined">lock</span>
                  <input id="reference-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required autoComplete="current-password" />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}><span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span></button>
                </div>

                <div className="reference-security-label"><span className="material-symbols-outlined">shield</span><span>Security Profile</span></div>
                <div className="reference-role-tabs">
                  <div className={`reference-role-pill ${userType === 'storeAdmin' ? 'store' : ''}`} />
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    <button key={key} className={userType === key ? 'active' : ''} onClick={() => selectRole(key)} type="button">
                      <span className="material-symbols-outlined">{config.icon}</span>{config.label}
                    </button>
                  ))}
                </div>
                <div className="reference-role-description"><span className="material-symbols-outlined">info</span><span><strong>{role.label}:</strong> {role.description}</span></div>

                <div className="reference-login-options">
                  <label><input type="checkbox" checked={useDemo} onChange={toggleDemoCredentials} />Use demo credentials</label>
                  <button type="button">Forgot Password?</button>
                </div>
                <button className="reference-login-submit" disabled={loading} type="submit">
                  {loading ? <><span className="reference-spinner" />Signing in…</> : <>Sign In <span className="material-symbols-outlined">arrow_forward</span></>}
                </button>
              </form>
              <div className="reference-login-contact">New store partner? <button type="button">Contact Administration</button></div>
            </div>
          </section>
        </div>
      </main>

      <footer className="reference-login-footer"><span><i />Satellite Telemetry Active: All Himalayan Base Nodes Verified</span><span>© 2025 Giripremi Expedition Ops. High-Altitude Logistics System.</span></footer>
    </div>
  )
}

export default LoginPage
