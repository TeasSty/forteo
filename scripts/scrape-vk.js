#!/usr/bin/env node
/**
 * Обновление каталога из VK market-173630729 с HD-изображениями
 * Запуск: node scripts/scrape-vk.js [--hd]
 * Требует: npm install playwright && npx playwright install chromium
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../js/products.json');
const withHd = process.argv.includes('--hd');

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

function pickBestUrl(urls) {
  const scored = urls
    .filter(u => u && !u.includes('ava=1') && !u.includes('avatar'))
    .map(u => {
      let score = 0;
      if (u.includes('/impg/')) score += 50000;
      if (u.includes('vkuserphoto')) score += 10000;
      const sizeM = u.match(/size=(\d+)x(\d+)/);
      if (sizeM) score += parseInt(sizeM[1], 10) * parseInt(sizeM[2], 10);
      const asParts = u.match(/(\d+)x(\d+)/g);
      if (asParts) {
        const last = asParts[asParts.length - 1].split('x').map(Number);
        score += last[0] * last[1];
      }
      const csM = u.match(/cs=(\d+)/);
      if (csM) score += parseInt(csM[1], 10) * 100;
      if (!u.includes('150x180')) score += 5000;
      return { url: u, score };
    });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.url || null;
}

function upgradeThumbUrl(url) {
  if (!url) return url;
  if (url.includes('vkuserphoto.ru/s/v1/ig2/') && url.includes('&as=')) {
    return url.replace(/cs=\d+x\d*/, 'cs=1080x0');
  }
  if (url.includes('/impg/') && url.includes('size=')) {
    return url.replace(/size=\d+x\d+/, 'size=960x1160');
  }
  return url;
}

async function fetchHdFromProduct(page, productUrl) {
  const captured = new Set();
  const handler = (resp) => {
    const u = resp.url();
    if ((u.includes('userapi') || u.includes('vkuserphoto')) &&
        /\.(jpg|jpeg|webp|png)/i.test(u)) {
      const ct = resp.headers()['content-type'] || '';
      if (ct.includes('image') && !u.includes('ava=1')) captured.add(u);
    }
  };
  page.on('response', handler);
  try {
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
    const domUrls = await page.$$eval('img', imgs =>
      imgs.map(i => i.src).filter(s =>
        (s.includes('userapi') || s.includes('vkuserphoto')) && !s.includes('ava=1')
      )
    );
    domUrls.forEach(u => captured.add(u));
    let best = pickBestUrl([...captured]);
    return upgradeThumbUrl(best);
  } finally {
    page.off('response', handler);
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
    locale: 'ru-RU',
    extraHTTPHeaders: { 'Accept-Language': 'ru-RU,ru;q=0.9' },
  });
  const page = await context.newPage();

  const products = [];
  const seen = new Set();
  const linkMap = new Map();

  console.log('Loading VK market...');
  await page.goto('https://vk.ru/market-173630729', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);

  let prevCount = 0;
  let stale = 0;

  for (let i = 0; i < 80; i++) {
    const items = await page.$$eval('a[href*="/market/product/"]', links =>
      links.map(a => {
        const img = a.querySelector('img');
        return {
          href: a.href.split('?')[0],
          name: img?.alt?.trim() || a.getAttribute('aria-label')?.trim() || '',
          thumb: img?.src || '',
        };
      }).filter(x => x.name && x.name.length > 3)
    );

    for (const item of items) {
      if (!linkMap.has(item.name)) {
        linkMap.set(item.name, { href: item.href, thumb: upgradeThumbUrl(item.thumb) });
      }
    }

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
          const link = linkMap.get(name);
          const thumb = upgradeThumbUrl(imgEl?.src || link?.thumb || null);
          products.push({
            id: slugify(name) + '-' + products.length,
            name,
            price,
            priceFormatted: price.toLocaleString('ru-RU') + ' ₽',
            category: mapCategory(name),
            collection: null,
            image: thumb,
            imageHd: thumb,
            vkLink: link?.href || 'https://vk.ru/market-173630729',
            inStock: true,
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
      process.stdout.write(`\rScrolled: ${products.length} products...`);
    }
  }

  console.log(`\nScraped ${products.length} products from listing`);

  if (withHd && products.length > 0) {
    console.log('Fetching HD images from product pages (this may take a while)...');
    let hdCount = 0;
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.vkLink || p.vkLink === 'https://vk.ru/market-173630729') continue;
      if (p.image && !p.image.includes('150x180')) continue;

      try {
        const hd = await fetchHdFromProduct(page, p.vkLink);
        if (hd && hd !== p.image) {
          p.imageHd = hd;
          p.image = hd;
          hdCount++;
        }
        if (i % 20 === 0) process.stdout.write(`\rHD: ${i + 1}/${products.length} (${hdCount} upgraded)`);
        await page.waitForTimeout(800);
      } catch (e) {
        // keep thumbnail
      }
    }
    console.log(`\nHD upgrade: ${hdCount} images`);
  }

  if (products.length === 0) {
    console.error('ERROR: 0 products scraped — keeping existing products.json');
    await browser.close();
    process.exit(1);
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
