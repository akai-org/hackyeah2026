import type { Metadata } from "next";
import Link from "next/link";

import type { Locale } from "@/lib/i18n/config";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.accessibility };
}

// Dokument prawny — cała treść w jednym miejscu dla każdego języka, żeby czytała się jak całość.
// Treść opisuje stan faktyczny prototypu: przy zmianach w dostępności zaktualizuj listy i datę aktualizacji.
type Content = {
  heading: string;
  intro: string;
  datesTitle: string;
  published: [string, string];
  updated: [string, string];
  statusTitle: string;
  status: [string, string, string];
  limitationsTitle: string;
  limitations: string[];
  methodTitle: string;
  method: string;
  featuresTitle: string;
  features: string[];
  contactTitle: string;
  contactLead: string;
  ropsName: string;
  procedureTitle: string;
  procedure: string[];
  back: string;
};

const CONTENT: Record<Locale, Content> = {
  pl: {
    heading: "Deklaracja dostępności HubMI.pl",
    intro:
      "HubMI.pl to prototyp platformy przygotowany podczas hackathonu HackYeah 2026 w odpowiedzi na wyzwanie Regionalnego Ośrodka Polityki Społecznej w Krakowie. Docelowo serwis ma spełniać wymagania ustawy z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych. Ta deklaracja opisuje stan prototypu.",
    datesTitle: "Daty",
    published: ["Data publikacji serwisu", "3 października 2026"],
    updated: ["Data ostatniej aktualizacji deklaracji", "4 października 2026"],
    statusTitle: "Status zgodności",
    status: ["Serwis jest ", "częściowo zgodny", " z WCAG 2.1 na poziomie AA z powodu ograniczeń wymienionych niżej."],
    limitationsTitle: "Ograniczenia i treści niedostępne",
    limitations: [
      "Materiały zewnętrzne, do których prowadzą linki (pliki PDF, strony ROPS, filmy YouTube i Vimeo), nie są przygotowywane w serwisie — mogą nie mieć napisów, opisów alternatywnych ani struktury dostępnej dla czytników ekranu.",
      "Opisy innowacji i materiałów pochodzą z bazy po polsku. W wersji angielskiej i ukraińskiej tłumaczy je automatycznie sztuczna inteligencja, więc tłumaczenie może zawierać błędy.",
      "Odpowiedzi czatu, plan wdrożenia i szkice wniosków tworzy sztuczna inteligencja — mogą zawierać błędy lub niejasne sformułowania.",
      "Dyktowanie działa tylko w przeglądarkach obsługujących rozpoznawanie mowy (Chrome, Edge). W pozostałych tekst trzeba wpisać ręcznie.",
    ],
    methodTitle: "Jak sprawdziliśmy dostępność",
    method:
      "Samoocena przeprowadzona 4 października 2026: automatyczny audyt narzędziem axe-core (reguły WCAG 2.1 A i AA) jedenastu głównych podstron — bez wykrytych błędów, sprawdzenie kolejności nagłówków, sprawdzenie czytelności przy szerokości 320 px oraz ręczna obsługa klawiaturą. Serwis nie przeszedł jeszcze audytu eksperckiego ani testów z użytkownikami.",
    featuresTitle: "Dostępne funkcje",
    features: [
      "Obsługa całego serwisu klawiaturą, także mapy powiatów (powiat można też wybrać z listy).",
      "Widoczny obrys elementu z fokusem (3 px, w trybie wysokiego kontrastu 4 px).",
      "Kontrast tekstu co najmniej 4,5:1, sprawdzany testem automatycznym.",
      "Link „Przejdź do treści” na początku każdej strony.",
      "Panel dostępności: mniejsza lub większa czcionka, większe odstępy i tryb wysokiego kontrastu — ustawienia są zapamiętywane.",
      "Ograniczenie animacji, gdy w systemie włączono ograniczenie ruchu.",
      "Treść mieści się na ekranie o szerokości 320 px bez przewijania w poziomie (powiększenie do 400%).",
      "Okna dialogowe: zamykanie klawiszem Esc, fokus pozostaje w oknie i wraca na przycisk, który je otworzył.",
      "Odczyt karty innowacji na głos (syntezator mowy przeglądarki).",
      "Dyktowanie opisu problemu i pomysłu (Chrome, Edge).",
      "Semantyczne nagłówki w prawidłowej kolejności, obszary strony oraz opisy dla czytników ekranu przy ikonach i przyciskach.",
      "Interfejs w trzech językach: polskim, angielskim i ukraińskim.",
    ],
    contactTitle: "Informacje zwrotne i kontakt",
    contactLead:
      "Prototyp nie ma jeszcze wyznaczonej osoby do kontaktu w sprawie dostępności. Po wdrożeniu kontakt zapewni wydawca serwisu — instytucja, która zgłosiła wyzwanie:",
    ropsName: "Regionalny Ośrodek Polityki Społecznej w Krakowie",
    procedureTitle: "Procedura wnioskowo-skargowa",
    procedure: [
      "Każdy ma prawo zażądać zapewnienia dostępności cyfrowej strony lub jej elementu albo udostępnienia treści w inny sposób. Żądanie powinno zawierać dane osoby zgłaszającej, wskazanie, o którą stronę lub element chodzi, oraz preferowany sposób kontaktu.",
      "Podmiot publiczny realizuje żądanie niezwłocznie, nie później niż w ciągu 7 dni od jego otrzymania. Jeśli nie jest to możliwe, informuje o tym i podaje nowy termin — nie dłuższy niż 2 miesiące — albo proponuje alternatywny sposób dostępu do informacji.",
      "Po odmowie lub niedotrzymaniu terminu można złożyć skargę do podmiotu publicznego, a po wyczerpaniu tej procedury — wniosek do Rzecznika Praw Obywatelskich (bip.brpo.gov.pl).",
    ],
    back: "Wróć na stronę główną",
  },
  en: {
    heading: "HubMI.pl accessibility statement",
    intro:
      "HubMI.pl is a prototype platform built during the HackYeah 2026 hackathon in response to a challenge set by the Regional Social Policy Centre in Kraków (ROPS). The service is intended to meet the requirements of the Polish Act of 4 April 2019 on the digital accessibility of websites and mobile applications of public bodies. This statement describes the state of the prototype.",
    datesTitle: "Dates",
    published: ["Service published", "3 October 2026"],
    updated: ["Statement last updated", "4 October 2026"],
    statusTitle: "Compliance status",
    status: ["The service is ", "partially compliant", " with WCAG 2.1 level AA due to the limitations listed below."],
    limitationsTitle: "Limitations and non-accessible content",
    limitations: [
      "External materials we link to (PDF files, ROPS pages, YouTube and Vimeo videos) are not produced in the service — they may lack captions, alternative text or a structure accessible to screen readers.",
      "Descriptions of innovations and materials come from the database in Polish. In the English and Ukrainian versions they are translated automatically by AI, so translations may contain errors.",
      "Chat answers, implementation plans and draft applications are generated by AI — they may contain errors or unclear wording.",
      "Dictation only works in browsers that support speech recognition (Chrome, Edge). In other browsers text has to be typed.",
    ],
    methodTitle: "How we checked accessibility",
    method:
      "Self-assessment carried out on 4 October 2026: automated audit with axe-core (WCAG 2.1 A and AA rules) of eleven main pages — no errors found, heading order check, reflow check at 320 px width and manual keyboard testing. The service has not yet undergone an expert audit or user testing.",
    featuresTitle: "Accessibility features",
    features: [
      "The whole service can be used with a keyboard, including the county map (a county can also be chosen from a list).",
      "Visible focus outline (3 px, 4 px in high-contrast mode).",
      "Text contrast of at least 4.5:1, checked by an automated test.",
      "“Skip to content” link at the start of every page.",
      "Accessibility panel: smaller or larger text, wider spacing and high-contrast mode — settings are remembered.",
      "Reduced animations when reduced motion is enabled in the operating system.",
      "Content fits a 320 px wide screen without horizontal scrolling (zoom up to 400%).",
      "Dialogs: close with Esc, focus stays inside and returns to the button that opened them.",
      "Read-aloud of the innovation card (browser speech synthesis).",
      "Dictation of the problem and idea description (Chrome, Edge).",
      "Semantic headings in the correct order, page landmarks and screen-reader descriptions for icons and buttons.",
      "Interface in three languages: Polish, English and Ukrainian.",
    ],
    contactTitle: "Feedback and contact",
    contactLead:
      "The prototype does not yet have a designated accessibility contact person. After launch, contact will be provided by the publisher of the service — the institution that set the challenge:",
    ropsName: "Regional Social Policy Centre in Kraków",
    procedureTitle: "Request and complaint procedure",
    procedure: [
      "Everyone has the right to request digital accessibility of a page or its element, or access to the content in another way. The request should include the requester's details, the page or element concerned and the preferred way of contact.",
      "The public body handles the request without delay, no later than 7 days after receiving it. If that is not possible, it informs the requester and sets a new deadline of no more than 2 months, or proposes an alternative way of accessing the information.",
      "If the request is refused or the deadline is missed, a complaint can be filed with the public body and, once that procedure is exhausted, an application can be made to the Polish Commissioner for Human Rights (bip.brpo.gov.pl).",
    ],
    back: "Back to the home page",
  },
  uk: {
    heading: "Декларація доступності HubMI.pl",
    intro:
      "HubMI.pl — це прототип платформи, створений під час хакатону HackYeah 2026 у відповідь на завдання Регіонального центру соціальної політики в Кракові (ROPS). Сервіс має відповідати вимогам польського закону від 4 квітня 2019 р. про цифрову доступність вебсайтів і мобільних застосунків публічних органів. Ця декларація описує стан прототипу.",
    datesTitle: "Дати",
    published: ["Дата публікації сервісу", "3 жовтня 2026 р."],
    updated: ["Дата останнього оновлення декларації", "4 жовтня 2026 р."],
    statusTitle: "Статус відповідності",
    status: ["Сервіс ", "частково відповідає", " WCAG 2.1 на рівні AA через обмеження, наведені нижче."],
    limitationsTitle: "Обмеження та недоступний вміст",
    limitations: [
      "Зовнішні матеріали, на які ведуть посилання (файли PDF, сторінки ROPS, відео YouTube і Vimeo), створюються не в сервісі — вони можуть не мати субтитрів, альтернативних описів або структури, доступної для екранних читачів.",
      "Описи інновацій і матеріалів зберігаються в базі польською. В англійській та українській версіях їх автоматично перекладає штучний інтелект, тому переклад може містити помилки.",
      "Відповіді чату, план упровадження та чернетки заявок створює штучний інтелект — вони можуть містити помилки або нечіткі формулювання.",
      "Диктування працює лише в браузерах із розпізнаванням мовлення (Chrome, Edge). В інших браузерах текст потрібно вводити вручну.",
    ],
    methodTitle: "Як ми перевірили доступність",
    method:
      "Самооцінка, проведена 4 жовтня 2026 р.: автоматичний аудит інструментом axe-core (правила WCAG 2.1 A і AA) одинадцяти основних сторінок — помилок не виявлено, перевірка порядку заголовків, перевірка відображення при ширині 320 px і ручне керування клавіатурою. Сервіс ще не проходив експертного аудиту чи тестування з користувачами.",
    featuresTitle: "Функції доступності",
    features: [
      "Увесь сервіс можна використовувати з клавіатури, зокрема карту повітів (повіт можна також вибрати зі списку).",
      "Помітна рамка фокуса (3 px, у режимі високого контрасту 4 px).",
      "Контраст тексту щонайменше 4,5:1, перевіряється автоматичним тестом.",
      "Посилання «Перейти до змісту» на початку кожної сторінки.",
      "Панель доступності: менший або більший шрифт, більші відступи та режим високого контрасту — налаштування запам’ятовуються.",
      "Обмеження анімацій, якщо в системі ввімкнено зменшення руху.",
      "Вміст уміщується на екрані шириною 320 px без горизонтальної прокрутки (масштаб до 400%).",
      "Діалогові вікна: закриття клавішею Esc, фокус лишається у вікні й повертається на кнопку, що його відкрила.",
      "Читання картки інновації вголос (синтезатор мовлення браузера).",
      "Диктування опису проблеми та ідеї (Chrome, Edge).",
      "Семантичні заголовки в правильному порядку, області сторінки та описи для екранних читачів біля іконок і кнопок.",
      "Інтерфейс трьома мовами: польською, англійською та українською.",
    ],
    contactTitle: "Зворотний зв’язок і контакт",
    contactLead:
      "Прототип ще не має призначеної контактної особи з питань доступності. Після запуску контакт забезпечить видавець сервісу — установа, яка поставила завдання:",
    ropsName: "Регіональний центр соціальної політики в Кракові",
    procedureTitle: "Процедура запитів і скарг",
    procedure: [
      "Кожен має право вимагати забезпечення цифрової доступності сторінки чи її елемента або надання вмісту іншим способом. Запит має містити дані заявника, вказівку на сторінку чи елемент і бажаний спосіб зв’язку.",
      "Публічний орган виконує запит невідкладно, не пізніше ніж через 7 днів після отримання. Якщо це неможливо, він повідомляє про це й призначає новий строк — не довший за 2 місяці — або пропонує альтернативний спосіб доступу до інформації.",
      "У разі відмови чи порушення строку можна подати скаргу до публічного органу, а після вичерпання цієї процедури — звернутися до Уповноваженого з прав людини Польщі (bip.brpo.gov.pl).",
    ],
    back: "Повернутися на головну",
  },
};

