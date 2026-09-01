#!/usr/bin/env node
/**
 * Upgrade product images to HD by scraping VK market product pages.
 * Run: node scripts/upgrade-images.js [--limit N] [--dry-run]
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PRODUCTS_FILE = path.join(__dirname, '../js/products.json');
const IMAGES_DIR = path.join(__dirname, '../assets/products');
const PROGRESS_FILE = path.join(__dirname, '../.image-upgrade-progress.json');

const args = process.argv.slice(2);
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
const dryRun = args.includes('--dry-run');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function pickBestImage(urls) {
  // Prefer impg URLs, then vkuserphoto with cs= param, largest size
  const scored = urls
    .filter(u => !u.includes('ava=1') && !u.includes('avatar'))
    .map(u => {
      let score = 0;
      if (u.includes('/impg/')) score += 1000;
      if (u.includes('vkuserphoto')) score += 500;
      const sizeMatch = u.match(/size=(\d+)x(\d+)/);
      if (sizeMatch) score += parseInt(sizeMatch[1], 10) * parseInt(sizeMatch[2], 10);
      const asMatch = u.match(/as=[^&]*?(\d+)x(\d+)/g);
      if (asMatch) {
        const last = asMatch[asMatch.length - 1].match(/(\d+)x(\d+)/);
        if (last) score += parseInt(last[1], 10) * parseInt(last[2], 10);
      }
      const csMatch = u.match(/cs=(\d+)x/);
      if (csMatch) score += parseInt(csMatch[1], 10) * 100;
      if (u.includes('quality=9')) score += 50;
      return { url: u, score };
    });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.url || null;
}

function upgradeUrl(url) {
  if (!url) return null;
  // Try upgrading vkuserphoto s/v1/ig2 URLs to larger cs
  if (url.includes('vkuserphoto.ru/s/v1/ig2/') && url.includes('&as=')) {
    return url.replace(/cs=\d+x\d*/, 'cs=1080x0');
  }
  // Try upgrading impg size
  if (url.includes('/impg/') && url.includes('size=')) {
    return url.replace(/size=\d+x\d+/, 'size=960x1160');
  }
  return url;
}

async function scrapeMarketProducts(page) {
  const products = [];
  const seen = new Set();

  await page.goto('https://vk.ru/market-173630729', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(6000);

  let stale = 0;
  let prevCount = 0;

  for (let i = 0; i < 100; i++) {
    const items = await page.$$eval('a[href*="/market/product/"]', links =>
      links.map(a => ({
        href: a.href.split('?')[0],
        name: a.getAttribute('aria-label') || a.querySelector('img')?.alt || '',
        thumb: a.querySelector('img')?.src || '',
      })).filter(x => x.href && x.name)
    );

    for (const item of items) {
      const key = item.href;
      if (!seen.has(key)) {
        seen.add(key);
        products.push(item);
      }
    }

    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(1500);

    if (products.length === prevCount) {
      if (++stale >= 10) break;
    } else {
      stale = 0;
      prevCount = products.length;
    }
  }

  return products;
}

async function getProductHdImage(page, productUrl) {
  const captured = new Set();

  const handler = (resp) => {
    const url = resp.url();
    if ((url.includes('userapi') || url.includes('vkuserphoto')) &&
        (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.webp') || url.includes('.png'))) {
      const ct = resp.headers()['content-type'] || '';
      if (ct.includes('image') && !url.includes('ava=1')) {
        captured.add(url);
      }
    }
  };

  page.on('response', handler);
  try {
    await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Click main photo to open gallery if available
    const photoEl = await page.$('.MarketItemPhoto img, [class*="MarketItem"] img, .photos_page_block img');
    if (photoEl) {
      await photoEl.click().catch(() => {});
      await page.waitForTimeout(2000);
    }

    const domImgs = await page.$$eval('img', imgs =>
      imgs.map(i => i.src).filter(s =>
        (s.includes('userapi') || s.includes('vkuserphoto')) &&
        !s.includes('ava=1') && !s.includes('avatar')
      )
    );
    domImgs.forEach(u => captured.add(u));

    const urls = [...captured];
    let best = pickBestImage(urls);
    best = upgradeUrl(best);
    return best;
  } finally {
    page.off('response', handler);
  }
}

function downloadFile(url, dest, referer = 'https://vk.ru/') {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, { headers: { Referer: referer, 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest, referer).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', reject);
  });
}

(async () => {
  const data = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  let progress = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }

  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  console.log('Scraping VK market product links...');
  const vkProducts = await scrapeMarketProducts(page);
  console.log(`Found ${vkProducts.length} VK product links`);

  // Build name -> vk link map
  const nameToVk = new Map();
  for (const vp of vkProducts) {
    const name = vp.name.trim();
    if (name) nameToVk.set(name, { href: vp.href, thumb: vp.thumb });
  }

  let updated = 0;
  let downloaded = 0;
  const toProcess = data.products.slice(0, limit === Infinity ? undefined : limit);

  for (let i = 0; i < toProcess.length; i++) {
    const product = toProcess[i];
    if (progress[product.id]?.hd) {
      product.image = progress[product.id].hd;
      product.imageHd = progress[product.id].hd;
      if (progress[product.id].local) product.imageLocal = progress[product.id].local;
      continue;
    }

    const vk = nameToVk.get(product.name);
    if (!vk) {
      console.log(`[${i + 1}/${toProcess.length}] No VK link: ${product.name}`);
      continue;
    }

    product.vkLink = vk.href;

    try {
      let hdUrl = vk.thumb ? upgradeUrl(vk.thumb) : null;
      if (!hdUrl || hdUrl.includes('size=150x180')) {
        console.log(`[${i + 1}/${toProcess.length}] Fetching HD: ${product.name}`);
        hdUrl = await getProductHdImage(page, vk.href);
      }

      if (hdUrl) {
        product.imageHd = hdUrl;
        product.image = hdUrl;
        updated++;

        if (!dryRun) {
          const ext = hdUrl.includes('.webp') ? 'webp' : 'jpg';
          const localPath = `assets/products/${product.id}.${ext}`;
          const dest = path.join(__dirname, '..', localPath);
          try {
            await downloadFile(hdUrl, dest);
            product.imageLocal = localPath;
            downloaded++;
          } catch (e) {
            console.log(`  Download failed: ${e.message}, using hotlink`);
          }
        }

        progress[product.id] = { hd: hdUrl, local: product.imageLocal || null };
        if (i % 10 === 0) {
          fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
          fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data));
        }
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }

    await page.waitForTimeout(500);
  }

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
  data.updatedAt = new Date().toISOString();
  if (!dryRun) fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data));

  console.log(`\nDone: ${updated} HD URLs, ${downloaded} downloaded locally`);
  await browser.close();
})();
