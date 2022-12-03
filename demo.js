const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {

  const browser = await puppeteer.launch(
    {
      headless: !(process.env.DEBUG),  //mettre à false pour debug
      defaultViewport: {width: 1280, height: 720},
      ignoreDefaultArgs: ['--disable-extensions'],
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
  );

  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.setViewport({ width: 1280, height: 720 });

    await page.goto("https://duckduckgo.com/");
    await page.type("#search_form_input_homepage", "poggio diavolino");
    await page.keyboard.press('Enter');

    await page.waitForSelector('#r1-0');
    await page.screenshot({ path: "./screenshot.png", fullPage: true});

    await browser.close();

  } catch (e) {
    console.log("");
    console.log('FAILED !!');
    console.log(e);
    await browser.close();
  }
})();
