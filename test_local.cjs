const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
  console.log("Starting vite server...");
  const viteProcess = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: '/Users/ittichai/ZCodeProject/admin-dashboard',
    shell: true
  });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log("Launching puppeteer...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  console.log("Navigating...");
  await page.goto('http://localhost:4173/?branch=เฉวง&bed=1', { waitUntil: 'networkidle2' });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const html = await page.content();
  console.log("Does page have ไม่พบสินค้า?", html.includes('ไม่พบสินค้า'));
  console.log("Does page have สวัสดีค่ะ?", html.includes('สวัสดีค่ะ'));
  
  const debugText = await page.evaluate(() => {
    const el = document.querySelector('p.text-indigo-100');
    return el ? el.textContent : null;
  });
  console.log("Debug text:", debugText);
  
  await browser.close();
  viteProcess.kill();
})();
