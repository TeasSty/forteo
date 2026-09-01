#!/usr/bin/env node
/**
 * Скачивает и улучшает превью товаров из VK → assets/products/
 * Запуск: npm install sharp && node scripts/download-images.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PRODUCTS = path.join(__dirname, '../js/products.json');
const OUT_DIR = path.join(__dirname, '../assets/products');
const CONCURRENCY = 6;
const TARGET_W = 480;
const TARGET_H = 576;

let sharp;
try { sharp = require('sharp'); } catch {
  console.error('Install sharp: npm install sharp');
  process.exit(1);
}

function download(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        Referer: 'https://vk.ru/',
      },
    }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function safeName(id) {
  return id.replace(/[^a-z0-9а-яё_-]/gi, '_').slice(0, 80);
}

function bestSourceUrl(product) {
  return product.imageHd || product.image;
}

async function processProduct(product) {
  const src = bestSourceUrl(product);
  if (!src) return product;

  const filename = safeName(product.id) + '.webp';
  const outPath = path.join(OUT_DIR, filename);
  const relPath = 'assets/products/' + filename;

  if (fs.existsSync(outPath)) {
    return { ...product, imageLocal: relPath };
  }

  try {
    const buf = await download(src);
    await sharp(buf)
      .resize(TARGET_W, TARGET_H, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        kernel: sharp.kernel.lanczos3,
      })
      .sharpen({ sigma: 0.8, m1: 0.5, m2: 0.3 })
      .webp({ quality: 86, effort: 4 })
      .toFile(outPath);

    return { ...product, imageLocal: relPath };
  } catch (e) {
    console.warn('Skip', product.name?.slice(0, 40), e.message);
    return product;
  }
}

async function pool(items, fn, n) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
      if (idx % 25 === 0) process.stdout.write(`\r${idx}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const data = JSON.parse(fs.readFileSync(PRODUCTS, 'utf8'));
  const withImages = data.products.filter(p => bestSourceUrl(p));
  console.log(`Processing ${withImages.length} images → ${TARGET_W}x${TARGET_H} webp...`);

  const updated = await pool(withImages, processProduct, CONCURRENCY);
  const map = Object.fromEntries(updated.map(p => [p.id, p]));

  data.products = data.products.map(p => map[p.id] || p);
  data.imagesDownloadedAt = new Date().toISOString();
  fs.writeFileSync(PRODUCTS, JSON.stringify(data));

  const local = data.products.filter(p => p.imageLocal).length;
  console.log(`\nDone. Local images: ${local}/${withImages.length}`);
})();
