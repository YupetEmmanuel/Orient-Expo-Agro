import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (
  "serviceWorker" in navigator &&
  (window.location.protocol === "https:" || window.location.hostname === "localhost")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("✅ PWA: Service Worker registered successfully");
      })
      .catch((error) => {
        console.error("❌ PWA: Service Worker registration failed:", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
