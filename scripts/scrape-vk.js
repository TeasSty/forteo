#!/usr/bin/env node
/**
 * Обновление каталога из VK market-173630729
 * Запуск: node scripts/scrape-vk.js
 * Требует: npm install playwright && npx playwright install chromium
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../js/products.json');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) || 'item';
}

function parsePrice(text) {
  const n = parseInt(text.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function mapCategory(name) {
  const n = name.toLowerCase();
  if (/стул|стол|обеден/i.test(n)) return 'tables-chairs';
  if (/кухн/i.test(n)) return 'kitchen';
  if (/спальн/i.test(n)) return 'bedroom';
  if (/гостин|стенк/i.test(n)) return 'living';
  if (/шкаф|гардероб/i.test(n)) return 'wardrobe';
  if (/мягк|диван|кресл/i.test(n)) return 'soft';
  if (/детск/i.test(n)) return 'children';
  if (/прихож/i.test(n)) return 'hallway';
  return 'other';
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
  });

  const products = [];
  const seen = new Set();

  await page.goto('https://vk.ru/market-173630729', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);

  let prevCount = 0;
  let stale = 0;

  for (let i = 0; i < 80; i++) {
    const batch = await page.$$eval('img[alt]', imgs =>
      imgs.map(img => ({ name: img.alt.trim(), src: img.src }))
        .filter(x => x.name && x.name.length > 3 && !x.name.includes('Форт'))
    );

    const textLines = (await page.innerText('body')).split('\n').map(l => l.trim());
    for (let j = 0; j < textLines.length - 1; j++) {
      if (/^\d[\d\s]*₽$/.test(textLines[j].replace(/\u00a0/g, ' '))) {
        const price = parsePrice(textLines[j]);
        const name = textLines[j + 1];
        if (name && price && !seen.has(name)) {
          seen.add(name);
          const imgEl = batch.find(b => b.name === name);
          products.push({
            id: slugify(name) + '-' + products.length,
            name,
            price,
            priceFormatted: price.toLocaleString('ru-RU') + ' ₽',
            category: mapCategory(name),
            image: imgEl?.src || null,
            inStock: true,
            vkLink: 'https://vk.ru/market-173630729',
          });
        }
      }
    }

    await page.mouse.wheel(0, 2500);
    await page.waitForTimeout(1200);

    if (products.length === prevCount) {
      if (++stale >= 8) break;
    } else {
      stale = 0;
      prevCount = products.length;
    }
  }

  const output = {
    updatedAt: new Date().toISOString(),
    source: 'https://vk.ru/market-173630729',
    totalInVk: 745,
    products,
  };

  fs.writeFileSync(OUT, JSON.stringify(output));
  console.log(`Saved ${products.length} products to ${OUT}`);
  await browser.close();
})();
