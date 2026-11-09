// tools/capture.mjs
// Genera las capturas del reporte de validación y ejecuta comprobaciones automáticas
// (desbordamiento horizontal, zonas táctiles >= 44 px, errores de consola, modo oscuro).
//
// Uso (desde la raíz del proyecto):
//   1) python -m http.server 5173          (en otra terminal)
//   2) node tools/capture.mjs
// Requiere Node 22+ y Google Chrome o Microsoft Edge instalado. Sin dependencias npm.

import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'capturas');
const BASE = process.env.BASE_URL || 'http://localhost:5173/';
const PORT = 9333;

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);
const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('No se encontró Chrome/Edge. Define CHROME_PATH.'); process.exit(1); }

mkdirSync(OUT, { recursive: true });
const profile = join(tmpdir(), 'nimbus-capture-' + Date.now());
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* aún no está listo */ }
    await sleep(200);
  }
  throw new Error('No se pudo conectar con el navegador');
}

const ws = new WebSocket(await connect());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
const consoleErrors = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
  } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

await send('Page.enable');
await send('Runtime.enable');

async function setup({ w, h, mobile = false, scheme = 'light', dpr = 1 }) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
}

let navCount = 0;
async function open(hash, { clear = true } = {}) {
  if (clear) {
    await send('Page.navigate', { url: BASE + '?clear=' + (++navCount) });
    await sleep(500);
    await evaluate('try{localStorage.clear()}catch(e){}');
  }
  await send('Page.navigate', { url: BASE + '?n=' + (++navCount) + hash });
  await sleep(900);
}

async function shot(name, { full = false } = {}) {
  await sleep(450);
  const params = { format: 'png' };
  if (full) {
    const m = await send('Page.getLayoutMetrics');
    params.captureBeyondViewport = true;
    params.clip = { x: 0, y: 0, width: m.cssContentSize.width, height: m.cssContentSize.height, scale: 1 };
  }
  const { data } = await send('Page.captureScreenshot', params);
  writeFileSync(join(OUT, name + '.png'), Buffer.from(data, 'base64'));
  console.log('  captura:', name + '.png');
}

const click = (sel) => evaluate(`document.querySelector(${JSON.stringify(sel)}).click()`);

// Comprobaciones automáticas dentro de la página
const AUDIT = `(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const sel = 'button, a[href], input:not([type=hidden]), select, textarea, [role=button]';
  const small = [...document.querySelectorAll(sel)].filter((el) => {
    if (el.closest('[hidden]') || el.classList.contains('skip-link')) return false;
    if (!vis(el)) return false;
    const r = el.getBoundingClientRect();
    return r.width < 43.5 || r.height < 43.5;
  }).map((el) => (el.id || el.className || el.tagName) + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height));
  return { overflowX: document.documentElement.scrollWidth > innerWidth + 1, scrollWidth: document.documentElement.scrollWidth, innerWidth, small };
})()`;

const report = [];
async function audit(label) {
  const r = await evaluate(AUDIT);
  report.push({ label, ...r });
  console.log(`  auditoría ${label}: overflowX=${r.overflowX} (${r.scrollWidth}/${r.innerWidth}) zonas<44px=${r.small.length}`, r.small.slice(0, 6));
}

