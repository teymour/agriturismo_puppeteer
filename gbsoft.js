const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {

  const browser = await puppeteer.launch(
    {
      headless: !(process.env.DEBUG),  //mettre à false pour debug
      defaultViewport: {width: 1280, height: 520},
      ignoreDefaultArgs: ['--disable-extensions'],
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
  );

user_name = process.argv[2];
user_pass = process.argv[3];
user_email = process.argv[4];
client_codigo = process.argv[5];
produits = [];// ["PANE-N", 5.05, 6.54], ["PANE-A", 12.30, 4.90], ["PANE-V", 0.82, 6.54]] ;
for (i = 6 ; i < process.argv.length ; i++) {
  process.argv[i] += ':';
  produits.push(process.argv[i].split(':'));
}
console.log({"Cliente": client_codigo, "Producti": produits});

const page = await browser.newPage();
  try {
    await page.setDefaultNavigationTimeout(0);
    await page.goto("https://gbsoftware.cloud/fattura/login");

    await page.type('#username', user_name);
    await page.keyboard.press("Tab");
    await page.type('input[type="password"]', user_pass);
    await page.keyboard.press('Enter');
    console.log("Tentantive Login")


    await page.waitForSelector(".dashboardIcon");
    console.log("Page dashboard")

    const link_nuovo = await page.$x("//div[contains(., 'Nuovo')]");
    await link_nuovo[8].click();
    console.log("Click sur nuovo");

    await page.waitForSelector(".layout-wrapper .topbar .layout-menu-wrapper .layout-menu > li > ul > li a");
    console.log("Menu Nuovo ouvert")
    await page.waitForTimeout(250);
    const link_transporto = await page.$x("//a[contains(., 'Documento di trasporto')]");
    await link_transporto[0].click();
    console.log("Click sur Documento di trasporto");

    await page.waitForSelector(".bigDialog");
    console.log("Dialogue client ouverte");

    await page.waitForSelector(".ui-table-tbody tr td")
    console.log("liste des clients");

    await page.type("#cliFor0", client_codigo);
    await page.keyboard.press('Enter');
    console.log("Selection du client");

    await page.waitForTimeout(250);
    console.log("recherche du client...");
    await page.waitForSelector('.ui-table-loading', {hidden: true});
    await page.waitForSelector(".bigDialog table.ui-table-scrollable-body-table tr");
    await page.waitForTimeout(250);
    console.log("recherche terminee");

    clients = await page.$x("//tr");
    console.log(clients.length+" client trouve")
    console.log("on selectionne le premier client");

    await clients[4].click({ clickCount: 2 });

    await page.waitForSelector('.ui-table-tbody tr:first-child .fa-box-open');
    await page.waitForTimeout(250);

    for(i in produits) {
      await page.waitForSelector('.fa-box-open');
      console.log('produit '+i);

      await page.evaluate('$(".ui-table-tbody tr:last-child .fa-box-open").click()');
      console.log("Dialogue produit ouverte");

      await page.waitForSelector(".anaDialog");
      await page.waitForSelector("#filtroCodice")
      await page.type("#filtroCodice", produits[i][0]);
      await page.keyboard.press('Enter');
      console.log("Selection du produit");

      await page.waitForSelector('tr.rigaBlu')
      await page.click('tr.rigaBlu', { clickCount: 2 });
      await page.waitForSelector(".anaDialog", {hidden: true});
    }

    for(i in produits) {
      console.log("Produit "+i+": Prezzo & qtt");
      n = parseInt(i)+1;

      if (produits[i][2]) {
        await page.evaluate('$(".tableDatiTestata .ui-table-tbody tr:nth-child('+n.toString()+') td.prova:nth-child(7) input").val("");');
        await page.type('.tableDatiTestata .ui-table-tbody tr:nth-child('+n.toString()+') td.prova:nth-child(7) input', produits[i][2].toString());
        await page.keyboard.press('Enter');
      }
      await page.evaluate('$(".tableDatiTestata .ui-table-tbody tr:nth-child('+n.toString()+') td.prova:nth-child(8) input").val("");');
      await page.type('.tableDatiTestata .ui-table-tbody tr:nth-child('+n.toString()+') td.prova:nth-child(8) input', produits[i][1].toString());
      await page.keyboard.press('Enter');
    }

    const link_salva = await page.$x("//span[contains(., 'Salva documento')]");
    await link_salva[0].click();
    console.log("Document en cours de sauvegarde");

    await page.waitForSelector('.ui-dialog-title');
    await page.waitForSelector('.ui-dialog .ui-button-text');
    console.log("Document sauvegarde confirmee");

    await page.click(".ui-dialog .ui-button-text");
    console.log("Confirmation fermee");

    const link_mail = await page.$x("//span[contains(., 'Invia per email')]");
    await link_mail[0].click();
    console.log("envoi par mail demande");

    await page.waitForSelector('p-dropdownitem');
    const link_mailmodel = await page.$x('//p-dropdownitem');
    await link_mailmodel[1].click();
    console.log("model de mail par defaut demande");

    await page.waitForSelector('.autoWidthDialog');
    console.log('popup reperee');
    const frames = page.frames();
    const frame = frames[1];

    await frame.waitForSelector('input.undefined');
    console.log('destinataire repere');

    await frame.type('input.undefined', user_email);
    await frame.type('.ql-editor', 'Il documento di '+client_codigo);
    await frame.click('.ui-dropdown-label');

    const mail_provider = await frame.$x("//span[contains(., 'Account GBsoftware')]");
    await mail_provider[0].click();

    const mail_send = await frame.$x("//span[contains(., 'Invia email')]");
    await mail_send[0].click();

    await frame.waitForSelector('.ui-dialog .ui-button-text');
    console.log("Envoi a "+user_email+" confirme");

    await frame.click(".ui-button-text");
    console.log("Confirmation fermee");

    await page.click('.ui-dialog-title .fa-times');
    await page.waitForSelector('.autoWidthDialog', {hidden: true});
    console.log("Popup fermee");

    if (!(process.env.DEBUG)) {
      await browser.close();
    }

  } catch (e) {
    console.log("");
    console.log('FAILED !!');
    console.log(e);
    await page.screenshot({ path: "./error_screenshot.png", fullPage: true});
    await browser.close();
  }
})();
