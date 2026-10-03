import fs from 'node:fs';
const dir = 'public/clips';
const out = {};
for (const name of fs.readdirSync(dir)) {
  const p = `${dir}/${name}/meta.json`;
  if (!fs.existsSync(p)) continue;
  const m = JSON.parse(fs.readFileSync(p));
  out[name] = { times: m.times, duration: m.duration, marks: Object.fromEntries(m.marks.map(k => [k.label, k.t])) };
}
fs.writeFileSync('src/clipMeta.ts', '// Wygenerowane przez gen-meta.mjs z public/clips/*/meta.json\nexport const CLIPS = ' + JSON.stringify(out) + ' as const;\nexport type ClipName = keyof typeof CLIPS;\n');
for (const [k, v] of Object.entries(out)) console.log(k, v.duration, JSON.stringify(v.marks));
