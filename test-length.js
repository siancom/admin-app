import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  
  const root1 = await page.$eval('#root', el => el.innerHTML);
  console.log('BEFORE CLICK LENGTH:', root1.length);
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a, div'));
    const posBtn = buttons.find(b => b.textContent && b.textContent.includes('หน้าร้าน (POS)'));
    if (posBtn) posBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  const root2 = await page.$eval('#root', el => el.innerHTML);
  console.log('AFTER CLICK LENGTH:', root2.length);
  
  if (root2.length < 5000) {
      console.log('DUMPING HTML:', root2);
  }
  
  await browser.close();
})();
