import { getAuthHeaders } from './authApi'
import { API_BASE_URL as BASE } from './config'

export const fetchInventory = async () => {
    const response = await fetch(`${BASE}/inventory/`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to fetch inventory");
    return response.json();
};

export const fetchStoreInventory = async (storeId) => {
    const response = await fetch(`${BASE}/inventory/store/${storeId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to fetch store inventory");
    return response.json();
};
