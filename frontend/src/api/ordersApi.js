import { getAuthHeaders } from './authApi'

const BASE = "/api";

export const fetchOrders = async () => {
    const response = await fetch(`${BASE}/orders/`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to fetch orders");
    return response.json();
};

export const createOrder = async (orderData) => {
    const response = await fetch(`${BASE}/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(orderData),
    });
    if (!response.ok) throw new Error("Failed to create order");
    return response.json();
};

export const updateOrder = async (orderId, orderData) => {
    const response = await fetch(`${BASE}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(orderData),
    });
    if (!response.ok) throw new Error("Failed to update order");
    return response.json();
};

export const returnItems = async (returnData) => {
    const response = await fetch(`${BASE}/orders/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(returnData),
    });
    if (!response.ok) throw new Error("Failed to return items");
    return response.json();
};

export const cancelOrder = async (orderId) => {
    const response = await fetch(`${BASE}/orders/${orderId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    if (!response.ok) throw new Error("Failed to cancel order");
    return response.json();
};
