/**
 * متجر شياكة للملابس الرجالي الكاجوال — خادم محلي خفيف
 * Simple Local Server for Sheyaka Men's Casual Apparel Store
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
        <html dir="rtl" style="background:#F8FAFC;color:#0F172A;font-family:sans-serif;padding:40px;text-align:center;">
          <h2>الصفحة غير موجودة (404)</h2>
          <p><a href="/" style="color:#F97316;font-weight:bold;">العودة إلى المتجر الرئيسي</a></p>
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
  console.log(`👕 متجر شياكة — أحدث صيحات الملابس الرجالي الكاجوال`);
  console.log(`======================================================`);
  console.log(`✓ المتجر الرئيسي:     http://localhost:${PORT}/index.html`);
  console.log(`✓ إتمام الطلب والـ GPS: http://localhost:${PORT}/checkout.html`);
  console.log(`✓ لوحة التحكم الشاملة: http://localhost:${PORT}/dashboard.html`);
  console.log(`======================================================\n`);
});
