// Reexa desktop shell.
// Online mode (default): the deployed app. Local mode: starts the web app on this machine and points the
// tutor at a local Ollama model, so study help works offline and nothing leaves the laptop.
// ponytail: local mode needs the repo checkout (../web); package the Next standalone build when shipping.
const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

// Local mode runs the web app from the repo checkout; a packaged build has no ../web, so it stays online.
const WEB_DIR = path.join(__dirname, "..", "web");

const ONLINE_URL = process.env.REEXA_URL || "https://web-zeta-six-87.vercel.app";
const OLLAMA = "http://localhost:11434";
const LOCAL_PORT = 3210;
const LOCAL_MODEL = process.env.REEXA_LOCAL_MODEL || "qwen2.5-coder:7b";
let win;
let server;

async function ollamaModels() {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(1500) });
    return (await r.json()).models.map((m) => m.name);
  } catch {
    return [];
  }
}

async function waitFor(url, ms = 90_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function startLocal() {
  if (app.isPackaged || !fs.existsSync(path.join(WEB_DIR, "package.json"))) {
    dialog.showMessageBox({ message: "Local mode is available when running Reexa from the source repo. Opening online mode." });
    return ONLINE_URL;
  }
  const models = await ollamaModels();
  if (!models.length) {
    dialog.showMessageBox({ message: "Local mode needs Ollama running (ollama serve) with a model pulled. Opening online mode." });
    return ONLINE_URL;
  }
  const model = models.includes(LOCAL_MODEL) ? LOCAL_MODEL : models[0];
  if (!server) {
    server = spawn("pnpm", ["dev", "-p", String(LOCAL_PORT)], {
      cwd: WEB_DIR,
      env: {
        ...process.env,
        LLM_BASE_URL: `${OLLAMA}/v1`,
        LLM_API_KEY: "ollama",
        LLM_MODEL: model,
        JURY_MODEL: model,
        LLM_STUB: "0",
        NEXT_DIST_DIR: ".next-desktop",
        ALLOW_UPLOAD: "1",
        LLM_MAX_CALLS_PER_HOUR: "10000",
      },
      stdio: "ignore",
    });
    server.on("error", () => (server = null));
  }
  const url = `http://localhost:${LOCAL_PORT}`;
  return (await waitFor(url)) ? url : ONLINE_URL;
}

async function open(mode) {
  win.setTitle(mode === "local" ? "Reexa · local (Ollama)" : "Reexa · online");
  win.loadURL(mode === "local" ? await startLocal() : ONLINE_URL);
}

app.whenReady().then(() => {
  win = new BrowserWindow({ width: 1280, height: 860, icon: path.join(__dirname, "build", "icon.png"), autoHideMenuBar: true, backgroundColor: "#0f1d3a", webPreferences: { contextIsolation: true, sandbox: true } });
  // External links go to the system browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Firebase sign-in popups must stay in-app so the result returns to this window.
    if (/\/__\/auth\/handler|^https:\/\/accounts\.google\.com\//.test(url)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  // No File/Edit/View bar: the app has its own navigation. Mode is chosen at launch
  // (`pnpm start` = online, `pnpm local` = Ollama). Without a menu there are no Ctrl+R / devtools shortcuts.
  Menu.setApplicationMenu(null);
  open(process.env.REEXA_MODE === "local" ? "local" : "online");
});

app.on("window-all-closed", () => app.quit());
app.on("quit", () => server?.kill());
