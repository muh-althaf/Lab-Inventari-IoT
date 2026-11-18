const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getAuthToken() {
    if (typeof window === "undefined") return null;

    return (
        sessionStorage.getItem("sipl_token") ||
        localStorage.getItem("sipl_token")
    );
}

export async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        cache: "no-store",
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(
            result.message || "Terjadi kesalahan pada server."
        );

        error.status = response.status;
        error.errors = result.errors || null;

        throw error;
    }

    return result;
}