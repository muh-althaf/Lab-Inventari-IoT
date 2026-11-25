
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const navigation = [
    {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: "▦",
    },
    {
        label: "Data Peminjaman",
        href: "/admin/peminjaman",
        icon: "▤",
    },
    {
        label: "Pengelolaan Inventaris",
        href: "/admin/inventaris",
        icon: "▣",
    },
];

export default function AdminLayout({ children }) {
    const { user, loading, authenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;

        if (!authenticated || !user) {
            router.replace("/login");
            return;
        }

        if (user.role !== "kepala_lab") {
            router.replace("/dashboard");
        }
    }, [loading, authenticated, user, router]);

    const handleLogout = async () => {
        await logout();
        router.replace("/login");
    };

    if (
        loading ||
        !authenticated ||
        !user ||
        user.role !== "kepala_lab"
    ) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-slate-400">
                        Memeriksa akses kepala laboratorium...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
            {/* Sidebar */}
            <aside className="w-full md:w-64 md:min-h-screen bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold tracking-tight">
                        SIPL-IoT
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Panel Kepala Laboratorium
                    </p>
                </div>

                <nav className="p-4 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        Menu Utama
                    </p>

                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const active =
                                pathname === item.href ||
                                pathname.startsWith(`${item.href}/`);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${active
                                            ? "bg-blue-600 text-white"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        }`}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="mb-4 px-2">
                        <p className="text-sm font-medium text-white">
                            {user.nama}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Kepala Laboratorium
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 text-left transition"
                    >
                        Keluar dari akun
                    </button>
                </div>
            </aside>

            {/* Konten halaman */}
            <main className="flex-1 min-w-0">
                {children}
            </main>
        </div>
    );
}