export default async function AccessibilityStatementPage() {
  const c = CONTENT[await getLocale()];
  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">{c.heading}</h1>

      <p className="mt-4 max-w-[65ch] text-lg">{c.intro}</p>

      <section className="mt-8 max-w-[65ch] space-y-4">
        <h2 className="text-xl font-bold text-foreground">{c.datesTitle}</h2>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
          {[c.published, c.updated].map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-bold text-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8 max-w-[65ch] space-y-4">
        <h2 className="text-xl font-bold text-foreground">{c.statusTitle}</h2>
        <p>
          {c.status[0]}
          <strong>{c.status[1]}</strong>
          {c.status[2]}
        </p>
      </section>

      <section className="mt-8 max-w-[65ch] space-y-4">
        <h2 className="text-xl font-bold text-foreground">{c.limitationsTitle}</h2>
        <ul className="list-disc space-y-2 pl-6">
          {c.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 max-w-[65ch] space-y-4">
        <h2 className="text-xl font-bold text-foreground">{c.featuresTitle}</h2>
        <ul className="list-disc space-y-2 pl-6">
          {c.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 max-w-[65ch] space-y-4">
        <h2 className="text-xl font-bold text-foreground">{c.methodTitle}</h2>
        <p>{c.method}</p>
      </section>

      <section className="mt-8 max-w-[65ch] space-y-4">
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
      </section>

      <section className="mt-8 max-w-[65ch] space-y-4">
        <h2 className="text-xl font-bold text-foreground">{c.procedureTitle}</h2>
        {c.procedure.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <Link href="/" className="mt-8 inline-flex min-h-12 items-center font-bold text-primary underline underline-offset-4">
        {c.back}
      </Link>
    </div>
  );
}
