import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:3001', {waitUntil: 'networkidle2'});
  
  // wait a bit for react to render
  await new Promise(r => setTimeout(r, 2000));
  
  const rootHTML = await page.$eval('#root', el => el.innerHTML);
  console.log("ROOT HTML CONTENT LENGTH:", rootHTML.length);
  if(rootHTML.length < 500) {
     console.log("ROOT HTML:", rootHTML);
  }
  
  await browser.close();
  process.exit(0);
})();
