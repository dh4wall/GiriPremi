import { getAuthHeaders } from './authApi'

const BASE = "/api";

export const fetchInventory = async () => {
    const response = await fetch(`${BASE}/inventory/`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to fetch inventory");
    return response.json();
};
