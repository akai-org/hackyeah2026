import type { Metadata } from "next";

// Strona robocza: sprawdzenie polskich znaków w kroju podstawowym.

export const metadata: Metadata = { title: "Test krojów", robots: { index: false } };

const SAMPLE_LOWER = "ą ć ę ł ń ó ś ź ż";
const SAMPLE_UPPER = "Ą Ć Ę Ł Ń Ó Ś Ź Ż";
const PANGRAM = "Zażółć gęślą jaźń. Pchnąć w tę łódź jeża lub ośm skrzyń fig.";

const FONTS = [
  { name: "Atkinson Hyperlegible 400", className: "font-body font-normal" },
  { name: "Atkinson Hyperlegible 700", className: "font-body font-bold" },
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
    </div>
  );
}
