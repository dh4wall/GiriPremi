const BASE = "/api";

export const fetchInventory = async () => {
    const response = await fetch(`${BASE}/inventory/`);
    if (!response.ok) throw new Error("Failed to fetch inventory");
    return response.json();
};
