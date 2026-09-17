const BASE = "/api";

// ── Token storage ─────────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem("giripremi_token");
export const setToken = (token) => localStorage.setItem("giripremi_token", token);
export const clearToken = () => localStorage.removeItem("giripremi_token");

export const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Auth API calls ────────────────────────────────────────────────────────────

/**
 * Login with email + password.
 * Returns { access_token, token_type, user_type, full_name, user_id }
 */
export const login = async (email, password) => {
    const response = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Login failed");
    }
    return response.json();
};

/**
 * Get the currently authenticated user's profile.
 */
export const getMe = async () => {
    const response = await fetch(`${BASE}/auth/me`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    if (!response.ok) throw new Error("Not authenticated");
    return response.json();
};
