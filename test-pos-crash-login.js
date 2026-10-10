import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    // Click login owner
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ownerBtn = buttons.find(b => b.textContent && b.textContent.includes('เข้าสู่ระบบเจ้าของร้าน'));
      if (ownerBtn) ownerBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check root HTML after login
    const rootAfterLogin = await page.$eval('#root', el => el.innerHTML);
    if(rootAfterLogin.length < 5000) {
       console.log('FAILED TO LOGIN, ROOT LENGTH:', rootAfterLogin.length);
    }
    
    // Click POS tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, div, li'));
      const posBtn = buttons.find(b => b.textContent && b.textContent.includes('ระบบ POS'));
      if (posBtn) posBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    const viteError = await page.evaluate(() => {
      const overlay = document.querySelector('vite-error-overlay');
      return overlay ? overlay.shadowRoot.innerHTML : 'NO VITE ERROR';
    }).catch(e => 'ERROR: ' + e.message);
    
    console.log('--- VITE ERROR ---');
    console.log(viteError.substring(0, 200));

    const rootHtml = await page.$eval('#root', el => el.innerHTML).catch(() => 'NO ROOT ELEMENT');
    console.log('--- ROOT HTML LENGTH AFTER POS CLICK ---', rootHtml.length);
    if(rootHtml.length < 1000) {
        console.log('ROOT HTML:', rootHtml);
    }
  } catch(e) {
    console.log('ERROR CLICKING POS:', e.message);
  }
  
  await browser.close();
})();
