const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let nextServerProcess;

const DEV_URL = process.env.ELECTRON_DEV_URL || "http://127.0.0.1:3000";
const PORT = process.env.PORT || "3000";

async function waitForUrl(url, attempts = 40) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Unable to reach ${url}`);
}

function startBundledNextServer() {
  if (process.env.ELECTRON_START_URL) {
    return process.env.ELECTRON_START_URL;
  }

  const appPath = app.getAppPath();
  const serverPath = path.join(appPath, ".next", "standalone", "server.js");

  nextServerProcess = spawn(process.execPath, [serverPath], {
    cwd: appPath,
    env: {
      ...process.env,
      PORT,
    },
    stdio: "inherit",
  });

  return `http://127.0.0.1:${PORT}`;
}

async function createWindow() {
  const appUrl = app.isPackaged ? startBundledNextServer() : DEV_URL;
  await waitForUrl(appUrl);

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#FFF8EF",
    title: "PropertySuite Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  await mainWindow.loadURL(appUrl);
}

app.whenReady().then(() => {
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextServerProcess) {
    nextServerProcess.kill();
  }
});
