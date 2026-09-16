const { app, BrowserWindow, Menu, screen, shell } = require("electron");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const ROOT = path.join(__dirname, "www");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function resolveUrl(urlPath) {
  const clean = decodeURIComponent((urlPath || "/").split("?")[0].split("#")[0]);
  if (clean === "/stage") return path.join(ROOT, "stage.html");
  const rel = clean === "/" ? "index.html" : clean.replace(/^\/+/, "");
  const abs = path.normalize(path.join(ROOT, rel));
  if (!abs.startsWith(ROOT)) return null;
  return abs;
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const filePath = resolveUrl(req.url || "/");
      if (!filePath) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(err.code === "ENOENT" ? 404 : 500);
          res.end(err.code === "ENOENT" ? "Not found" : "Error");
          return;
        }
        res.writeHead(200, {
          "Content-Type": contentType(filePath),
          "Cache-Control": "public, max-age=60",
        });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
    server.on("error", reject);
  });
}

function secondaryDisplay() {
  const primary = screen.getPrimaryDisplay();
  return screen.getAllDisplays().find((d) => d.id !== primary.id) || null;
}

function createMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        role: "appMenu",
        label: "Писание",
        submenu: [
          { role: "about", label: "О программе Писание" },
          { type: "separator" },
          { role: "hide", label: "Скрыть Писание" },
          { role: "hideOthers", label: "Скрыть остальные" },
          { role: "unhide", label: "Показать все" },
          { type: "separator" },
          { role: "quit", label: "Выйти из Писания" },
        ],
      },
      {
        label: "Правка",
        submenu: [
          { role: "undo", label: "Отменить" },
          { role: "redo", label: "Повторить" },
          { type: "separator" },
          { role: "cut", label: "Вырезать" },
          { role: "copy", label: "Скопировать" },
          { role: "paste", label: "Вставить" },
          { role: "selectAll", label: "Выбрать всё" },
        ],
      },
      {
        label: "Вид",
        submenu: [
          { role: "reload", label: "Обновить" },
          { type: "separator" },
          { role: "togglefullscreen", label: "Полный экран" },
        ],
      },
      {
        label: "Окно",
        submenu: [
          { role: "minimize", label: "Свернуть" },
          { role: "zoom", label: "Масштаб" },
          { type: "separator" },
          { role: "front", label: "Все окна на передний план" },
        ],
      },
    ]),
  );
}

async function createMainWindow(port) {
  const origin = `http://127.0.0.1:${port}`;
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 880,
    minHeight: 600,
    title: "Писание",
    backgroundColor: "#EFEAE2",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(origin)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    const extra = secondaryDisplay();
    const isStage = url.includes("/stage");
    if (isStage && extra) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          x: extra.bounds.x,
          y: extra.bounds.y,
          width: extra.bounds.width,
          height: extra.bounds.height,
          fullscreen: true,
          simpleFullscreen: true,
          title: "Стих",
          backgroundColor: "#121110",
          autoHideMenuBar: true,
          titleBarStyle: "hidden",
        },
      };
    }
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        width: 1280,
        height: 800,
        title: "Стих",
        backgroundColor: "#121110",
        autoHideMenuBar: true,
        titleBarStyle: "hiddenInset",
      },
    };
  });
  await win.loadURL(origin + "/");
}

app.setName("Писание");
app.setAboutPanelOptions({
  applicationName: "Писание",
  applicationVersion: "1.0.0",
  copyright: "Синодальный перевод · общественное достояние",
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.whenReady().then(async () => {
    createMenu();
    const { port } = await startServer();
    await createMainWindow(port);
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow(port);
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

void pathToFileURL;
