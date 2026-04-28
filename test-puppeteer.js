import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  let rootHTML = await page.evaluate(() => {
     let err = "";
     try {
       // just check if process exists
       return "" + typeof process;
     } catch(e) {
       return "error";
     }
  });
  console.log("Type of process in browser:", rootHTML);
  
  await browser.close();
  process.exit(0);
})();
