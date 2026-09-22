/**
 * Minimal Electron main process stub.
 * Full tray + auto-start wiring lands in Milestone 8.
 */
const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 320,
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  win.loadURL("data:text/html,<h1>NEXUS//TWIN Agent</h1><p>Background service</p>");
}

app.whenReady().then(() => {
  createWindow();
  // Spawn agent core via child process in packaging milestone
  console.log("[INFO] Electron shell ready — use `pnpm --filter @nexus-twin/agent dev` for collectors");
});

app.on("window-all-closed", (e) => {
  e.preventDefault();
});
