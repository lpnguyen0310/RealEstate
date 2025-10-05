import RegisterModal from "@/pages/Signup/RegisterModal";
import Home from "@/pages/Home";
import InfoRealEstate from "@/pages/RealEstateDetail/InfoRealEstate";
import LoginPage from "../pages/Login";         
import SearchResultsPage from "../pages/Search/SearchResultsBody";

export const publicRoutes = [
    { path: "/", element: <Home /> },
    { path: "/real-estate/:id", element: <InfoRealEstate /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterModal /> },
    { path: "/search", element: <SearchResultsPage  /> },
];