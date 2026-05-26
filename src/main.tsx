import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Remove Supabase import


createRoot(document.getElementById("root")!).render(<App />);
