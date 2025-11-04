// monitor-cloudflared.mjs
import { spawn, exec } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";
import QRCode from "qrcode";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_PATH = path.join(__dirname, "cloudflared.log");
const QR_PATH = path.join(__dirname, "qrcode.png");

function appendLog(line) {
  const ts = new Date().toISOString();
  fs.appendFile(LOG_PATH, `${ts} ${line}\n`, (err) => {
    if (err) console.error("Error escribiendo log:", err);
  });
}

// Lanzar server.js
// Si en package.json tenés un script "server": "node server.js"
const child = spawn("npm", ["run", "server"], {
  stdio: "inherit", // heredamos stdin/stdout/stderr
  shell: true, // en Windows suele ayudar
});

child.on("exit", (code, signal) => {
  console.log(`server process exited code=${code} signal=${signal}`);
});
child.on("error", (err) => {
  console.error("Error al iniciar el server:", err);
});

// -------------------------------------------------------------

// Regex para URL que termina en trycloudflare.com (captura subdominios complejos)
const TRY_CLOUDFLARE_URL_REGEX =
  /https?:\/\/[^\s'")<>]*trycloudflare\.com[^\s'")<>]*/i;

// Frase indicadora que anticipa la URL (puede estar en la misma línea o en la siguiente)
const TUNNEL_CREATED_PHRASE = "Your quick Tunnel has been created! Visit it at";

let urlFound = null;
let urlDetectedAt = null;
let awaitingVisitPhrase = false; // estado: vimos la frase y ahora buscamos URL

// Lanzar cloudflared
const proc = spawn(
  "cloudflared",
  ["tunnel", "--url", "http://localhost:3000"],
  {
    shell: false, // si da problemas en Windows, probar shell: true
  }
);

// Mostrar salida en consola
proc.stdout.pipe(process.stdout);
proc.stderr.pipe(process.stderr);

// Guardar log
const outLogStream = fs.createWriteStream(LOG_PATH, { flags: "a" });
proc.stdout.pipe(outLogStream, { end: false });
proc.stderr.pipe(outLogStream, { end: false });

// Lectura línea a línea de stdout y stderr
const streams = [proc.stdout, proc.stderr];

for (const stream of streams) {
  const rl = readline.createInterface({ input: stream });
  rl.on("line", (line) => {
    appendLog(line);
    processLine(line);
  });
  rl.on("close", () => appendLog("[STREAM CLOSED]"));
}

function processLine(line) {
  // 1) Si la línea contiene la frase indicadora, activamos el estado
  if (!urlFound && line.includes(TUNNEL_CREATED_PHRASE)) {
    awaitingVisitPhrase = true;
    appendLog("[STATE] Frase detectada, buscando URL trycloudflare.com...");
    // Puede contener la URL en la misma línea, así que seguimos y tratamos de extraerla
  }

  // 2) Intentamos extraer la URL trycloudflare.com en cualquier caso
  if (!urlFound) {
    const m = line.match(TRY_CLOUDFLARE_URL_REGEX);
    if (m && m[0]) {
      const candidate = sanitizeUrl(m[0]);
      if (isValidUrl(candidate)) {
        // Si habíamos detectado la frase o la URL aparece sola, la aceptamos
        if (awaitingVisitPhrase || line.includes("trycloudflare.com")) {
          urlFound = candidate;
          urlDetectedAt = new Date().toISOString();
          console.log("\n=== 🌐 URL pública detectada ===");
          console.log(urlFound);
          appendLog(`[URL DETECTADA] ${urlFound} (linea: ${line})`);
          onUrlDetected(urlFound);
        }
      }
    }
  }

  // 3) Si la frase quedó activada pero ya pasaron varias líneas sin URL,
  //    podés decidir desactivar el flag o mantenerlo. Aquí lo mantenemos hasta detectar URL.
}

// Limpia paréntesis o caracteres terminales comunes
function sanitizeUrl(raw) {
  return raw.replace(/[),.]+$/, "").trim();
}

function isValidUrl(u) {
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function onUrlDetected(url) {
  try {
    // Generar QR PNG
    await QRCode.toFile(QR_PATH, url, { margin: 2, width: 300 });
    console.log(`QR guardado en: ${QR_PATH}`);
    appendLog(`[QR GENERADO] ${QR_PATH}`);

    // Mostrar QR en terminal (ASCII)
    const ascii = await QRCode.toString(url, { type: "terminal" });
    console.log("\n" + ascii + "\n");

    // Abrir automáticamente el QR
    if (process.platform === "win32") {
      exec(`start "" "${QR_PATH}"`);
    } else if (process.platform === "darwin") {
      exec(`open "${QR_PATH}"`);
    } else {
      exec(`xdg-open "${QR_PATH}"`);
    }
  } catch (err) {
    console.error("Error generando QR:", err);
    appendLog(`[ERROR QR] ${err.message}`);
  }
}

proc.on("close", (code, signal) => {
  console.log(`cloudflared finalizó. código=${code} signal=${signal}`);
  appendLog(`[PROCESS CLOSED] code=${code} signal=${signal}`);
});

proc.on("error", (err) => {
  console.error("Error al iniciar cloudflared:", err);
  appendLog(`[PROCESS ERROR] ${err.message}`);
});
