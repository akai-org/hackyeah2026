// Liść monstery 1:1 z find_inv/components/monstera.tsx (logo FindInv).
(function () {
  const LEAF = "M200 338 C150 372 58 352 34 268 C10 186 52 88 132 48 C164 32 186 26 204 22 C292 30 370 102 374 200 C378 290 320 360 252 362 C226 362 210 352 200 338 Z";
  const PETIOLE = "M206 346 C210 368 214 384 222 404";
  const SLITS = [[192,96,92,14],[189,150,10,112],[189,205,-6,214],[194,262,18,318],[214,100,330,24],[217,156,406,126],[215,212,408,232],[210,268,372,336]];
  const HOLES = [[164,128,10,6,-30],[158,182,11,6,-15],[162,236,10,6,10],[244,132,10,6,30],[250,186,11,6,15],[244,242,10,6,-10]];
  const wedge = ([x1, y1, x2, y2]) => {
    const l = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / l, ny = (x2 - x1) / l;
    return [[x1 + nx * 3, y1 + ny * 3], [x2 + nx * 15, y2 + ny * 15], [x2 - nx * 15, y2 - ny * 15], [x1 - nx * 3, y1 - ny * 3]].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  };
  document.querySelectorAll("svg.leaf").forEach((svg, i) => {
    const id = "leafmask" + i;
    svg.innerHTML = `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-20" y="-10" width="440" height="430">
      <path d="${LEAF}" fill="white"/><path d="${PETIOLE}" stroke="white" stroke-width="12" stroke-linecap="round" fill="none"/>
      ${SLITS.map((s) => `<polygon points="${wedge(s)}" fill="black"/>`).join("")}
      ${HOLES.map(([cx, cy, rx, ry, a]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${cx} ${cy})" fill="black"/>`).join("")}
      </mask></defs><g mask="url(#${id})"><rect x="-20" y="-10" width="440" height="430" fill="currentColor"/></g>`;
  });
})();
