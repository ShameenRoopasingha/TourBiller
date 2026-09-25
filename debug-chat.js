const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Users\\shame\\Downloads\\chrome-win64\\chrome-win64\\chrome.exe'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'admin@vigil.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('http://localhost:3000/');
  
  // Click the chat assistant floating button
  await page.click('button.fixed.bottom-6');
  
  // Wait for the input to appear
  await page.waitForSelector('input[placeholder="Ask a question..."]');
  
  // Ask the question
  await page.fill('input[placeholder="Ask a question..."]', 'How many active vehicles do we have?');
  await page.click('button[type="submit"]');
  
  // Wait a few seconds for the stream to complete
  await page.waitForTimeout(5000);
  
  // Extract all text from the chat messages
  const messages = await page.$$eval('.bg-gray-200.p-2', els => els.map(e => e.textContent));
  console.log('JSON OUTPUTS:');
  console.log(messages);
  
  const textMessages = await page.$$eval('.prose', els => els.map(e => e.textContent));
  console.log('TEXT OUTPUTS:');
  console.log(textMessages);
  
  await browser.close();
})();
