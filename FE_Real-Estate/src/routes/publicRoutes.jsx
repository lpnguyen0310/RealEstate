import RegisterModal from "@/pages/Signup/RegisterModal";
import Home from "@/pages/Home";
import InfoRealEstate from "@/pages/RealEstateDetail/InfoRealEstate";
import LoginPage from "../pages/Login";         
import SearchResultsPage from "../pages/Search/SearchResultsBody";
import OAuth2Callback from "../pages/Login/OAuth2Callback";
import SavedPosts from "../pages/Home/SavedPosts";
import AgentProfile from "../pages/Home/AgentProfile";
export const publicRoutes = [
    { path: "/", element: <Home /> },
    { path: "/real-estate/:id", element: <InfoRealEstate /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterModal /> },
    { path: "/search", element: <SearchResultsPage  /> },
    { path: "/oauth2/callback", element: <OAuth2Callback /> },
    { path: "/tin-da-luu", element: <SavedPosts /> },
    {path: "/agent/:id", element: <AgentProfile />},

];