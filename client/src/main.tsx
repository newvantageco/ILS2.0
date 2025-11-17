import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Configure accessibility testing in development
if (process.env.NODE_ENV === 'development') {
  import('./lib/accessibility').then(({ configureAccessibility }) => {
    configureAccessibility();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
