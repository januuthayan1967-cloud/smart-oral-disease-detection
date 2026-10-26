// Browser-only visual regression audit. Playwright is loaded from temporary
// tooling, so application packages and lockfiles do not change.
const path = require('node:path');
const fs = require('node:fs/promises');
const { chromium } = require(path.join(process.env.TEMP, 'oralai-browser-tools/node_modules/playwright'));
const directory = __dirname;
const baseUrl = 'http://127.0.0.1:5173/';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  async function settle() {
    await page.locator('.oral-home').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(450);
  }
  await page.goto(baseUrl);
  await settle();
  const checks = [];
  for (const theme of ['dark', 'light']) {
    await page.evaluate(theme => localStorage.setItem('theme', theme), theme);
    await page.reload();
    await settle();
    for (const width of [375, 430, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width < 768 ? 900 : 1000 });
      await settle();
      const layout = await page.evaluate(() => {
        const box = el => { const r = el.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom }; };
        const visible = el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
        const overlap = (a,b) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
        const cards = [...document.querySelectorAll('.oral-floating, .oral-mobile-features > div')].filter(visible);
        const cardBoxes = cards.map(box);
        const tooth = box(document.querySelector('.oral-enamel img'));
        const viewport = box(document.querySelector('.oral-tooth-viewport'));
        const strip = box(document.querySelector('.oral-feature-strip'));
        const platformBoxes = [...document.querySelector('.oral-pedestal').children].slice(1).map(box);
        const actionButtons = [...document.querySelectorAll('.oral-actions button')];
        const buttonBlocked = actionButtons.some(button => { const r=box(button); const el=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return r.y+r.height/2 < innerHeight && !button.contains(el); });
        return {
          width: innerWidth, theme: document.documentElement.dataset.theme,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          visibleCards: cards.length,
          cardOverlap: cardBoxes.some((a,i)=>cardBoxes.slice(i+1).some(b=>overlap(a,b))),
          cardsOutsideViewport: cardBoxes.some(r=>r.x<0 || r.right>innerWidth),
          cardsCoverTooth: cardBoxes.some(r=>overlap(r,tooth)),
          clippedText: cards.some(card=>[...card.querySelectorAll('h4,p')].some(el=>el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1)),
          platformOutsideSection: platformBoxes.some(r=>r.x<viewport.x-1||r.right>viewport.right+1||r.bottom>viewport.bottom+1),
          platformOverlapsStrip: platformBoxes.some(r=>overlap(r,strip)),
          buttonBlocked,
          imageLoaded: document.querySelector('.oral-enamel img').naturalWidth>0,
          geometry: {hero:box(document.querySelector('.oral-hero')),copy:box(document.querySelector('.oral-copy')),tooth,viewport,strip,cards:cardBoxes},
        };
      });
      checks.push(layout);
      await page.screenshot({ path: path.join(directory, `${theme}-${width}.png`), fullPage: true });
    }
  }
  const actions = [];
  async function home(width=1440) {
    await page.setViewportSize({width,height:1000});
    await page.goto(baseUrl);
    await settle();
  }
  async function action(name, selector, expected, width=1440, keyboard=false) {
    await home(width);
    if (keyboard) await page.locator(selector).press('Enter');
    else await page.locator(selector).click();
    await page.waitForURL('**'+expected);
    actions.push({ name, expected, actual: new URL(page.url()).pathname, passed: true });
  }
  await action('Guest Start Detection','.oral-primary','/login');
  await action('Guest Learn More','.oral-secondary','/register');
  await action('Login button','nav button:has-text("Login")','/login');
  await action('Get Started button','nav button:has-text("Get Started")','/register');
  for (const destination of ['/dashboard','/detect','/chat','/consultation','/medicines','/profile']) {
    await action('Guest navbar '+destination,`nav a[href="${destination}"]`,'/login');
  }
  for (const number of ['01','02','03','04']) {
    await action('Guest floating card '+number,`.oral-floating-${number}`,'/login');
  }
  await action('Keyboard detection card','.oral-floating-01','/login',1440,true);
  for (const destination of ['/detect','/chat','/consultation','/medicines']) {
    await action('Guest lower feature strip '+destination,`.oral-strip-item[href="${destination}"]`,'/login');
  }
  await home(375);
  await page.getByRole('button',{name:'Toggle mobile menu'}).click();
  actions.push({name:'Mobile menu expands',passed:await page.getByRole('button',{name:'Toggle mobile menu'}).getAttribute('aria-expanded')==='true'});
  await page.locator('header button').filter({hasText:'AI Assistant'}).click();
  await page.waitForURL('**/login');
  actions.push({name:'Mobile guest AI Assistant redirects to login',passed:true});
  await home();
  const before=await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button',{name:/Switch to .* mode/}).click();
  const after=await page.locator('html').getAttribute('data-theme');
  await page.reload();
  await settle();
  actions.push({name:'Theme toggles and persists',passed:before!==after && await page.locator('html').getAttribute('data-theme')===after});
  const sameThemeGeometry = [375,430,768,1024,1440,1920].map(width=>({width,passed:JSON.stringify(checks.find(c=>c.width===width&&c.theme==='dark').geometry)===JSON.stringify(checks.find(c=>c.width===width&&c.theme==='light').geometry)}));
  await page.evaluate(()=>localStorage.setItem('theme','dark'));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.reload();
  await settle();
  await page.mouse.move(920,330);
  await page.waitForTimeout(800);
  await page.screenshot({path:path.join(directory,'dark-1440-motion.png'),fullPage:true});
  const parallax = await page.locator('.oral-tooth-scene').evaluate(el=>getComputedStyle(el).transform);
  const result={checks,actions,sameThemeGeometry,parallax,errors};
  await fs.writeFile(path.join(directory,'browser-results.json'),JSON.stringify(result,null,2));
  const failedLayouts=checks.filter(c=>c.horizontalOverflow||c.visibleCards!==4||c.cardOverlap||c.cardsOutsideViewport||c.cardsCoverTooth||c.clippedText||c.platformOutsideSection||c.platformOverlapsStrip||c.buttonBlocked||!c.imageLoaded);
  const summary={layouts:checks.length,failedLayouts:failedLayouts.map(({geometry,...rest})=>rest),actions:actions.length,failedActions:actions.filter(a=>!a.passed),sameThemeGeometry,parallax,errors};
  console.log(JSON.stringify(summary,null,2));
  await browser.close();
  if(failedLayouts.length || actions.some(a=>!a.passed) || sameThemeGeometry.some(c=>!c.passed) || errors.length) process.exitCode=1;
})().catch(error=>{console.error(error);process.exit(1);});
