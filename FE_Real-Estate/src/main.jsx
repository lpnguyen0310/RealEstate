import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter as Router } from "react-router-dom";
import "antd/dist/reset.css";
import "swiper/css";
import "swiper/css/navigation";
import "viewerjs/dist/viewer.css";
import "swiper/css/free-mode";
import "swiper/css/thumbs";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
