// Uses the browser's native debugging protocol; no project dependencies required.
import fs from 'node:fs/promises';
const output = new URL('./', import.meta.url);
let tabs;
for (let attempt = 0; attempt < 20; attempt++) {
  try { tabs = await fetch('http://127.0.0.1:9222/json/list').then(r => r.json()); break; }
  catch (error) { if (attempt === 19) throw error; await new Promise(r => setTimeout(r, 250)); }
}
const socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let nextId = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const entry = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
    else entry.resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry);
});
function cdp(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
}
const settle = () => evaluate('new Promise(r => setTimeout(r, 1100))');
await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Log.enable');
await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await cdp('Page.navigate', { url: 'http://127.0.0.1:5173/' });
await settle();
await evaluate('document.fonts.ready.then(() => true)');
const checks = [];
for (const theme of ['dark', 'light']) {
  await evaluate(`localStorage.setItem('theme', '${theme}')`);
  await cdp('Page.reload');
  await settle();
  for (const width of [375, 430, 768, 1024, 1440, 1920]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: width < 768 ? 900 : 1000, deviceScaleFactor: 1, mobile: false });
    await settle();
    const layout = await evaluate(`(() => {
      const box = el => {const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
      const visible = el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
      const cards = [...document.querySelectorAll('.oral-floating, .oral-mobile-features > div')].filter(visible);
      const cardBoxes=cards.map(box);
      const overlaps=cardBoxes.some((a,i)=>cardBoxes.slice(i+1).some(b=>a.x<b.right && a.right>b.x && a.y<b.bottom && a.bottom>b.y));
      const tooth=box(document.querySelector('.oral-enamel img'));
      const overflowElements=[...document.querySelectorAll('.oral-home *')].filter(visible).filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+1 && !el.closest('.oral-atmosphere')}).map(el=>({tag:el.tagName,class:el.className,box:box(el)}));
      return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.dataset.theme,visibleCards:cards.length,cardOverlap:overlaps,cardsOutsideViewport:cardBoxes.some(r=>r.x<0||r.right>innerWidth),cardsCoverTooth:cardBoxes.some(r=>r.x<tooth.right&&r.right>tooth.x&&r.y<tooth.bottom&&r.bottom>tooth.y),imageLoaded:document.querySelector('.oral-enamel img').naturalWidth>0,overflowElements,cardBoxes,tooth};
    })()`);
    checks.push(layout);
    const metrics = await cdp('Page.getLayoutMetrics');
    const screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: metrics.cssContentSize.height, scale: 1 } });
    await fs.writeFile(new URL(`${theme}-${width}.png`, output), Buffer.from(screenshot.data, 'base64'));
  }
}
const actions = [];
async function home(width=1440) {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await settle();
}
await home();
await evaluate(`document.querySelector('.oral-primary').click()`);
await settle();
actions.push({action:'Unauthenticated Start Detection',path:await evaluate('location.pathname'),expected:'/login'});
await home();
await evaluate(`document.querySelector('.oral-secondary').click()`);
await settle();
actions.push({action:'Unauthenticated Learn More',path:await evaluate('location.pathname'),expected:'/register'});
await home();
for (const path of ['/dashboard','/detect','/chat','/consultation','/medicines','/profile']) {
  await evaluate(`document.querySelector('nav a[href="${path}"]').click()`);
  await settle();
  actions.push({action:'Guest navigation '+path,path:await evaluate('location.pathname'),expected:'/login'});
  await home();
}
await home(375);
await evaluate(`document.querySelector('[aria-label="Toggle mobile menu"]').click()`);
await settle();
actions.push({action:'Mobile menu expands',passed:await evaluate(`document.querySelector('[aria-label="Toggle mobile menu"]').getAttribute('aria-expanded')==='true'`)});
await evaluate(`[...document.querySelectorAll('header button')].find(el=>el.textContent.trim()==='AI Assistant').click()`);
await settle();
actions.push({action:'Mobile guest AI Assistant',path:await evaluate('location.pathname'),expected:'/login'});
await home();
const before=await evaluate('document.documentElement.dataset.theme');
await evaluate(`document.querySelector('button[aria-label^="Switch to"]').click()`);
await settle();
const after=await evaluate('document.documentElement.dataset.theme');
await cdp('Page.reload');
await settle();
actions.push({action:'Theme toggles and persists',passed:before!==after&&await evaluate('document.documentElement.dataset.theme')===after});
const links = await evaluate(`[...document.querySelectorAll('.oral-strip-item')].map(a=>a.getAttribute('href'))`);
await fs.writeFile(new URL('browser-results.json', output), JSON.stringify({checks,actions,links,errors}, null, 2));
console.log(JSON.stringify({checks:checks.map(({cardBoxes,tooth,...rest})=>rest),actions,links,errors},null,2));
await cdp('Browser.close');
socket.close();
