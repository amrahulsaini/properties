const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("propertySuiteDesktop", {
  platform: process.platform,
  runtime: "electron",
});
