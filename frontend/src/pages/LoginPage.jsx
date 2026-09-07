import { useState } from "react"

function LoginPage({ onGoHome, onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState("storeAdmin")

  return (
    <section className="login-screen">
      <div className="login-wave" />
      <div className="login-card">
        <div className="login-head">
          <button className="login-brand-btn" onClick={onGoHome} type="button">
            <div className="brand-logo">
              <span className="material-symbols-outlined">terrain</span>
            </div>
          </button>
          <h2>Giripremi</h2>
          <p>Shop Owner Login</p>
          <small>Manage your mountaineering inventory</small>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onLogin(username, password, userType)
          }}
        >
          <label htmlFor="username">
            <span className="material-symbols-outlined">person</span>
            Username
          </label>
          <input
            id="username"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your username"
            required
            type="text"
            value={username}
          />

          <label htmlFor="password">
            <span className="material-symbols-outlined">lock</span>
            Password
          </label>
          <input
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            type="password"
            value={password}
          />

          <label htmlFor="user-type">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            Login As
          </label>
          <select
            id="user-type"
            onChange={(event) => setUserType(event.target.value)}
            value={userType}
          >
            <option value="storeAdmin">Store Admin</option>
            <option value="superAdmin">Super Admin</option>
          </select>
          <small className="login-role-note">
            Store Admin: issue/update workflow. Super Admin: add and delete products.
          </small>

          <div className="remember-row">
            <label className="checkbox-row" htmlFor="remember">
              <input id="remember" type="checkbox" />
              <span>Remember me</span>
            </label>
            <button className="link-btn" type="button">Forgot Password?</button>
          </div>

          <button className="primary-btn full" type="submit">
            <span>Login</span>
            <span className="material-symbols-outlined">login</span>
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
