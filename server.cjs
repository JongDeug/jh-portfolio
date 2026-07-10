// jh 이력서 정적 서버 — /jh prefix 하에 dist/ 서빙 (nginx proxy_pass 대상)
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, 'dist')
const PORT = process.env.PORT || 8093
const PREFIX = '/jh'
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
}

http
  .createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0])
    if (p.startsWith(PREFIX)) p = p.slice(PREFIX.length)
    if (p === '' || p === '/') p = '/index.html'
    let file = path.join(ROOT, p)
    if (!file.startsWith(ROOT)) {
      res.writeHead(403)
      return res.end('forbidden')
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        // SPA fallback → index.html
        fs.readFile(path.join(ROOT, 'index.html'), (e2, idx) => {
          if (e2) {
            res.writeHead(404)
            return res.end('not found')
          }
          res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
          res.end(idx)
        })
        return
      }
      res.writeHead(200, {
        'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
        'cache-control': 'public, max-age=3600',
      })
      res.end(data)
    })
  })
  .listen(PORT, '127.0.0.1', () => console.log(`jh resume server on 127.0.0.1:${PORT}`))
