const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('https://clinic-admin.web.app/?branch=เฉวง&bed=1', { waitUntil: 'networkidle2' });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const debugText = await page.evaluate(() => {
    const el = document.querySelector('p.text-indigo-100');
    return el ? el.textContent : null;
  });
  
  console.log("Debug text:", debugText);
  
  await browser.close();
})();
