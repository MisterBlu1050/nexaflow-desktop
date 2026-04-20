import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Excalidraw requires its own stylesheet — must be imported at app root
import "@excalidraw/excalidraw/index.css";

createRoot(document.getElementById("root")!).render(<App />);
