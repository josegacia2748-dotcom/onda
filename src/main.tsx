import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { hydrateDownloads } from "./lib/store";
import { next, previous, togglePlay } from "./lib/player";
import "./styles.css";

void hydrateDownloads();

// Menú "Reproducción" de la versión de escritorio (Electron).
type DesktopBridge = {
  isDesktop?: boolean;
  onMediaCommand?: (callback: (command: string) => void) => () => void;
};
const desktop = (window as unknown as { desktopApp?: DesktopBridge }).desktopApp;
if (desktop?.onMediaCommand) {
  desktop.onMediaCommand((command) => {
    if (command === "toggle") togglePlay();
    else if (command === "next") next();
    else if (command === "previous") previous();
  });
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
