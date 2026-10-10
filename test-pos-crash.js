import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  
  try {
    await new Promise(r => setTimeout(r, 2000));
    // Click POS tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, div'));
      const posBtn = buttons.find(b => b.textContent && b.textContent.includes('หน้าร้าน (POS)'));
      if (posBtn) posBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    const rootHtml = await page.$eval('#root', el => el.innerHTML).catch(() => 'NO ROOT ELEMENT');
    console.log('--- ROOT HTML LENGTH AFTER CLICK ---', rootHtml.length);
  } catch(e) {
    console.log('ERROR CLICKING POS:', e.message);
  }
  
  await browser.close();
})();
