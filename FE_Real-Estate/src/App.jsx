import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hydrateFromSession, getProfileThunk } from "@/store/authSlice";
import { getAccessToken } from "@/utils/auth";
import AppRoutes from "@/routes/AppRoutes";
import WebSocketListener from "@/components/common/WebSocketListener";

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const status = useSelector((s) => s.auth.status);

  useEffect(() => {
    dispatch(hydrateFromSession());
    const t = getAccessToken();
    if (t && !user && status !== "loading") {
      dispatch(getProfileThunk());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  console.log("App.jsx rendering - User:", user, "Status:", status);

  return (
    <>
      {user && <WebSocketListener />}
      <AppRoutes />
    </>
  );
}
