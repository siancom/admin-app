const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  await page.goto('https://iris-clinic-admin.web.app/?branch=เฉวง&bed=1', { waitUntil: 'networkidle2' });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await browser.close();
})();
