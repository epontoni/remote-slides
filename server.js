import express from "express";
import http from "http";
import { Server } from "socket.io";
import keySender from "node-key-sender";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir los archivos estáticos (interfaz web)
app.use(express.static("public"));

// Evento al conectar un cliente (celular)
io.on("connection", (socket) => {
  console.log("📱 Cliente conectado al control remoto");

  socket.on("command", async (cmd) => {
    console.log("➡️ Comando recibido:", cmd);

    switch (cmd) {
      case "next":
        await keySender.sendKey("right");
        break;
      case "prev":
        await keySender.sendKey("left");
        break;
      case "start":
        await keySender.sendCombination(["control", "f5"]); // Google Slides start presentation
        //await keySender.sendKey("f5");
        break;
      case "end":
        await keySender.sendKey("escape");
        break;
      default:
        console.log("⚠️ Comando no reconocido:", cmd);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado");
  });
});

// Iniciar el servidor en puerto 3000
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
  console.log("📡 Asegúrate de estar en la misma red WiFi que tu celular");
});

// Endpoint que devuelve un PNG con el QR del contenido de tunnel_url.txt
// QR endpoint removed per user request