const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("pisanieDesktop", {
  platform: "darwin",
});
