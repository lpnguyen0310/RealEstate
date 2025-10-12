import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { message } from "antd";

import { getProfileThunk } from "@/store/authSlice";
import { setAccessToken } from "@/utils/auth"; 

export default function OAuth2Callback() {
    const [params] = useSearchParams();
    const nav = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            const access = params.get("access");
            const refresh = params.get("refresh"); 
            if (!access) {
                message.error("Đăng nhập Google thất bại!");
                nav("/login", { replace: true });
                return;
            }
            setAccessToken(access);
            try {
                await dispatch(getProfileThunk()).unwrap();
                message.success("Đăng nhập Google thành công!");
                nav("/", { replace: true });
            } catch (e) {
                message.error("Không tải được hồ sơ người dùng.");
                nav("/login", { replace: true });
            }
        })();
    }, [dispatch, nav, params]);

    return <div style={{ padding: 32, textAlign: "center" }}>Đang đăng nhập…</div>;
}
