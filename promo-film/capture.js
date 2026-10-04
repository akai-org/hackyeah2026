// Nagrywa prawdziwą aplikację (build produkcyjny na :3100) scena po scenie.
// Każda scena: klatki JPEG z CDP screencast + frames.json (znaczniki czasu) + marks.json (momenty do montażu).
// Użycie: node capture.js [scena ...]   (bez argumentów = wszystkie)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:3100";
const Q = "Mama mieszka sama na wsi, czuje się samotna i rzadko wychodzi z domu";
const OUT = path.join(__dirname, "clips");

const CURSOR_SCRIPT = () => {
  const install = () => {
    if (document.getElementById("__cur")) return;
    const c = document.createElement("div");
    c.id = "__cur";
    c.setAttribute("popover", "manual");
    c.innerHTML =
      '<svg width="30" height="30" viewBox="0 0 32 32"><path d="M6 3 L6 25 L11.5 19.8 L15.4 28.6 L19.6 26.8 L15.8 18.2 L23 18 Z" fill="#000" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>' +
      '<i style="position:absolute;left:-16px;top:-19px;width:44px;height:44px;border-radius:50%;border:3px solid #f4845f;opacity:0"></i>';
    c.style.cssText =
      "position:fixed;inset:auto;left:0;top:0;margin:0;padding:0;border:0;background:transparent;overflow:visible;width:30px;height:30px;pointer-events:none;transform:translate(-200px,-200px);filter:drop-shadow(1px 2px 2px rgba(0,0,0,.35))";
    document.body.appendChild(c);
    const raise = () => { try { c.hidePopover(); } catch {} try { c.showPopover(); } catch {} };
    raise();
    addEventListener("mousemove", (e) => { c.style.transform = `translate(${e.clientX - 6}px,${e.clientY - 3}px)`; }, true);
    addEventListener("mousedown", () => {
      c.querySelector("i").animate([{ transform: "scale(.3)", opacity: 1 }, { transform: "scale(1.5)", opacity: 0 }], { duration: 500, easing: "ease-out" });
      c.querySelector("svg").animate([{ transform: "scale(1)" }, { transform: "scale(.82)" }, { transform: "scale(1)" }], { duration: 220 });
    }, true);
    // Okna <dialog> lądują w top layer — podnosimy kursor nad nie.
    new MutationObserver(() => setTimeout(raise, 30)).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
};

async function session(name, fn) {
  const dir = path.join(OUT, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, locale: "pl-PL" });
  await ctx.addInitScript(CURSOR_SCRIPT);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  const marks = {};
  let recording = false;
  cdp.on("Page.screencastFrame", async (f) => {
    try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch {}
    if (!recording) return;
    const i = frames.length;
    fs.writeFileSync(path.join(dir, `f${String(i).padStart(5, "0")}.jpg`), Buffer.from(f.data, "base64"));
    frames.push({ i, ts: f.metadata.timestamp });
  });
  let cx = 1100, cy = 700;
  const h = {
    page, Q,
    async start() {
      await page.mouse.move(cx, cy);
      await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1920, maxHeight: 1200, everyNthFrame: 1 });
      recording = true;
      await page.waitForTimeout(300);
      h.mark("start");
    },
    mark(k) { marks[k] = Date.now() / 1000; console.log(`  [${name}] ${k}`); },
    wait: (ms) => page.waitForTimeout(ms),
    async moveTo(target, ms = 650, fx = 0.5, fy = 0.5) {
      const loc = typeof target === "string" ? page.locator(target).first() : target;
      const b = await loc.boundingBox();
      const tx = b.x + b.width * fx, ty = b.y + b.height * fy;
      const n = Math.max(8, Math.round(ms / 16));
      const sx = cx, sy = cy;
      for (let k = 1; k <= n; k++) {
        const t = k / n, e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        await page.mouse.move(sx + (tx - sx) * e, sy + (ty - sy) * e);
        await page.waitForTimeout(16);
      }
      cx = tx; cy = ty;
    },
    async click(target, ms) {
      await h.moveTo(target, ms);
      await page.waitForTimeout(120);
      await page.mouse.down(); await page.waitForTimeout(70); await page.mouse.up();
    },
    async type(text, delay = 40) { await page.keyboard.type(text, { delay }); },
    // Płynne przewijanie okna albo elementu (np. okna dialogowego).
    async scrollTo(targetY, ms = 1200, sel = null) {
      await page.evaluate(({ targetY, ms, sel }) => new Promise((res) => {
        const el = sel ? document.querySelector(sel) : null;
        const get = () => (el ? el.scrollTop : window.scrollY);
        const set = (y) => (el ? (el.scrollTop = y) : window.scrollTo({ top: y, behavior: "instant" }));
        const from = get(), t0 = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - t0) / ms), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          set(from + (targetY - from) * e);
          if (t < 1) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      }), { targetY, ms, sel });
      await page.waitForTimeout(80);
    },
    async scrollToEl(target, offset = 100, ms = 1200) {
      const loc = typeof target === "string" ? page.locator(target).first() : target;
      const y = await loc.evaluate((e, off) => e.getBoundingClientRect().top + window.scrollY - off, offset);
      await h.scrollTo(Math.max(0, y), ms);
    },
  };
  console.log(`== ${name}`);
  await fn(h);
  await page.waitForTimeout(300);
  recording = false;
  await cdp.send("Page.stopScreencast").catch(() => {});
  fs.writeFileSync(path.join(dir, "frames.json"), JSON.stringify(frames));
  fs.writeFileSync(path.join(dir, "marks.json"), JSON.stringify(marks, null, 1));
  console.log(`  ${frames.length} klatek, ${(frames.at(-1).ts - frames[0].ts).toFixed(1)} s`);
  await browser.close();
}

