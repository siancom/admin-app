const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
      logs.push(msg.text());
  });
  page.on('pageerror', err => {
      console.error('PAGE ERROR:', err.toString());
      logs.push(err.toString());
  });
  
  // Do not wait for networkidle, just wait until dom is loaded
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting for React to mount...');
  // Wait for the POS tab button to appear
  await page.waitForSelector('button', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Evaluating clicks...');
  await page.evaluate(() => {
      // Find the POS tab
      const buttons = Array.from(document.querySelectorAll('button'));
      const posBtn = buttons.find(b => b.textContent.includes('หน้าร้าน (POS)'));
      if (posBtn) posBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
      // Find the Sales History button
      const buttons = Array.from(document.querySelectorAll('button'));
      const historyBtn = buttons.find(b => b.title === 'ประวัติการขาย' || b.textContent.includes('ประวัติการขาย'));
      if (historyBtn) historyBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Done!');
  await browser.close();
})();
