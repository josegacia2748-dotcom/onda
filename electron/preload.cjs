// Puente mínimo y seguro entre Electron y la interfaz web.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApp", {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  onMediaCommand: (callback) => {
    if (typeof callback !== "function") return () => undefined;
    const listener = (_event, command) => callback(command);
    ipcRenderer.on("onda:media", listener);
    return () => ipcRenderer.removeListener("onda:media", listener);
  },
});