const SCENES = {
  // Biblioteka: przewijanie katalogu (tło sceny o problemie).
  async library(h) {
    await h.page.goto(BASE + "/biblioteka", { waitUntil: "networkidle" });
    await h.wait(800);
    await h.start();
    await h.wait(1200);
    await h.scrollTo(2600, 7000);
    h.mark("end");
  },

  // Matchmaking -> czat -> Middleman, jedna ciągła sesja.
  async match(h) {
    const { page } = h;
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await h.wait(800);
    await h.start();
    await h.wait(900);
    await h.click("textarea", 700);
    h.mark("typeStart");
    await h.type(h.Q, 42);
    h.mark("typeEnd");
    await h.wait(400);
    await h.click(page.getByRole("button", { name: "Szukaj" }).last(), 600);
    h.mark("search");
    await page.locator("main").getByText("System rozpoznał tematy").waitFor();
    h.mark("results");
    await page.locator("main ul li").filter({ hasText: "Samotność" }).first().waitFor({ timeout: 30000 }).catch(() => {});
    await page.getByRole("button", { name: /Jak to wdrożyć/ }).first().waitFor({ timeout: 30000 });
    h.mark("cards");
    await h.wait(1600);
    await h.scrollToEl(page.getByRole("heading", { name: "Pasujące innowacje" }), 90, 1300);
    h.mark("cardsView");
    await h.moveTo(page.getByText("Dopasowanie:").first(), 800, 1.4, 0.5);
    await h.wait(2200);
    // czat
    const ask = page.getByRole("button", { name: "Zapytaj AI o te innowacje" });
    await h.scrollToEl(ask, 420, 1400);
    await h.click(ask, 600);
    h.mark("chatOpen");
    await h.wait(600);
    const chatHead = page.getByRole("heading", { name: "Zapytaj AI o innowacje" });
    await h.scrollToEl(chatHead, 110, 1100);
    const pinY = await page.evaluate(() => window.scrollY);
    const inp = page.getByLabel("Pytanie do AI");
    await h.click(inp, 500);
    await h.type("Która z tych innowacji najlepiej sprawdzi się w małej gminie?", 32);
    await h.wait(250);
    await page.keyboard.press("Enter");
    h.mark("chatSend");
    // czekamy, aż odpowiedź przestanie rosnąć
    let last = "", stable = 0;
    for (let k = 0; k < 120 && stable < 6; k++) {
      await h.wait(250);
      const txt = await page.locator("main").innerText();
      stable = txt === last ? stable + 1 : 0; last = txt;
      await page.evaluate((y) => { if (Math.abs(window.scrollY - y) > 2) window.scrollTo({ top: y, behavior: "instant" }); }, pinY);
    }
    h.mark("chatDone");
    await h.wait(2500);
    // Middleman z karty „Mobilne centrum pomocy dla osób starszych”
    const card = page.locator("main li").filter({ hasText: "Mobilne centrum pomocy dla osób starszych" }).first();
    const how = card.getByRole("button", { name: /Jak to wdrożyć/ });
    await h.scrollToEl(how, 520, 1500);
    await h.click(how, 700);
    h.mark("mmOpen");
    await h.wait(1200);
    const d = page.locator("dialog[open]");
    await h.moveTo(d.locator("select").first(), 600);
    await d.locator("select").first().selectOption("0");
    await h.wait(500);
    await h.click(d.locator("textarea").first(), 500);
    await h.type("Seniorzy z naszej gminy czują się samotni.", 30);
    await h.wait(300);
    await h.click(d.getByRole("button", { name: "Zacznij rozmowę" }), 600);
    h.mark("mmStart");
    await d.getByLabel("Twoja odpowiedź").waitFor({ timeout: 60000 });
    h.mark("q1");
    await h.wait(2600);
    await h.click(d.getByLabel("Twoja odpowiedź"), 600);
    await h.type("Gmina wiejska, ok. 900 seniorów w 12 sołectwach. Mamy busa gminnego i ok. 30 tys. zł rocznie.", 24);
    await h.wait(300);
    await page.keyboard.press("Enter");
    h.mark("a1");
    // czekamy, aż asystent skończy odpowiadać (układ okna przestanie się zmieniać)
    let prev = "", same = 0;
    for (let k = 0; k < 160 && same < 5; k++) {
      await h.wait(250);
      const txt = await d.innerText();
      same = txt === prev && !txt.includes("Analizuję odpowiedź") ? same + 1 : 0; prev = txt;
    }
    h.mark("a1done");
    const showPlan = d.getByRole("button", { name: "Pokaż plan teraz" });
    await showPlan.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await h.wait(500);
    await h.click(showPlan, 600);
    h.mark("planReq");
    await h.wait(2500);
    if (!(await d.getByText("Analizuję").count()) && !(await d.getByText("Twój plan wdrożenia").count())) await showPlan.click();
    await d.getByText("Twój plan wdrożenia").first().waitFor({ timeout: 120000 });
    h.mark("plan");
    await h.wait(1800);
    const top = await d.evaluate((el) => el.scrollTop);
    await h.scrollTo(top + 520, 2200, "dialog[open]");
    await h.wait(1500);
    await h.scrollTo(top + 1250, 2600, "dialog[open]");
    await h.wait(1500);
    h.mark("end");
  },

  // Kondycja Małopolski + mapa powiatów.
  async map(h) {
    const { page } = h;
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    // odsłaniamy sekcje (reveal-on-scroll) i wracamy na „Kondycję Małopolski”
    for (let y = 0; y < 5000; y += 500) { await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y); await h.wait(80); }
    await h.wait(1000);
    const ky = await page.locator("#kondycja-malopolski h2").first().evaluate((e) => e.getBoundingClientRect().top + window.scrollY - 110);
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), ky);
    await h.wait(1500);
    await h.start();
    await h.wait(2400);
    await h.scrollToEl(page.getByRole("heading", { name: "Mapa powiatów" }), 90, 1500);
    h.mark("mapView");
    await h.wait(800);
    const pw = page.locator('#kondycja-malopolski path[aria-label*="limanowski"]').first();
    await h.click(pw, 900);
    h.mark("picked");
    await h.wait(2800);
    await h.scrollTo((await page.evaluate(() => window.scrollY)) + 380, 1600);
    await h.wait(2200);
    h.mark("end");
  },

  // Kreator pomysłów -> fiszka -> wniosek o grant.
  async creator(h) {
    const { page } = h;
    await page.goto(BASE + "/kreator", { waitUntil: "networkidle" });
    await h.wait(800);
    await h.start();
    await h.wait(700);
    const ta = page.getByLabel(/Opisz swój pomysł/).first();
    await h.scrollToEl(ta, 260, 900);
    await h.click(ta, 600);
    h.mark("typeStart");
    await h.type("Chcę zorganizować w świetlicy wiejskiej cotygodniowe spotkania, na których młodzież z liceum uczy seniorów obsługi smartfona.", 22);
    h.mark("typeEnd");
    const an = page.getByRole("button", { name: /Analizuj pomysł/ });
    await h.scrollToEl(an, 520, 1100);
    await h.click(an, 600);
    h.mark("analyze");
    await page.getByText("Fiszka pomysłu").first().waitFor({ timeout: 90000 });
    h.mark("card");
    await h.wait(500);
    await h.scrollToEl(page.getByText("Fiszka pomysłu").first(), 110, 1300);
    await h.wait(1600);
    await h.scrollTo((await page.evaluate(() => window.scrollY)) + 420, 1500);
    await h.wait(900);
    const grant = page.getByText("Napisz wniosek o grant");
    await h.scrollToEl(grant, 520, 1100);
    await h.click(grant, 600);
    h.mark("toGrant");
    await page.waitForURL(/wnioski/);
    await h.wait(1200);
    const fill = page.getByText("Uzupełnij z fiszki").first();
    await h.scrollToEl(fill, 420, 1300);
    await h.click(fill, 600);
    h.mark("fill");
    await page.waitForFunction(() => !document.body.innerText.includes("AI pisze sekcje"), null, { timeout: 120000 });
    h.mark("filled");
    await h.wait(400);
    await h.scrollToEl(page.getByText(/^3\. Wniosek/).first(), 100, 1400);
    await h.wait(1200);
    await h.scrollTo((await page.evaluate(() => window.scrollY)) + 600, 2400);
    await h.wait(1200);
    h.mark("end");
  },

  // Logowanie jako ROPS i panel.
  async admin(h) {
    const { page } = h;
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await h.wait(800);
    await h.start();
    await h.wait(600);
    await h.click(page.getByRole("button", { name: "Zaloguj się" }).first(), 800);
    h.mark("login");
    await h.wait(1300);
    await h.click(page.locator("dialog[open]").getByRole("button", { name: /^Admin/ }), 700);
    h.mark("loggedIn");
    await h.wait(1200);
    await h.click(page.getByRole("link", { name: "Panel ROPS" }).first(), 700);
    await page.waitForURL(/admin/);
    h.mark("panel");
    await h.wait(1400);
    await h.click(page.getByRole("link", { name: "Potrzeby" }).first(), 700);
    h.mark("needs");
    await h.wait(2200);
    await h.moveTo(page.locator(".recharts-bar-rectangle").first(), 900, 0.7, 0.5).catch(() => {});
    await h.wait(2500);
    h.mark("end");
  },

  // Dostępność i języki.
  async a11y(h) {
    const { page } = h;
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await h.wait(800);
    await h.start();
    await h.wait(600);
    await h.click(page.getByRole("button", { name: "Dostępność" }).last(), 900);
    h.mark("panel");
    await h.wait(900);
    await h.click(page.getByRole("switch", { name: "Wysoki kontrast" }), 600);
    h.mark("contrast");
    await h.wait(1100);
    await h.click(page.getByRole("button", { name: "Zwiększ czcionkę" }), 600);
    h.mark("bigger");
    await h.wait(1300);
    await page.keyboard.press("Escape");
    await h.wait(300);
    const lang = page.getByLabel("Zmień język");
    await h.moveTo(lang, 800);
    await h.wait(200);
    await lang.selectOption("en");
    h.mark("en");
    await h.wait(1800);
    await page.getByLabel(/Change language|Zmień język|Змінити мову/).first().selectOption("uk");
    h.mark("uk");
    await h.wait(1800);
    h.mark("end");
  },
};

(async () => {
  const which = process.argv.slice(2);
  for (const [name, fn] of Object.entries(SCENES)) {
    if (which.length && !which.includes(name)) continue;
    await session(name, fn);
  }
})();
