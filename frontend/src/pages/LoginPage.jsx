import { useState } from "react"
import { login as apiLogin, setToken } from "../api/authApi"

const ROLE_CONFIG = {
  superAdmin: {
    label: "Super Admin",
    desc: "Full access — add/delete equipment & manage all data",
    color: "#8a4fff",
    bg: "#f2ebff",
    icon: "manage_accounts",
  },
  storeAdmin: {
    label: "Store Admin",
    desc: "Issue & return workflow, inventory management",
    color: "#3a6ff7",
    bg: "#edf3ff",
    icon: "store",
  },
  member: {
    label: "Club Member",
    desc: "View-only access to equipment and reports",
    color: "#2fa866",
    bg: "#eaf9ef",
    icon: "hiking",
  },
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState("storeAdmin")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const role = ROLE_CONFIG[userType]

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await apiLogin(email, password)
      setToken(data.access_token)
      onLogin(data.full_name, data.user_type, data)
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="login-screen">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-card login-card-glass">
        {/* Header */}
        <div className="login-head">
          <div className="login-brand-icon">
            <span className="material-symbols-outlined">terrain</span>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to Giripremi Store Manager</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="login-error-banner">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Email */}
          <div className="login-field">
            <label htmlFor="login-email">
              <span className="material-symbols-outlined">alternate_email</span>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@giripremi.com"
              required
              autoComplete="email"
              className="login-input"
            />
          </div>

          {/* Password */}
          <div className="login-field">
            <label htmlFor="login-password">
              <span className="material-symbols-outlined">lock</span>
              Password
            </label>
            <div className="login-password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="login-input"
              />
              <button
                type="button"
                className="login-toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Role selector */}
          <div className="login-field">
            <label htmlFor="login-role">
              <span className="material-symbols-outlined">admin_panel_settings</span>
              Login As
            </label>
            <div className="login-role-tabs">
              {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  className={`login-role-tab ${userType === key ? "active" : ""}`}
                  style={userType === key ? { borderColor: cfg.color, background: cfg.bg, color: cfg.color } : {}}
                  onClick={() => setUserType(key)}
                >
                  <span className="material-symbols-outlined">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              ))}
            </div>
            <p className="login-role-desc" style={{ color: role.color, background: role.bg }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>info</span>
              {role.desc}
            </p>
          </div>

          {/* Remember + forgot */}
          <div className="remember-row">
            <label className="checkbox-row" htmlFor="remember">
              <input id="remember" type="checkbox" />
              <span>Remember me</span>
            </label>
            <button className="link-btn" type="button">Forgot Password?</button>
          </div>

          {/* Submit */}
          <button
            className={`login-submit-btn ${loading ? "loading" : ""}`}
            type="submit"
            disabled={loading}
            style={{ background: `linear-gradient(135deg, ${role.color}, ${role.color}cc)` }}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined">login</span>
              </>
            )}
          </button>
        </form>

        <div className="login-foot">
          <small>
            New store partner? <button className="link-btn" type="button">Contact Administration</button>
          </small>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
