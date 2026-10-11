import { spawn } from "node:child_process";
import { openSync, closeSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
if (!existsSync(root + "dist/index.html"))
  throw new Error("Build first: npm run build");
const url = "http://127.0.0.1:5186/";
let existingPage = null;
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
  existingPage = await response.text();
} catch {}
if (existingPage !== null) {
  if (!existingPage.includes("Neon Harbor"))
    throw new Error(
      "Port 5186 belongs to another service. Inspect it before starting.",
    );
  console.log(`Neon Harbor is already serving at ${url}`);
  process.exit(0);
}
const log = "/tmp/neon-harbor-5186.log",
  fd = openSync(log, "a");
const child = spawn(
  process.execPath,
  [
    root + "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "5186",
    "--strictPort",
  ],
  { cwd: root, detached: true, stdio: ["ignore", fd, fd] },
);
closeSync(fd);
child.unref();
for (let i = 0; i < 20; i++) {
  await new Promise((resolve) => setTimeout(resolve, 150));
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) }),
      body = await response.text();
    if (response.ok && body.includes("Neon Harbor")) {
      console.log(
        `Neon Harbor: ${url}\nSession process: ${child.pid}\nLog: ${log}\nStop: kill ${child.pid}\nNo boot or login startup is configured.`,
      );
      process.exit(0);
    }
  } catch {}
}
throw new Error(`Server did not start; inspect ${log}.`);
