/**
 * دار النخبة — خادم محلي خفيف لتشغيل الموقع
 * Simple Local Static Server for Dar Al-Nukhba Luxury Menswear
 * Run: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  let filePath = path.join(__dirname, reqUrl === '/' ? 'index.html' : reqUrl);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`
        <html dir="rtl" style="background:#121212;color:#F5F5F0;font-family:sans-serif;padding:40px;text-align:center;">
          <h2>الصفحة غير موجودة (404)</h2>
          <p><a href="/" style="color:#C5A059;">العودة إلى المتجر الرئيسي</a></p>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`👑 دار النخبة — متجر الأزياء الرجالية الفاخرة`);
  console.log(`======================================================`);
  console.log(`✓ المتجر الرئيسي:     http://localhost:${PORT}/index.html`);
  console.log(`✓ صفحة إتمام الطلب:   http://localhost:${PORT}/checkout.html`);
  console.log(`✓ لوحة تحكم المبيعات: http://localhost:${PORT}/sales.html`);
  console.log(`======================================================\n`);
});
