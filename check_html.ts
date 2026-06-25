import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
  const html = await page.content();
  console.log(html);
  
  await browser.close();
})();
