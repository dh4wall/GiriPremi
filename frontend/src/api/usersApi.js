const BASE = "/api";

export const fetchUsers = async () => {
    const response = await fetch(`${BASE}/users/`);
    if (!response.ok) throw new Error("Failed to fetch users");
    return response.json();
};

export const createUser = async (userData) => {
    const response = await fetch(`${BASE}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error("Failed to create user");
    return response.json();
};

export const updateUser = async (userId, userData) => {
    const response = await fetch(`${BASE}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error("Failed to update user");
    return response.json();
};
