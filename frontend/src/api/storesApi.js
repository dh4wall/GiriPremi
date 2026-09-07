const BASE = "/api";

export const fetchStores = async () => {
    const response = await fetch(`${BASE}/stores/`);
    if (!response.ok) throw new Error("Failed to fetch stores");
    return response.json();
};

export const createStore = async (storeData) => {
    const response = await fetch(`${BASE}/stores/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeData),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Failed to create store" }));
        throw new Error(err.detail);
    }
    return response.json();
};

export const deleteStore = async (storeId) => {
    const response = await fetch(`${BASE}/stores/${storeId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Failed to delete store" }));
        throw new Error(err.detail);
    }
    return response.json();
};
