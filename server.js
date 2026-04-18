const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { URL } = require('url');

const PORT = 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.md': 'text/plain; charset=utf-8',
};

// Fetch with redirect following (up to 5)
function fetchUrl(targetUrl, maxRedirects, callback) {
  if (maxRedirects <= 0) return callback(new Error('Too many redirects'));

  const parsed = new URL(targetUrl);
  const mod = parsed.protocol === 'https:' ? https : http;

  const reqOpts = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
    },
  };

  const req = mod.request(reqOpts, (proxyRes) => {
    if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
      let redirectUrl = proxyRes.headers.location;
      if (redirectUrl.startsWith('/')) {
        redirectUrl = parsed.origin + redirectUrl;
      } else if (!redirectUrl.startsWith('http')) {
        redirectUrl = parsed.origin + '/' + redirectUrl;
      }
      proxyRes.resume();
      return fetchUrl(redirectUrl, maxRedirects - 1, callback);
    }
    callback(null, proxyRes, targetUrl);
  });

  req.on('error', (err) => callback(err));
  req.setTimeout(15000, () => { req.destroy(); callback(new Error('Timeout')); });
  req.end();
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // ---- CORS headers ----
  res.setHeader('Access-Control-Allow-Origin', '*');

  // ---- Proxy endpoint ----
  if (parsed.pathname === '/proxy') {
    const targetUrl = parsed.query.url;
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Missing url param');
    }

    fetchUrl(targetUrl, 5, (err, proxyRes, finalUrl) => {
      if (err) {
        res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(`<html><body style="font-family:sans-serif;padding:40px;color:#666"><h2>⚠️ 无法加载</h2><p>${err.message}</p><p style="font-size:12px;color:#999">${targetUrl}</p></body></html>`);
      }

      // Remove blocking headers
      const headers = {};
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        const lk = k.toLowerCase();
        if (['x-frame-options', 'content-security-policy', 'content-security-policy-report-only'].includes(lk)) continue;
        if (lk === 'content-encoding') continue; // we request identity
        headers[k] = v;
      }

      const contentType = (headers['content-type'] || '').toLowerCase();

      if (contentType.includes('text/html')) {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', () => {
          let body = Buffer.concat(chunks).toString('utf-8');

          // Inject base tag for relative resources
          try {
            const baseOrigin = new URL(finalUrl).origin;
            const baseTag = `<base href="${baseOrigin}/">`;
            if (body.includes('<head')) {
              body = body.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
            } else {
              body = baseTag + body;
            }
          } catch (e) { }

          delete headers['content-length'];
          delete headers['transfer-encoding'];
          res.writeHead(proxyRes.statusCode || 200, headers);
          res.end(body);
        });
        proxyRes.on('error', () => {
          res.writeHead(502);
          res.end('Stream error');
        });
      } else {
        res.writeHead(proxyRes.statusCode || 200, headers);
        proxyRes.pipe(res);
      }
    });
    return;
  }

  // ---- Static files ----
  let filePath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  filePath = path.join(__dirname, decodeURIComponent(filePath));

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found: ' + parsed.pathname);
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  ✅ 对比工具已启动: http://localhost:${PORT}`);
  console.log(`  📱 打开浏览器访问上面的地址即可使用`);
  console.log(`  🔄 修改 result.md 后刷新浏览器即可更新数据\n`);
});
