import { setup, Recorder, B, moveTo, moveToEl, clickEl, placeMouse, typeHuman, smoothScroll, scrollToEl } from './lib.mjs';

const QUERY = 'W naszej gminie wiejskiej seniorzy są samotni i nie radzą sobie ze smartfonem';
const ANSWER = 'Jesteśmy GOPS, mamy 2 pracowników, salę w domu kultury i około 20 tys. zł.';
const only = process.argv.slice(2);
const want = (n) => only.length === 0 || only.includes(n);
const wait = (page, ms) => page.waitForTimeout(ms);

async function scene(name, fn) {
  if (!want(name)) return;
  console.log(`== ${name}`);
  const s = await setup();
  try { await fn(s); } catch (e) { console.error(`!! ${name} failed:`, e.message); }
  await s.browser.close();
}

// 1-3: wyszukiwanie → wyniki → czat → middleman (jedna sesja przeglądarki)
await scene('search', async ({ page, cdp }) => {
  await placeMouse(page, 1500, 760);
  let r = new Recorder(cdp, 'search');
  await r.start();
  await page.goto(B + '/', { waitUntil: 'domcontentloaded' });
  r.mark('nav');
  await page.waitForLoadState('networkidle');
  r.mark('loaded');
  await wait(page, 900);
  await clickEl(page, page.locator('textarea').first(), 900);
  r.mark('typeStart');
  await typeHuman(page, QUERY, 34);
  r.mark('typed');
  await wait(page, 350);
  await clickEl(page, page.getByRole('button', { name: 'Szukaj' }), 650);
  r.mark('submit');
  await page.getByText('Zrozumiałem:').waitFor();
  await page.locator('ul li.appear').first().waitFor({ timeout: 60000 });
  r.mark('tags');
  await page.locator('article').first().waitFor({ timeout: 60000 });
  r.mark('cards');
  await wait(page, 900);
  await scrollToEl(page, page.getByRole('heading', { name: 'Znalezione innowacje' }), 150, 1300);
  r.mark('scrolled');
  await moveToEl(page, page.locator('article').first(), 900, 0.4, 0.3);
  await wait(page, 900);
  await smoothScroll(page, 650, 2200);
  r.mark('scrolledMore');
  await wait(page, 600);
  await r.stop();

  // czat RAG
  await scrollToEl(page, page.getByRole('heading', { name: 'Zapytaj o te rozwiązania' }), 90, 10);
  await wait(page, 400);
  r = new Recorder(cdp, 'chat');
  await r.start();
  await wait(page, 300);
  await clickEl(page, page.getByRole('button', { name: 'Od czego zacząć w małej gminie?' }), 800);
  r.mark('ask');
  await page.getByText('Odpowiedź gotowa.').waitFor({ timeout: 120000 });
  r.mark('done');
  await wait(page, 1200);
  await r.stop();

  // middleman — wybierz najlepiej pasującą kartę (kompetencje cyfrowe seniorów)
  const titles = await page.locator('article h3').allInnerTexts();
  const prefer = ['Wirtualne izby pamięci', 'Mobilne centrum pomocy dla osób starszych'];
  let idx = Math.max(0, titles.findIndex(t => prefer.includes(t.trim())));
  console.log('  cards:', titles, '-> pick', idx);
  const card = page.locator('article').nth(idx);
  const deployLink = card.getByRole('link', { name: 'Jak to wdrożyć?' });
  const innovId = new URL(await deployLink.getAttribute('href'), B).searchParams.get('innowacja');
  const innov = await (await fetch(`http://localhost:8000/api/innovations/${innovId}`)).json();
  const realTitle = innov.data.title;
  const realDesc = innov.data.full_desc || innov.data.short_desc;
  // Middleman szuka innowacji w pustej tabeli findinv.db — dokładamy prawdziwy tytuł i opis do zapytania.
  await page.route('**/api/middleman/start', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    body.innovation_title = realTitle;
    body.innovation_desc = realDesc;
    await route.continue({ postData: JSON.stringify(body) });
  });
  await page.evaluate((title) => {
    const fix = () => document.querySelectorAll('strong').forEach((el) => {
      if (/z wyników wyszukiwania/.test(el.textContent)) el.textContent = title;
    });
    new MutationObserver(fix).observe(document.body, { childList: true, subtree: true, characterData: true });
  }, realTitle);
  await page.evaluate(() => window.scrollTo(0, 0));
  await scrollToEl(page, card, 110, 10);
  await wait(page, 500);
  r = new Recorder(cdp, 'middleman');
  await r.start();
  await wait(page, 300);
  await clickEl(page, deployLink, 900);
  r.mark('click');
  const start = page.getByRole('button', { name: 'Zacznij rozmowę' });
  await start.waitFor();
  await page.waitForLoadState('networkidle');
  r.mark('page');
  await wait(page, 700);
  await moveToEl(page, page.locator('select').first(), 700);
  await page.locator('select').first().selectOption({ index: 0 });
  await wait(page, 300);
  await clickEl(page, start, 800);
  r.mark('start');
  await page.getByText(/Pytanie 1 z/).waitFor({ timeout: 60000 });
  r.mark('q1');
  await wait(page, 1600);
  const answer = page.locator('textarea').first();
  await clickEl(page, answer, 600);
  await typeHuman(page, ANSWER, 26);
  r.mark('typed');
  await wait(page, 250);
  await clickEl(page, page.getByRole('button', { name: 'Odpowiedz' }), 500);
  r.mark('sent');
  await page.waitForFunction(() => {
    const t = document.querySelector('textarea');
    return t && !t.disabled;
  }, null, { timeout: 90000 });
  r.mark('q2');
  await wait(page, 1500);
  await clickEl(page, page.getByRole('button', { name: 'Pokaż plan teraz' }), 800);
  r.mark('planReq');
  await page.locator('#plan-tytul').waitFor({ timeout: 150000 });
  r.mark('plan');
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(page, 300);
  await scrollToEl(page, page.locator('#plan-tytul'), 60, 1000);
  r.mark('planTop');
  await moveTo(page, 1700, 700, 600);
  await wait(page, 1000);
  await smoothScroll(page, 900, 2600);
  await wait(page, 500);
  await smoothScroll(page, 900, 2600);
  r.mark('planEnd');
  await wait(page, 600);
  await r.stop();
});

