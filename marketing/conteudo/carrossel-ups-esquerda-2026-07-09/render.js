const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  const htmlPath = path.join(__dirname, 'carrossel.html');
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  const slides = await page.$$('.slide');
  for (let i = 0; i < slides.length; i++) {
    const num = String(i + 1).padStart(2, '0');
    const outPath = path.join(__dirname, 'instagram', `slide-${num}.png`);
    await slides[i].screenshot({ path: outPath });
    console.log('salvo:', outPath);
  }

  await browser.close();
})();