try {
  /* ============================ ESCRITORIO 1440 ============================ */
  console.log('Escritorio 1440x900');
  await setup({ w: 1440, h: 900, scheme: 'light' });
  await open('#/resumen');
  await audit('desktop resumen'); await shot('01-escritorio-resumen-claro');

  await setup({ w: 1440, h: 900, scheme: 'dark' });
  await open('#/resumen');
  await shot('02-escritorio-resumen-oscuro-sistema');   // prefers-color-scheme: dark (sin toggle)

  await setup({ w: 1440, h: 900, scheme: 'light' });
  await open('#/resumen');
  await click('#theme-btn');                              // toggle manual -> oscuro
  await sleep(400);
  const manual = await evaluate('document.documentElement.getAttribute("data-theme")');
  console.log('  toggle manual ->', manual);
  await shot('03-escritorio-resumen-oscuro-toggle');

  await open('#/servidores');
  await audit('desktop servidores'); await shot('04-escritorio-servidores-claro');

  await click('#server-body tr:nth-child(4) [data-action="config"]');
  await sleep(500);
  await shot('05-escritorio-drawer-configuracion');
  await evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}))');
  // Escape nativo en <dialog>: se emula con el evento cancel
  await evaluate('document.querySelector("#drawer").dispatchEvent(new Event("cancel",{cancelable:true}))');
  await sleep(500);
  console.log('  drawer abierto tras Esc:', await evaluate('document.querySelector("#drawer").open'));

  await click('#server-body tr:nth-child(1) [data-action="delete"]');
  await sleep(500);
  await evaluate('(() => { const i = document.querySelector("#modal-confirm-input"); i.value = document.querySelector("#modal-confirm-name").textContent; i.dispatchEvent(new Event("input",{bubbles:true})); })()');
  await shot('06-escritorio-modal-eliminar');
  await evaluate('document.querySelector("#confirm-modal").dispatchEvent(new Event("cancel",{cancelable:true}))');
  await sleep(500);
  console.log('  modal abierto tras Esc:', await evaluate('document.querySelector("#confirm-modal").open'));

  await open('#/guia');
  await audit('desktop guia'); await shot('07-escritorio-guia-estados-claro', { full: true });
  await setup({ w: 1440, h: 900, scheme: 'dark' });
  await open('#/guia');
  await shot('08-escritorio-guia-estados-oscuro', { full: true });

  /* ============================ TABLET 820 ============================ */
  console.log('Tablet 820x1180');
  await setup({ w: 820, h: 1180, scheme: 'light' });
  await open('#/resumen');
  await audit('tablet resumen'); await shot('09-tablet-resumen');

  /* ============================ MÓVIL 390 ============================ */
  console.log('Móvil 390x844');
  await setup({ w: 390, h: 844, mobile: true, scheme: 'light', dpr: 2 });
  await open('#/resumen');
  await audit('movil resumen'); await shot('10-movil-resumen-claro');
  await shot('11-movil-resumen-completo', { full: true });

  await click('#menu-btn'); await sleep(450);
  await shot('12-movil-menu-lateral');
  await audit('movil menu abierto');
  await click('#scrim'); await sleep(300);

  await open('#/servidores');
  await audit('movil servidores'); await shot('13-movil-servidores-tarjetas');
  await click('#server-body tr:nth-child(2) [data-action="config"]'); await sleep(500);
  await shot('14-movil-drawer');
  await evaluate('document.querySelector("#drawer").dispatchEvent(new Event("cancel",{cancelable:true}))'); await sleep(500);
  await click('#server-body tr:nth-child(2) [data-action="restart"]'); await sleep(500);
  await shot('15-movil-modal-reiniciar');
  await evaluate('document.querySelector("#confirm-modal").dispatchEvent(new Event("cancel",{cancelable:true}))'); await sleep(500);

  await setup({ w: 390, h: 844, mobile: true, scheme: 'dark', dpr: 2 });
  await open('#/resumen');
  await shot('16-movil-resumen-oscuro');

  await setup({ w: 360, h: 740, mobile: true, scheme: 'light', dpr: 1 });
  await open('#/guia'); await audit('movil360 guia');
  await open('#/servidores'); await audit('movil360 servidores');
  await open('#/resumen'); await audit('movil360 resumen');
} finally {
  writeFileSync(join(OUT, 'auditoria.json'), JSON.stringify({ errores_de_consola: consoleErrors, pruebas: report }, null, 2));
  console.log('\nErrores de consola:', consoleErrors.length ? consoleErrors : 'ninguno');
  ws.close();
  chrome.kill();
  await sleep(500);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* */ }
}
