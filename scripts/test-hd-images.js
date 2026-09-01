#!/usr/bin/env node
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    locale: 'ru-RU',
  });

  const captured = [];
  page.on('response', r => {
    const u = r.url();
    if ((u.includes('userapi') || u.includes('vkuserphoto')) && u.includes('image')) {
      captured.push(u);
    }
    if ((u.includes('userapi') || u.includes('vkuserphoto')) && (u.includes('.jpg') || u.includes('.webp'))) {
      const ct = r.headers()['content-type'] || '';
      if (ct.includes('image')) captured.push(u);
    }
  });

  // Try mobile VK
  await page.goto('https://m.vk.com/market-173630729', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);

  const links = await page.locator('a[href*="product"]').count();
  const imgs = await page.$$eval('img', els => els.slice(0,5).map(i => ({alt: i.alt, src: i.src})));
  console.log('mobile links:', links);
  console.log('imgs:', JSON.stringify(imgs, null, 2));
  console.log('captured:', captured.length);

  await browser.close();
})();
