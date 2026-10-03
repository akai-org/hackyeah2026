import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";

// Strona robocza: sprawdzenie polskich znaków we wszystkich krojach (DESIGN.md 4.1, 4.2 i 14).

export const metadata: Metadata = { title: "Test krojów", robots: { index: false } };

const SAMPLE_LOWER = "ą ć ę ł ń ó ś ź ż";
const SAMPLE_UPPER = "Ą Ć Ę Ł Ń Ó Ś Ź Ż";
const PANGRAM = "Zażółć gęślą jaźń. Pchnąć w tę łódź jeża lub ośm skrzyń fig.";

const FONTS = [
  { name: "Atkinson Hyperlegible 400", className: "font-body font-normal" },
  { name: "Atkinson Hyperlegible 700", className: "font-body font-bold" },
  { name: "Abril Fatface 400", className: "font-cut1" },
  { name: "Alfa Slab One 400", className: "font-cut2" },
  { name: "Playfair Display 900", className: "font-cut3 font-black" },
  { name: "Courier Prime 700", className: "font-cut4 font-bold" },
  { name: "Bitter 700", className: "font-cut5 font-bold" },
];

export default function FontTestPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-deep">Test krojów i polskich znaków</h1>
      <ul className="mt-8 space-y-6">
        {FONTS.map((font) => (
          <li key={font.name} className="border-(length:--bw) border-deep bg-surface p-5">
            <h2 className="text-sm text-muted">{font.name}</h2>
            <p className={`${font.className} mt-2 text-2xl text-ink`}>{SAMPLE_LOWER}</p>
            <p className={`${font.className} text-2xl text-ink`}>{SAMPLE_UPPER}</p>
            <p className={`${font.className} mt-2 text-lg text-ink`}>{PANGRAM}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-xl font-bold text-deep">Kolaż z polskimi znakami</h2>
      <div className="mt-6 space-y-6">
        <CutoutText as="p" text="Zażółć gęślą jaźń" />
        <CutoutText as="p" text="Źdźbło łąki, ćma, ńó" />
        <CutoutText as="p" size="hero" text="Z czym masz kłopot?" />
      </div>
    </div>
  );
}
