// Skala Indeksu Luki Innowacyjnej: jedna barwa (zieleń), od jasnej (mała luka) do ciemnej (duża luka).
// Wspólna dla mapy powiatów i listy „Gdzie najbardziej brakuje rozwiązań”, żeby kolory się zgadzały.
// Sprawdzona walidatorem palet (jeden odcień, monotoniczna jasność, najjaśniejszy krok ≥ 2:1 na białym);
// kolor etykiet dobrany tak, żeby miał kontrast ≥ 4,5:1 na każdym przedziale.

export const GAP_BINS = [
  { fill: "#74BE8F", text: "#15202E" },
  { fill: "#4CA374", text: "#15202E" },
  { fill: "#2C855A", text: "#FFFFFF" },
  { fill: "#1C6644", text: "#FFFFFF" },
  { fill: "#11452D", text: "#FFFFFF" },
] as const;

export const GAP_NO_DATA = { fill: "#F1F4F8", text: "#4A5A6E" } as const;

/** Ten sam podział co w API: 0 … zaokrąglone w górę maksimum, 5 równych przedziałów. */
export function gapBin(score: number, scaleMax: number) {
  const step = scaleMax / GAP_BINS.length;
  return GAP_BINS[Math.min(GAP_BINS.length - 1, Math.floor(score / step))];
}