// Kondycja Małopolski: przewinięcie strony głównej do statystyk i indeksu luki
await scene('stats', async ({ page, cdp }) => {
  await page.goto(B + '/', { waitUntil: 'networkidle' });
  await placeMouse(page, 1750, 900);
  await scrollToEl(page, page.locator('#kondycja'), 0, 10);
  await smoothScroll(page, -500, 10);
  await wait(page, 800);
  const r = new Recorder(cdp, 'stats');
  await r.start();
  await wait(page, 300);
  await scrollToEl(page, page.locator('#kondycja'), 30, 1600);
  r.mark('kondycja');
  await wait(page, 1200);
  await smoothScroll(page, 520, 2000);
  r.mark('gap');
  await wait(page, 1200);
  await r.stop();
});

// Indeks Luki Innowacyjnej + Puls powiatu
await scene('gap', async ({ page, cdp }) => {
  await placeMouse(page, 1500, 300);
  await page.goto(B + '/luka-innowacyjna', { waitUntil: 'networkidle' });
  await wait(page, 600);
  const r = new Recorder(cdp, 'gap');
  await r.start();
  await wait(page, 900);
  await clickEl(page, page.getByRole('button', { name: 'Puls powiatu' }).first(), 1000);
  r.mark('open');
  await wait(page, 1500);
  await smoothScroll(page, 520, 2000);
  r.mark('scrolled');
  await wait(page, 1500);
  await smoothScroll(page, 450, 1800);
  await wait(page, 1000);
  await r.stop();
});

