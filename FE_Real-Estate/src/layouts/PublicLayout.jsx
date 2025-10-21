import Header from "@/layouts/Header";
import Footer from "@/layouts/Footer";
import { Outlet } from "react-router-dom";
import AIChatWidget from "../components/aiChatBox/AIChatWidget";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
export default function PublicLayout() {
  const nav = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Outlet />
        <AIChatWidget user={user} size="md" />
      </main>
      <Footer />
    </>
  );
}
