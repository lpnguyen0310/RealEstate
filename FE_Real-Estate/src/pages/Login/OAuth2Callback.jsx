import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAccessToken } from "@/utils/auth";
import { getProfileThunk } from "@/store/authSlice";

export default function OAuth2Callback() {
    const nav = useNavigate();
    const { search } = useLocation();
    const dispatch = useDispatch();
    const ran = useRef(false); // chặn double-run ở StrictMode

    useEffect(() => {
        (async () => {
            if (ran.current) return;
            ran.current = true;

            const qs = new URLSearchParams(search);
            const access = qs.get("access");
            const refresh = qs.get("refresh");
            console.log("[CB] query:", { access: !!access, refresh: !!refresh });

            if (access) {
                setAccessToken(access);
                sessionStorage.setItem("refresh_token", refresh || "");
                console.log("[CB] token saved. Dispatch getProfile…");
                try {
                    await dispatch(getProfileThunk()).unwrap(); // đợi /user/me xong
                } catch (e) {
                }
            } else {
            }

            const back = sessionStorage.getItem("post_login_redirect") || "/";
            sessionStorage.removeItem("post_login_redirect");
            nav(back, { replace: true });
        })();
    }, [search, nav, dispatch]);

    return <div style={{ padding: 24 }}>Đang hoàn tất đăng nhập…</div>;
}
