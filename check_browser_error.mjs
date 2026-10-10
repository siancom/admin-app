import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log(`[Browser Error] ${err.toString()}`);
  });
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 }).catch(e => console.log(e.message));
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
