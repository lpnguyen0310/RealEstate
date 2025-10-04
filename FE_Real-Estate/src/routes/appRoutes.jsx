import { Routes, Route } from "react-router-dom";
import { publicRoutes } from "./publicRoutes";
import { adminRoutes } from "./adminRoutes";

export default function AppRoutes() {
  return (
    <Routes>
      {(publicRoutes ?? []).map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}

      {(adminRoutes ?? []).map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}

      <Route path="*" element={<div style={{padding:24}}>404 Not Found</div>} />
    </Routes>
  );
}

