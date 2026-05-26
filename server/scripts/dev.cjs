const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "../..");
const nodeBin = process.execPath;
const viteBin = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
const backendPort = Number(process.env.PORT || 3001);

const processes = [];
let isShuttingDown = false;

function startProcess(name, args) {
  const child = spawn(nodeBin, args, {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit",
  });

  processes.push(child);

  child.on("error", (error) => {
    if (isShuttingDown) return;

    console.error(`[dev] ${name} failed to start: ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (isShuttingDown) return;

    const reason = signal || code || 0;
    console.log(`[dev] ${name} stopped (${reason}).`);
    shutdown(typeof code === "number" ? code : 1);
  });

  return child;
}

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;

  isShuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }

  setTimeout(() => process.exit(exitCode), 100);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.setTimeout(750, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function main() {
  if (await isPortOpen(backendPort)) {
    console.log(
      `[dev] backend already responds on http://localhost:${backendPort}; using it for Vite proxy.`
    );
  } else {
    startProcess("server", ["server/index.cjs"]);
  }

  startProcess("vite", [viteBin, "--host", "0.0.0.0"]);
}

main().catch((error) => {
  console.error(`[dev] failed to start: ${error.message}`);
  shutdown(1);
});
