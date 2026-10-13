// Transparent HTTP and WebSocket reverse proxy from port 5173 to 5174
const http = require('node:http');
const net = require('node:net');

const TARGET_PORT = 5174;
const PROXY_PORT = 5173;

const server = http.createServer((req, res) => {
  const headers = { ...req.headers };
  // Preserve host header or adjust as needed
  headers.host = `localhost:${TARGET_PORT}`;

  const options = {
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy 5173->5174] Error:', err.message);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway: Dev server on port 5174 not responding.');
  });

  req.pipe(proxyReq, { end: true });
});

// WebSocket support for Vite HMR
server.on('upgrade', (req, clientSocket, head) => {
  const targetSocket = net.connect(TARGET_PORT, '127.0.0.1', () => {
    clientSocket.write('HTTP/1.1 101 Switching Protocols\r\n');
    // Forward the upgrade headers
    let rawRequest = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const key = req.rawHeaders[i];
      const val = req.rawHeaders[i + 1];
      rawRequest += `${key}: ${val}\r\n`;
    }
    rawRequest += '\r\n';
    
    targetSocket.write(rawRequest);
    if (head && head.length > 0) {
      targetSocket.write(head);
    }

    clientSocket.pipe(targetSocket);
    targetSocket.pipe(clientSocket);
  });

  targetSocket.on('error', (err) => {
    console.error('[WS Proxy 5173->5174] Error:', err.message);
    clientSocket.destroy();
  });

  clientSocket.on('error', () => {
    targetSocket.destroy();
  });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`[Proxy] Successfully listening on http://localhost:${PROXY_PORT} -> http://localhost:${TARGET_PORT}`);
});
