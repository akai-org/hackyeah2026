import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const B = 'http://localhost:3000';
export const OUT = path.resolve('../remotion/public/clips');

// Fake cursor + hide Next.js dev indicator. Cursor follows real mouse events.
const INIT = `
(() => {
  const css = document.createElement('style');
  css.textContent = 'nextjs-portal{display:none!important} html{scroll-behavior:auto!important} ::-webkit-scrollbar{display:none}' +
   '#__cur{position:fixed;left:0;top:0;width:24px;height:24px;z-index:2147483647;pointer-events:none;transform:translate(-200px,-200px);transition:none}' +
   '#__cur svg{filter:drop-shadow(2px 3px 2px rgba(0,0,0,.35))}' +
   '.__rip{position:fixed;z-index:2147483646;pointer-events:none;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:3px solid #1B4332;background:rgba(242,226,160,.6);animation:__r .55s ease-out forwards}' +
   '@keyframes __r{to{transform:scale(4.2);opacity:0}}';
  const add = () => {
    document.documentElement.style.zoom = '1.3333';
    if (document.getElementById('__cur')) return;
    document.head.appendChild(css);
    const c = document.createElement('div'); c.id='__cur';
    c.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.5 15 L11.5 21.5 L14.2 20.3 L11.3 13.9 L17.5 13.9 Z" fill="#14251C" stroke="#FAFCF7" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    const p = window.__curPos || {x:-200,y:-200};
    c.style.transform = 'translate('+p.x+'px,'+p.y+'px)';
  };
  const Z=()=>parseFloat(document.documentElement.style.zoom)||1;
  window.addEventListener('mousemove', e => { window.__curPos={x:e.clientX/Z(),y:e.clientY/Z()}; const P=window.__curPos; const c=document.getElementById('__cur'); if(c) c.style.transform='translate('+P.x+'px,'+P.y+'px)'; }, true);
  window.addEventListener('mousedown', e => { const r=document.createElement('div'); r.className='__rip'; r.style.left=(e.clientX/Z())+'px'; r.style.top=(e.clientY/Z())+'px'; document.body.appendChild(r); setTimeout(()=>r.remove(),700); }, true);
  if (document.readyState !== 'loading') add(); else document.addEventListener('DOMContentLoaded', add);
  new MutationObserver(add).observe(document.documentElement, {childList:true, subtree:false});
  setInterval(add, 300);
})();`;

export async function setup() {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'pl-PL' });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  return { browser, ctx, page, cdp };
}

let mouse = { x: 960, y: 540 };
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export async function moveTo(page, x, y, ms = 700) {
  const steps = Math.max(8, Math.round(ms / 16));
  const sx = mouse.x, sy = mouse.y;
  // slight arc
  const cx = (sx + x) / 2 + (y - sy) * 0.12, cy = (sy + y) / 2 - (x - sx) * 0.12;
  for (let i = 1; i <= steps; i++) {
    const t = ease(i / steps);
    const px = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * x;
    const py = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * y;
    await page.mouse.move(px, py);
    await page.waitForTimeout(16);
  }
  mouse = { x, y };
}
export async function moveToEl(page, loc, ms = 700, dx = 0.5, dy = 0.5) {
  await loc.scrollIntoViewIfNeeded();
  const b = await loc.boundingBox();
  await moveTo(page, b.x + b.width * dx, b.y + b.height * dy, ms);
}
export async function clickEl(page, loc, ms = 700) {
  await moveToEl(page, loc, ms);
  await page.waitForTimeout(120);
  await page.mouse.down(); await page.waitForTimeout(70); await page.mouse.up();
}
export function placeMouse(page, x, y) { mouse = { x, y }; return page.mouse.move(x, y); }

export async function typeHuman(page, text, base = 38) {
  for (const ch of text) {
    await page.keyboard.type(ch);
    await page.waitForTimeout(base + Math.random() * base * 0.8 + (ch === ' ' ? 25 : 0) + (/[,.]/.test(ch) ? 120 : 0));
  }
}

// smooth scroll by delta px in ms
export async function smoothScroll(page, delta, ms = 1200) {
  await page.evaluate(([delta, ms]) => new Promise(res => {
    const s = window.scrollY, t0 = performance.now();
    const e = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const f = now => { const t = Math.min(1, (now - t0) / ms); window.scrollTo(0, s + delta * e(t)); t < 1 ? requestAnimationFrame(f) : res(); };
    requestAnimationFrame(f);
  }), [delta, ms]);
}
export async function scrollToEl(page, loc, offset = 120, ms = 1200) {
  const y = await loc.evaluate(el => el.getBoundingClientRect().top);
  await smoothScroll(page, y - offset, ms);
}

export class Recorder {
  constructor(cdp, name) { this.cdp = cdp; this.name = name; this.frames = []; this.marks = []; }
  async start() {
    this.dir = path.join(OUT, this.name);
    fs.rmSync(this.dir, { recursive: true, force: true });
    fs.mkdirSync(this.dir, { recursive: true });
    this.handler = async ({ data, metadata, sessionId }) => {
      const i = this.frames.length;
      const file = `${String(i).padStart(5, '0')}.jpg`;
      fs.writeFileSync(path.join(this.dir, file), Buffer.from(data, 'base64'));
      this.frames.push(metadata.timestamp);
      try { await this.cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
    };
    this.cdp.on('Page.screencastFrame', this.handler);
    await this.cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
    this.t0 = Date.now() / 1000;
  }
  mark(label) { this.marks.push({ label, t: Date.now() / 1000 }); console.log(`  [${this.name}] mark ${label} @ ${(Date.now() / 1000 - this.t0).toFixed(2)}s`); }
  async stop() {
    await new Promise(r => setTimeout(r, 300));
    await this.cdp.send('Page.stopScreencast');
    this.cdp.off('Page.screencastFrame', this.handler);
    const base = this.frames[0];
    const meta = { name: this.name, count: this.frames.length, times: this.frames.map(t => +(t - base).toFixed(4)),
      marks: this.marks.map(m => ({ label: m.label, t: +(m.t - base).toFixed(3) })), duration: +(this.frames.at(-1) - base).toFixed(3) };
    fs.writeFileSync(path.join(this.dir, 'meta.json'), JSON.stringify(meta));
    console.log(`  [${this.name}] ${meta.count} frames, ${meta.duration}s, ~${(meta.count / meta.duration).toFixed(1)} fps`);
    return meta;
  }
}
