import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  
  // Wait 2 seconds for React to mount and errors to bubble
  await new Promise(r => setTimeout(r, 2000));
  
  const viteError = await page.evaluate(() => {
    const overlay = document.querySelector('vite-error-overlay');
    return overlay ? overlay.shadowRoot.innerHTML : 'NO VITE ERROR';
  }).catch(e => 'ERROR: ' + e.message);
  
  console.log('--- VITE ERROR ---');
  console.log(viteError.substring(0, 500));
  
  await browser.close();
})();
