const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  
  console.log('Clicking POS tab...');
  const posTab = await page.$('button:has-text("หน้าร้าน (POS)")');
  if (posTab) await posTab.click();
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Clicking Sales History button...');
  // The button has title="ประวัติการขาย"
  const historyBtn = await page.$('button[title="ประวัติการขาย"]');
  if (historyBtn) {
      await historyBtn.click();
      console.log('Clicked! Waiting for modal...');
      await new Promise(r => setTimeout(r, 2000));
  } else {
      console.log('Sales History button not found!');
  }

  await browser.close();
})();
