// src/layouts/PublicLayout.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "@/layouts/Header";
import Footer from "@/layouts/Footer";
import AIChatWidget from "@/components/aiChatBox/AIChatWidget";
import { hydrateFromSession, getProfileThunk } from "@/store/authSlice";
import SupportChatWidget from "@/components/supportchat/SupportChatWidget";

export default function PublicLayout() {
  const dispatch = useDispatch();
  const nav = useNavigate();

  const user = useSelector((s) => s.auth.user);
  const status = useSelector((s) => s.auth.status);

  // ✅ Khi reload trang (F5), tự hydrate từ sessionStorage
  useEffect(() => {
    dispatch(hydrateFromSession());
  }, [dispatch]);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (token && !user && status !== "loading") {
      dispatch(getProfileThunk());
    }
  }, [user, status, dispatch]);

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Outlet />
        <AIChatWidget user={user} size="md" />
        <SupportChatWidget user={user} size="md" />

      </main>
      <Footer />
    </>
  );
}
