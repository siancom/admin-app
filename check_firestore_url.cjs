const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('request', request => {
    if (request.url().includes('firestore.googleapis.com')) {
      console.log('FIRESTORE REQUEST URL:', request.url());
    }
  });
  
  await page.goto('http://localhost:4173/?branch=เฉวง&bed=1', { waitUntil: 'networkidle2' });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
})();
