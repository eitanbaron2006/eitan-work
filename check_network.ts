import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('requestfailed', request => {
    console.log('FAILED:', request.url(), request.failure()?.errorText);
  });
  page.on('response', response => {
    if (!response.ok()) {
      console.log('NOT OK:', response.url(), response.status());
    }
  });
  page.on('pageerror', err => console.log('ERR:', err.toString()));
  
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
  await browser.close();
})();
