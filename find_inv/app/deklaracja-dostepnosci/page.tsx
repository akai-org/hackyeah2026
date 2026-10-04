import type { Metadata } from "next";
import Link from "next/link";

import type { Locale } from "@/lib/i18n/config";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.accessibility };
}

// Dokument prawny — cała treść w jednym miejscu dla każdego języka, żeby czytała się jak całość.
const CONTENT: Record<
  Locale,
  {
    heading: string;
    intro: string;
    statusTitle: string;
    status: [string, string, string];
    featuresTitle: string;
    features: string[];
    contactTitle: string;
    contactLead: string;
    ropsName: string;
    response: string;
    prepared: string;
    back: string;
  }
> = {
  pl: {
    heading: "Deklaracja dostępności HubMI.pl",
    intro:
      "Regionalny Ośrodek Polityki Społecznej w Krakowie zobowiązuje się zapewnić dostępność serwisu HubMI.pl zgodnie z ustawą z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych.",
    statusTitle: "Status zgodności",
    status: [
      "Serwis jest ",
      "częściowo zgodny",
      " z WCAG 2.1 na poziomie AA. Dążymy do pełnej zgodności do czasu oficjalnego uruchomienia platformy.",
    ],
    featuresTitle: "Dostępne funkcje",
    features: [
      "Nawigacja klawiaturą przez całą stronę",
      "Widoczne obrysy focusa (min. 3 px)",
      "Odpowiedni kontrast kolorów (min. 4,5:1)",
      "Etykiety ARIA na wszystkich interaktywnych elementach",
      "Wsparcie dla dyktowania (Web Speech API w Chrome/Edge)",
      "Pominięcie do głównej treści (link „Przejdź do treści”)",
      "Semantyczny HTML z nagłówkami h1-h3 w prawidłowej kolejności",
      "Interfejs w trzech językach: polskim, angielskim i ukraińskim",
    ],
    contactTitle: "Kontakt w sprawie dostępności",
    contactLead: "Jeśli napotkasz problem z dostępnością serwisu, skontaktuj się z ROPS Kraków:",
    ropsName: "Regionalny Ośrodek Polityki Społecznej w Krakowie",
    response:
      "Na odpowiedź czekaj maksymalnie 7 dni roboczych. Jeśli odpowiedź jest niezadowalająca, możesz skontaktować się z Rzecznikiem Praw Obywatelskich.",
    prepared: "Deklaracja sporządzona: 3 października 2026. Serwis w fazie prototypu (HackYeah 2026).",
    back: "Wróć na stronę główną",
  },
  en: {
    heading: "HubMI.pl accessibility statement",
    intro:
      "The Regional Social Policy Centre in Kraków (ROPS) is committed to making HubMI.pl accessible in accordance with the Polish Act of 4 April 2019 on the digital accessibility of websites and mobile applications of public bodies.",
    statusTitle: "Compliance status",
    status: [
      "The service is ",
      "partially compliant",
      " with WCAG 2.1 level AA. We aim for full compliance by the official launch of the platform.",
    ],
    featuresTitle: "Accessibility features",
    features: [
      "Keyboard navigation across the whole site",
      "Visible focus outlines (min. 3 px)",
      "Sufficient colour contrast (min. 4.5:1)",
      "ARIA labels on all interactive elements",
      "Dictation support (Web Speech API in Chrome/Edge)",
      "Skip to main content (“Skip to content” link)",
      "Semantic HTML with h1–h3 headings in the correct order",
      "Interface in three languages: Polish, English and Ukrainian",
    ],
    contactTitle: "Accessibility contact",
    contactLead: "If you encounter an accessibility problem, contact ROPS Kraków:",
    ropsName: "Regional Social Policy Centre in Kraków",
    response:
      "You should receive a reply within 7 working days. If the reply is unsatisfactory, you can contact the Polish Commissioner for Human Rights (Rzecznik Praw Obywatelskich).",
    prepared: "Statement prepared: 3 October 2026. The service is a prototype (HackYeah 2026).",
    back: "Back to the home page",
  },
  uk: {
    heading: "Декларація доступності HubMI.pl",
    intro:
      "Регіональний центр соціальної політики в Кракові (ROPS) зобов’язується забезпечити доступність сервісу HubMI.pl відповідно до польського закону від 4 квітня 2019 р. про цифрову доступність вебсайтів і мобільних застосунків публічних органів.",
    statusTitle: "Статус відповідності",
    status: [
      "Сервіс ",
      "частково відповідає",
      " WCAG 2.1 на рівні AA. Ми прагнемо повної відповідності до офіційного запуску платформи.",
    ],
    featuresTitle: "Функції доступності",
    features: [
      "Навігація клавіатурою по всьому сайту",
      "Помітна рамка фокуса (мін. 3 px)",
      "Достатній контраст кольорів (мін. 4,5:1)",
      "Мітки ARIA на всіх інтерактивних елементах",
      "Підтримка диктування (Web Speech API у Chrome/Edge)",
      "Перехід до основного змісту (посилання «Перейти до змісту»)",
      "Семантичний HTML із заголовками h1–h3 у правильному порядку",
      "Інтерфейс трьома мовами: польською, англійською та українською",
    ],
    contactTitle: "Контакт щодо доступності",
    contactLead: "Якщо ви зіткнулися з проблемою доступності, зверніться до ROPS Краків:",
    ropsName: "Регіональний центр соціальної політики в Кракові",
    response:
      "Відповідь надійде протягом максимум 7 робочих днів. Якщо відповідь вас не задовольнить, ви можете звернутися до Уповноваженого з прав людини Польщі (Rzecznik Praw Obywatelskich).",
    prepared: "Декларацію складено: 3 жовтня 2026 р. Сервіс у фазі прототипу (HackYeah 2026).",
    back: "Повернутися на головну",
  },
};

export default async function AccessibilityStatementPage() {
  const c = CONTENT[await getLocale()];
  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">{c.heading}</h1>

      <p className="mt-4 max-w-[65ch] text-lg">{c.intro}</p>

      <section className="mt-8 space-y-4 max-w-[65ch]">
        <h2 className="text-xl font-bold text-foreground">{c.statusTitle}</h2>
        <p>
          {c.status[0]}
          <strong>{c.status[1]}</strong>
          {c.status[2]}
        </p>
      </section>

      <section className="mt-8 space-y-4 max-w-[65ch]">
        <h2 className="text-xl font-bold text-foreground">{c.featuresTitle}</h2>
        <ul className="list-disc pl-6 space-y-2">
          {c.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 space-y-4 max-w-[65ch]">
        <h2 className="text-xl font-bold text-foreground">{c.contactTitle}</h2>
        <p>{c.contactLead}</p>
        <address className="not-italic">
          <p>{c.ropsName}</p>
          <p>ul. Piastowska 32, 30-070 Kraków</p>
          <p>
            <a href="https://rops.krakow.pl" className="font-bold text-primary underline underline-offset-4">
              rops.krakow.pl
            </a>
          </p>
        </address>
        <p className="text-sm text-muted">{c.response}</p>
      </section>

      <p className="mt-8 text-sm text-muted">{c.prepared}</p>

      <Link href="/" className="mt-6 inline-flex min-h-12 items-center font-bold text-primary underline underline-offset-4">
        {c.back}
      </Link>
    </div>
  );
}
