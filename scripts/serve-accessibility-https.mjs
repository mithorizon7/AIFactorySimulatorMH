// Local test harness only: preserve production upgrade-insecure-requests while
// allowing WebKit to load the exact production build through a loopback TLS edge.
import { createServer } from "node:https";
import { request } from "node:http";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const port = Number(process.env.LOCAL_HTTPS_PORT ?? 5014);
const backendPort = Number(process.env.LOCAL_BACKEND_PORT ?? 5015);
const certificates = mkdtempSync(path.join(tmpdir(), "aifactory-local-tls-"));
const key = path.join(certificates, "key.pem");
const cert = path.join(certificates, "cert.pem");
execFileSync(
  "openssl",
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    key,
    "-out",
    cert,
    "-subj",
    "/CN=localhost",
    "-addext",
    "subjectAltName=DNS:localhost,IP:127.0.0.1",
    "-days",
    "1",
  ],
  { stdio: "ignore", timeout: 15000 },
);
const backend = spawn(process.execPath, ["dist/index.js"], {
  env: { ...process.env, PORT: String(backendPort), NODE_ENV: "production" },
  stdio: "inherit",
});
const server = createServer(
  {
    key: readFileSync(key),
    cert: readFileSync(cert),
  },
  (incoming, outgoing) => {
    const upstream = request(
      {
        hostname: "127.0.0.1",
        port: backendPort,
        path: incoming.url,
        method: incoming.method,
        headers: incoming.headers,
      },
      (response) => {
        outgoing.writeHead(response.statusCode ?? 502, response.headers);
        response.pipe(outgoing);
      },
    );
    upstream.on("error", () => {
      outgoing.writeHead(502);
      outgoing.end("Local test backend unavailable");
    });
    incoming.pipe(upstream);
  },
);
const close = () => {
  backend.kill("SIGTERM");
  rmSync(certificates, { recursive: true, force: true });
  server.close(() => process.exit(0));
};
process.on("SIGTERM", close);
process.on("SIGINT", close);
backend.on("exit", (code) => {
  if (code) {
    server.close();
    process.exitCode = code;
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    JSON.stringify({ localTestHttps: port, productionBackend: backendPort }),
  ),
);
