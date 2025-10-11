import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/store";
import App from "./App.jsx";

// 👇 THÊM 2 IMPORT NÀY
import { setOnUnauthorized } from "@/api/axios";
import { clearAuth } from "@/store/authSlice";

import "antd/dist/reset.css";
import "./index.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import "swiper/css/thumbs";
import "viewerjs/dist/viewer.css";

setOnUnauthorized(() => {
  store.dispatch(clearAuth());

});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <Provider store={store}>
        <App />
      </Provider>
    </Router>
  </StrictMode>
);
