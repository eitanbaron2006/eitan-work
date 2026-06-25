import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 }); // Big viewport
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.toString()));
  page.on('dialog', async dialog => {
    console.log('DIALOG:', dialog.message());
    await dialog.dismiss();
  });
  
  console.log('Navigating to http://localhost:3002...');
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
  
  console.log('Clicking resume tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tabBtn = buttons.find(b => b.textContent?.includes('קורות חיים') || b.textContent?.includes('Resume'));
    if (tabBtn) tabBtn.click();
    else console.log('TAB BTN NOT FOUND');
  });

  // wait a bit for animation
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Intercepting download...');
  await page.evaluate(() => {
    const originalClick = HTMLAnchorElement.prototype.click;
    window['capturedDataUrls'] = [];
    HTMLAnchorElement.prototype.click = function() {
      if (this.download && this.download.includes('.png')) {
        window['capturedDataUrls'].push({ filename: this.download, data: this.href });
        console.log('CAPTURED:', this.download);
      } else {
        originalClick.call(this);
      }
    };
  });
  
  console.log('Clicking export PNG...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.includes('PNG') || b.textContent?.includes('תמונה'));
    if (btn) btn.click();
    else console.log('PNG BTN NOT FOUND');
  });
  
  console.log('Waiting for capture...');
  await page.waitForFunction('window.capturedDataUrls && window.capturedDataUrls.length > 0', { timeout: 15000 });
  const captures = await page.evaluate(() => window['capturedDataUrls']);
  for (const cap of captures) {
    fs.writeFileSync(cap.filename, cap.data.replace(/^data:image\/png;base64,/, ''), 'base64');
  }
  await browser.close();
  console.log('DONE');
})();
