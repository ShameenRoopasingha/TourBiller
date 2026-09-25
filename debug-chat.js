const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Users\\shame\\Downloads\\chrome-win64\\chrome-win64\\chrome.exe'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'admin@vigil.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('http://localhost:3000/');
  
  await page.click('button.fixed.bottom-6');
  await page.waitForSelector('input[placeholder="Ask a question..."]');
  
  await page.fill('input[placeholder="Ask a question..."]', 'How many active vehicles do we have?');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(5000);
  
  const messages = await page.$$eval('.bg-gray-100', els => els.map(e => e.textContent));
  console.log('JSON OUTPUTS:');
  console.log(messages);
  
  const textMessages = await page.$$eval('.prose', els => els.map(e => e.textContent));
  console.log('TEXT OUTPUTS:');
  console.log(textMessages);
  
  const errorText = await page.$$eval('.bg-red-50', els => els.map(e => e.textContent));
  console.log('ERRORS:');
  console.log(errorText);

  await browser.close();
})();
