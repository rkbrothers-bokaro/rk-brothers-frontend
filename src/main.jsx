import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./core/i18n";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./core/hooks/useAuth";
import { ToastProvider } from "./core/hooks/useToast";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
