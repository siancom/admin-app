const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  
  await page.waitForSelector('button', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const posBtn = buttons.find(b => b.textContent.includes('หน้าร้าน (POS)'));
      if (posBtn) posBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const historyBtn = buttons.find(b => b.title === 'ประวัติการขาย' || b.textContent.includes('ประวัติการขาย'));
      if (historyBtn) historyBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  await page.screenshot({ path: '/Users/ittichai/.gemini/antigravity-ide/brain/fe8dc008-0a39-4fba-9cb6-f55ef8614267/artifacts/modal-test.png' });
  
  console.log('Screenshot saved!');
  await browser.close();
})();
