
"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    // Mengambil token dari penyimpanan browser.
    const getToken = useCallback(() => {
        if (typeof window === "undefined") return null;

        return (
            sessionStorage.getItem("sipl_token") ||
            localStorage.getItem("sipl_token")
        );
    }, []);

    // Membersihkan seluruh sesi.
    const clearSession = useCallback(() => {
        if (typeof window === "undefined") return;

        localStorage.removeItem("sipl_token");
        localStorage.removeItem("sipl_user");

        sessionStorage.removeItem("sipl_token");
        sessionStorage.removeItem("sipl_user");

        setUser(null);
        setAuthenticated(false);
    }, []);

    // Memverifikasi token ke Laravel.
    const refreshUser = useCallback(async () => {
        const token = getToken();

        if (!token) {
            setUser(null);
            setAuthenticated(false);
            return null;
        }

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });

            if (!response.ok) {
                // Token ditolak server.
                if (response.status === 401 || response.status === 403) {
                    clearSession();
                }

                return null;
            }

            const result = await response.json();

            // Format respons API /auth/me:
            // { success, message, data: { id_user, nama, ... } }
            const currentUser = result.data;

            if (!currentUser || !currentUser.id_user) {
                clearSession();
                return null;
            }

            setUser(currentUser);
            setAuthenticated(true);

            // Sinkronisasi data user.
            const storage = sessionStorage.getItem("sipl_token")
                ? sessionStorage
                : localStorage;

            storage.setItem("sipl_user", JSON.stringify(currentUser));

            return currentUser;
        } catch (error) {
            console.error("Auth verification error:", error);

            // Jika server tidak dapat dijangkau, token tidak
            // langsung dihapus. Verifikasi dapat dicoba kembali.
            return null;
        }
    }, [getToken, clearSession]);

    // Memeriksa sesi saat aplikasi pertama kali dibuka.
    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                await refreshUser();
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        return () => {
            mounted = false;
        };
    }, [refreshUser]);

    // Logout melalui Laravel Sanctum.
    const logout = useCallback(async () => {
        const token = getToken();

        try {
            if (token) {
                await fetch(`${API_URL}/auth/logout`, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error("Logout API error:", error);
        } finally {
            clearSession();
        }
    }, [getToken, clearSession]);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                authenticated,
                refreshUser,
                logout,
                getToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth harus digunakan di dalam AuthProvider."
        );
    }

    return context;
}
