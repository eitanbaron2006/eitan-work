import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1200, height: 1600 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'react-live.png' });
  
  await browser.close();
  console.log('Done.');
})();
