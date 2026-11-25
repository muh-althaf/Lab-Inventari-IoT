const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export function getAuthToken() {
  if (typeof window === "undefined") return null;

  return (
    sessionStorage.getItem("sipl_token") ||
    localStorage.getItem("sipl_token")
  );
}

export async function apiRequest(endpoint, options = {}) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL belum dikonfigurasi di .env.local.");
  }

  const token = getAuthToken();
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      result.message || `Permintaan gagal (${response.status}).`
    );
    error.status = response.status;
    error.errors = result.errors || null;
    throw error;
  }

  return result;
}
