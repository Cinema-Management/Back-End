const os = require("os");
function getWiFiIPv4Address() {
    const interfaces = os.networkInterfaces();
    const wifiInterface = interfaces['Wi-Fi']; // Tên adapter Wi-Fi
  
    if (wifiInterface) {
      for (const iface of wifiInterface) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  
    throw new Error("Couldn't find Wi-Fi IPv4 address");
  }

module.exports = { getWiFiIPv4Address };