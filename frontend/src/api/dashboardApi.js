import { getAuthHeaders } from './authApi'
import { API_BASE_URL as BASE } from './config'

export async function fetchDashboardTelemetry() {
  const response = await fetch(`${BASE}/dashboard/telemetry`, { headers: getAuthHeaders() })
  if (!response.ok) {
    throw new Error('Failed to load dashboard telemetry')
  }
  return response.json()
}
