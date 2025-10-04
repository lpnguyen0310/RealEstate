import RegisterModal from "@/pages/Signup/RegisterModal";
import Home from "@/pages/Home";
import InfoRealEstate from "@/pages/RealEstateDetail/InfoRealEstate";
import LoginPage from "../pages/Login";         

export const publicRoutes = [
    { path: "/", element: <Home /> },
    { path: "/real-estate/:id", element: <InfoRealEstate /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterModal /> },
];