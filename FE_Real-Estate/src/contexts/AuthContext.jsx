// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import { setAccessToken, clearAccessToken, getAccessToken } from "@/utils/auth";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [bootstrapping, setBootstrapping] = useState(true);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const t = getAccessToken();

                if (t) {
                    // có access → thử /me
                    const me = await api.get("user/me");
                    setUser(me?.data?.data ?? me?.data ?? null);
                    return;
                }

                // không có access → thử refresh bằng cookie HttpOnly
                try {
                    const r = await api.post("/auth/refresh"); // cookie tự gửi
                    const access = r?.data?.data?.access || r?.data?.data?.accessToken;
                    if (access) {
                        setAccessToken(access);
                        const me = await api.get("user/me");
                        setUser(me?.data?.data ?? me?.data ?? null);
                        return;
                    }
                } catch {
                    // no refresh cookie / refresh fail -> xem như chưa đăng nhập
                }
            } catch {
                clearAccessToken();
            } finally {
                setBootstrapping(false);
            }
        };
        bootstrap();
    }, []);

    const login = async ({ username, password }) => {
        const res = await api.post("/auth/login", { identifier: username, password });
        const access = res?.data?.data?.access || res?.data?.data?.accessToken;
        if (!access) throw new Error("No access token");
        setAccessToken(access);
        const me = await api.get("user/me").catch(() => ({ data: null }));
        setUser(me?.data?.data ?? me?.data ?? null);
    };

    const logout = async () => {
        try { await api.post("/auth/logout"); } catch { }
        clearAccessToken();
        setUser(null);
    };

    const value = useMemo(() => ({ user, login, logout, bootstrapping }), [user, bootstrapping]);
    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