// Prosty widok: przełącznik dostępności
await scene('simple', async ({ page, cdp }) => {
  await placeMouse(page, 1300, 500);
  await page.goto(B + '/', { waitUntil: 'networkidle' });
  await wait(page, 1500);
  const r = new Recorder(cdp, 'simple');
  await r.start();
  await wait(page, 500);
  await clickEl(page, page.getByRole('switch'), 1000);
  r.mark('on');
  await wait(page, 1800);
  await clickEl(page, page.getByRole('switch'), 300);
  r.mark('off');
  await wait(page, 1000);
  await r.stop();
});

// Panel ROPS: logowanie jako admin → statystyki → trendy → innowacje
await scene('admin', async ({ page, cdp }) => {
  await placeMouse(page, 1300, 500);
  await page.goto(B + '/', { waitUntil: 'networkidle' });
  await wait(page, 1200);
  const r = new Recorder(cdp, 'admin');
  await r.start();
  await wait(page, 300);
  await clickEl(page, page.getByRole('button', { name: 'Zaloguj się' }), 900);
  r.mark('dialog');
  await wait(page, 400);
  await clickEl(page, page.locator('dialog input[type=text]'), 600);
  await typeHuman(page, 'Zespół ROPS', 30);
  await wait(page, 200);
  await clickEl(page, page.getByRole('button', { name: /^Admin/ }), 900);
  r.mark('login');
  await page.waitForURL(/\/admin/);
  await page.getByRole('link', { name: 'Trendy', exact: true }).waitFor();
  await page.waitForLoadState('networkidle');
  r.mark('stats');
  await wait(page, 2200);
  await clickEl(page, page.getByRole('link', { name: 'Trendy', exact: true }), 900);
  await page.waitForURL(/trendy/);
  r.mark('trends');
  await wait(page, 2200);
  await smoothScroll(page, 600, 1800);
  await wait(page, 1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await clickEl(page, page.getByRole('link', { name: 'Innowacje', exact: true }), 900);
  await page.waitForURL(/innowacje/);
  await page.waitForLoadState('networkidle');
  r.mark('innovations');
  await wait(page, 1200);
  const archive = page.getByRole('button', { name: /Zatwierdź/ }).first();
  if (await archive.count()) {
    await clickEl(page, archive, 1000);
    r.mark('archived');
    await wait(page, 1400);
  }
  await r.stop();
});

// Kreator pomysłów
await scene('kreator', async ({ page, cdp }) => {
  await placeMouse(page, 1500, 500);
  await page.goto(B + '/kreator', { waitUntil: 'networkidle' });
  await wait(page, 800);
  const r = new Recorder(cdp, 'kreator');
  await r.start();
  await wait(page, 300);
  await clickEl(page, page.locator('textarea').first(), 800);
  await typeHuman(page, 'Młodzież z naszej wsi uczy seniorów obsługi smartfona w świetlicy.', 22);
  r.mark('typed');
  await clickEl(page, page.getByRole('button', { name: 'Seniorzy', exact: true }), 600);
  await clickEl(page, page.getByRole('button', { name: 'Wykluczenie cyfrowe', exact: true }), 500);
  await clickEl(page, page.getByRole('button', { name: 'Gmina wiejska', exact: true }), 500);
  await clickEl(page, page.getByRole('button', { name: 'Analizuj pomysł' }), 800);
  r.mark('analyze');
  await page.getByText('Fiszka pomysłu').waitFor({ timeout: 30000 });
  r.mark('card');
  await wait(page, 300);
  await scrollToEl(page, page.getByText('Fiszka pomysłu'), 120, 1400);
  await wait(page, 1800);
  await r.stop();
});

// Forum
await scene('forum', async ({ page, cdp }) => {
  await placeMouse(page, 1700, 600);
  await page.goto(B + '/forum', { waitUntil: 'networkidle' });
  await wait(page, 800);
  const r = new Recorder(cdp, 'forum');
  await r.start();
  await wait(page, 600);
  await smoothScroll(page, 700, 2400);
  await wait(page, 800);
  await r.stop();
});
