import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Unregister service workers in development to prevent caching issues
if (process.env.NODE_ENV === 'development' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('🔧 Service Worker unregistered for development');
    });
  });
}

// Configure accessibility testing in development
if (process.env.NODE_ENV === 'development') {
  import('./lib/accessibility').then(({ configureAccessibility }) => {
    configureAccessibility();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
