// Kompozycja: podpisy + kamera (zoom) na osi GSAP, obraz z nagrania z listy montażowej (window.EDL).
// window.__seek(t) ustawia wszystko na czas t i czeka, aż klatki nagrania się zdekodują.
(function () {
  const FPS = 30, DURATION = 90;
  const $ = (s) => document.querySelector(s);
  const tl = gsap.timeline({ paused: true });
  const tickers = [];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  const capIn = (sel, t) => { gsap.set(sel, { opacity: 0, x: -40 }); tl.to(sel, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, t); };
  const capOut = (sel, t) => tl.to(sel, { opacity: 0, x: -30, duration: 0.35, ease: "power2.in" }, t);
  const stepOn = (sel, t) => { tl.to(sel, { opacity: 1, duration: 0.3 }, t); tl.set(sel, { attr: { class: "on" } }, t); };
  const stepDone = (sel, t) => { tl.to(sel, { opacity: 0.45, duration: 0.3 }, t); tl.set(sel, { attr: { class: "" } }, t); };

  // kamera: zoom do punktu (x, y) w pikselach widoku aplikacji 1280×800
  const W = 1280, H = 800;
  gsap.set("#cam", { scale: 1, transformOrigin: "50% 50%" });
  function zoom(tIn, tOut, scale, x, y, inDur = 0.5, outDur = 0.5) {
    tl.set("#cam", { transformOrigin: `${(x / W) * 100}% ${(y / H) * 100}%` }, tIn);
    tl.to("#cam", { scale, duration: inDur, ease: "power2.inOut" }, tIn);
    tl.to("#cam", { scale: 1, duration: outDur, ease: "power2.inOut" }, tOut);
  }

  // ---------- 0–4 s: plansza tytułowa ----------
  gsap.set("#intro", { opacity: 0, y: 20 });
  tl.to("#intro", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.15);
  gsap.set("#intro .l1, #intro .l2", { opacity: 0, y: 16 });
  tl.to("#intro .l1", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0.8);
  tl.to("#intro .l2", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 1.4);
  tl.to("#intro", { opacity: 0, y: -40, duration: 0.45, ease: "power2.in" }, 3.55);

  // okno wjeżdża
  gsap.set("#win", { y: 1000, rotation: 2 });
  tl.to("#win", { y: 0, rotation: 0, duration: 0.85, ease: "power3.out" }, 3.75);

  // ---------- 4–9.5: problem ----------
  capIn("#cProb", 4.3);
  gsap.set("#cProb2", { opacity: 0, y: 14 });
  tl.to("#cProb2", { opacity: 1, y: 0, duration: 0.45 }, 6.4);
  tickers.push((t) => {
    const p = clamp((t - 4.4) / 1.3), e = 1 - Math.pow(1 - p, 3);
    const s = String(Math.round(139 * e));
    if ($("#cnt").textContent !== s) $("#cnt").textContent = s;
  });
  capOut("#cProb", 9.2);

  // ---------- 9.5–21: matchmaking ----------
  capIn("#cMatch", 9.6);
  stepOn("#st1", 9.7);
  zoom(10.0, 12.6, 1.22, 400, 520, 0.5, 0.5);             // wpisywanie opisu
  stepDone("#st1", 13.3); stepOn("#st2", 13.3);
  zoom(13.35, 14.3, 1.5, 200, 365, 0.3, 0.4);             // rozpoznane tematy
  stepDone("#st2", 14.5); stepOn("#st3", 14.5);
  capOut("#cMatch", 20.75);

  // ---------- 21–29.5: czat ----------
  capIn("#cChat", 21.1);
  zoom(27.5, 29.3, 1.12, 640, 400, 0.6, 0.2);
  capOut("#cChat", 29.25);

  // ---------- 29.5–44.6: Middleman ----------
  capIn("#cMM1", 29.6);
  zoom(32.9, 37.2, 1.2, 230, 600, 0.45, 0.45);            // pytanie asystenta i odpowiedź
  capOut("#cMM1", 39.25);
  capIn("#cMM2", 39.6);
  capOut("#cMM2", 44.35);

  // ---------- 44.6–51.3: mapa ----------
  capIn("#cMap", 44.7);
  capOut("#cMap", 51.05);

  // ---------- 51.3–61: kreator ----------
  capIn("#cKre", 51.4);
  capOut("#cKre", 60.75);

  // ---------- 61–80: panel ROPS ----------
  capIn("#cAdm1", 61.1);
  capOut("#cAdm1", 67.0);
  capIn("#cAdm2", 67.35);
  capOut("#cAdm2", 72.85);
  capIn("#cAdm3", 73.2);
  capOut("#cAdm3", 79.75);

  // ---------- 80–86.5: dostępność ----------
  capIn("#cA11y", 80.1);
  [["#tk1", 81.4], ["#tk2", 82.9], ["#tk3", 84.4]].forEach(([s, t]) => {
    gsap.set(s, { opacity: 0, x: -20 });
    tl.to(s, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }, t);
  });
  gsap.set("#tkNote", { opacity: 0 });
  tl.to("#tkNote", { opacity: 1, duration: 0.4 }, 84.9);
  zoom(84.3, 86.3, 1.12, 640, 640, 0.6, 0.2);
  capOut("#cA11y", 86.25);

  // ---------- 86.5–90: plansza końcowa ----------
  tl.to("#win", { y: 60, opacity: 0, scale: 0.96, duration: 0.5, ease: "power2.in" }, 86.3);
  gsap.set("#outro", { opacity: 0, y: 20 });
  tl.to("#outro", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 86.75);
  gsap.set("#outro .l2, #outro .l3", { opacity: 0, y: 14 });
  tl.to("#outro .l2", { opacity: 1, y: 0, duration: 0.45 }, 87.2);
  tl.to("#outro .l3", { opacity: 1, y: 0, duration: 0.45 }, 87.6);
  tl.set({}, {}, DURATION);

  // ---------- obraz z nagrania ----------
  const imgA = $("#imgA"), imgB = $("#imgB");
  async function setImg(img, src) {
    if (img._src === src) return;
    img._src = src;
    img.src = src;
    try { await img.decode(); } catch {}
  }
  window.__duration = DURATION;
  window.__seek = async (t) => {
    tl.seek(t, false);
    tickers.forEach((f) => f(t));
    const e = window.EDL[Math.min(window.EDL.length - 1, Math.round(t * FPS))];
    if (!e) return;
    if (e.p) {
      await Promise.all([setImg(imgB, e.p), setImg(imgA, e.f)]);
      imgB.style.opacity = 1; imgA.style.opacity = e.a;
    } else {
      await setImg(imgA, e.f);
      imgA.style.opacity = 1; imgB.style.opacity = 0;
    }
  };
  window.__ready = document.fonts.ready.then(() => window.__seek(0)).then(() => true);
})();
