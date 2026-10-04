"""Zastępuje demo-materiały edukacyjne w zasobnik.db realnymi danymi z ROPS Kraków.

Źródła:
 - 16 szkoleń ROPS "Dla kadr pomocy społecznej" (OPS, ŚDS, DPS)
 - 3 przewodniki metodyczne dot. innowacji społecznych w Małopolsce

Uruchom: python -m data.seed_zasobnik_edu
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlmodel import Session, select

from app.zasobnik.db import engine, init_db
from app.zasobnik.models import Resource, ResourceCreate, ResourceType
from app.zasobnik.services import create_resource

SOURCE_ROPS_KADRY = "ROPS Kraków – Materiały edukacyjne dla kadr pomocy społecznej"
SOURCE_ROPS_META = "ROPS Kraków – Biblioteka Innowacji Społecznych"
DEMO_SOURCE = "Dane przykładowe – do podmiany"
BASE = "https://rops.krakow.pl"

EDUCATION_RESOURCES: list[ResourceCreate] = [
    # ── Metodyczne przewodniki ────────────────────────────────────────────────
    ResourceCreate(
        type=ResourceType.education,
        title="Czym jest innowacja społeczna? Przewodnik dla gmin i organizacji",
        summary=(
            "Od pomysłu do wdrożenia — krok po kroku. Jak rozpoznać problem społeczny, "
            "zbudować rozwiązanie i przetestować je z odbiorcami."
        ),
        content=(
            "## Co to jest innowacja społeczna?\n"
            "Innowacja społeczna to nowe rozwiązanie (usługa, produkt, model pracy lub technologia), "
            "które skuteczniej od istniejących rozwiązuje ważny problem społeczny "
            "i jest skalowalne lub replikowane w innych miejscach.\n\n"
            "## Skąd czerpać przykłady?\n"
            "Biblioteka Innowacji Społecznych ROPS Kraków gromadzi ponad 130 przetestowanych rozwiązań "
            "w obszarach: seniorzy, dzieci i rodzina, niepełnosprawność, rynek pracy, zdrowie psychiczne, "
            "wykluczenie społeczne.\n\n"
            "## Krok 1 – Diagnoza problemu\n"
            "Zanim zaproponujesz rozwiązanie, opisz problem: kogo dotyczy, jak wielu ludzi, jakie są skutki. "
            "Dane z raportów regionalnych, rozmowy z beneficjentami, ankiety.\n\n"
            "## Krok 2 – Prototypowanie\n"
            "Pierwsza wersja rozwiązania nie musi być doskonała. Ważne, żeby testować ją jak najwcześniej "
            "z prawdziwymi odbiorcami i modyfikować na podstawie ich informacji zwrotnej.\n\n"
            "## Krok 3 – Testowanie\n"
            "Minimalny czas testowania to 3 miesiące. Zbieraj dane jakościowe i ilościowe. "
            "Inkubatory ROPS wspierają ten etap szkoleniami i mentoringiem.\n\n"
            "## Krok 4 – Upowszechnienie\n"
            "Udokumentuj metodę, opisz efekty, udostępnij innym gminom i organizacjom. "
            "Biblioteka Innowacji Społecznych ROPS jest idealnym miejscem do publikacji."
        ),
        tags=["przewodnik", "innowacja", "gmina", "metodyka"],
        source=SOURCE_ROPS_META,
        url=BASE + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych",
        area_slugs=[],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Inkubatory Innowacji Społecznych w Małopolsce — program POWER 4.1",
        summary=(
            "Jak działają inkubatory ROPS: wsparcie dla innowatorów od pomysłu do wdrożenia, "
            "dofinansowanie do 100 000 zł, mentoring i sieć partnerów."
        ),
        content=(
            "## Program POWER 4.1 — Innowacje społeczne\n"
            "Regionalny Ośrodek Polityki Społecznej w Krakowie prowadził w latach 2019–2022 "
            "dwa inkubatory innowacji społecznych w ramach Działania 4.1 POWER:\n\n"
            "- **Inkubator Dostępności** (2019–2022, wartość projektu: ~4 mln PLN) — "
            "skierowany do osób z niepełnosprawnościami. 9 innowacji przeszło pełny cykl testowania.\n"
            "- **Inkubator Włączenia Społecznego** — skierowany do osób wykluczonych. "
            "Innowacje obejmowały wsparcie osób bezdomnych, uzależnionych i z problemami psychiatrycznymi.\n\n"
            "## Jak wyglądało wsparcie?\n"
            "1. Nabór zgłoszeń — każdy mógł złożyć pomysł.\n"
            "2. Coaching i mentoring — praca z ekspertem przez 6–12 miesięcy.\n"
            "3. Dofinansowanie na testowanie — do 100 000 zł.\n"
            "4. Rada Innowacji Społecznych — niezależna ocena merytoryczna.\n"
            "5. Wejście do Biblioteki Innowacji Społecznych ROPS.\n\n"
            "## Przykładowe innowacje\n"
            "Wibraap (kamizelka wibracyjna dla niesłyszących), Hop Hop (mobilny plac zabaw "
            "dla dzieci z niepełnosprawnościami), Paszport pacjenta z chorobą rzadką — "
            "to tylko część z 9 innowacji wyłonionych przez Inkubator Dostępności."
        ),
        tags=["inkubator", "POWER", "dofinansowanie", "metodyka"],
        source=SOURCE_ROPS_META,
        attachment_url=BASE + "/mpliki/IS/ikony_PUBLIKACJE/Innowacje_spoleczne_dla_dostepnosci.pdf",
        url=BASE + "/innowacje-spoleczne/inkubatory-innowacji-spolecznych",
        area_slugs=["niepelnosprawnosc", "ubostwo"],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Jak przetestować innowację społeczną — metodologia oceny ROPS",
        summary=(
            "Kryteria oceny Rady Innowacji Społecznych, wskaźniki skuteczności i "
            "dokumentowanie wyników dla biblioteki ROPS."
        ),
        content=(
            "## Rada Innowacji Społecznych\n"
            "Każda innowacja wchodząca do Biblioteki ROPS przechodzi ocenę "
            "Rady Innowacji Społecznych — zespołu ekspertów z obszarów: "
            "polityka społeczna, prawo, biznes społeczny, doświadczeni testerzy.\n\n"
            "## Kryteria oceny\n"
            "- **Trafność** — czy rozwiązuje realny problem grupy docelowej?\n"
            "- **Skuteczność** — czy działa? (dane z testowania)\n"
            "- **Wykonalność** — czy można wdrożyć przy realistycznym budżecie?\n"
            "- **Skalowalność** — czy inne gminy/organizacje mogą to powtórzyć?\n"
            "- **Innowacyjność** — czy jest lepsze od istniejących rozwiązań?\n\n"
            "## Dokumentowanie testowania\n"
            "Wymagana dokumentacja: opis grupy docelowej, liczba testerów, "
            "metodologia zbierania informacji zwrotnej, zestawienie wyników, "
            "przykłady i rekomendacje dla replikatorów.\n\n"
            "## Wskaźniki ilościowe\n"
            "Dla każdej innowacji zbierane są: liczba testerów, czas testowania (miesiące), "
            "koszt wdrożenia (niski/średni/wysoki), region pierwszego wdrożenia."
        ),
        tags=["metodologia", "testowanie", "ocena", "wskaźniki"],
        source=SOURCE_ROPS_META,
        url=BASE + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych",
        area_slugs=[],
    ),

    # ── Szkolenia dla pracowników socjalnych (OPS) ────────────────────────────
    ResourceCreate(
        type=ResourceType.education,
        title="Społeczne aspekty pracy z osobami z zaburzeniami psychicznymi",
        summary="Szkolenie ROPS dla pracowników socjalnych OPS: rozumienie zaburzeń psychicznych, budowanie relacji z klientem i ograniczenia stygmatyzacji.",
        content=(
            "## Dla kogo\n"
            "Pracownicy socjalni ośrodków pomocy społecznej (OPS) mający kontakt z osobami "
            "z zaburzeniami psychicznymi.\n\n"
            "## Zakres tematyczny\n"
            "- Podstawowe kategorie zaburzeń psychicznych i ich objawy społeczne\n"
            "- Prawa pacjenta i prawa klienta pomocy społecznej\n"
            "- Jak budować relację terapeutyczną bez stygmatyzowania\n"
            "- Granice kompetencji pracownika socjalnego — kiedy kierować do psychiatry\n"
            "- Współpraca z centrum zdrowia psychicznego i ŚDS\n\n"
            "## Źródło\n"
            "Materiał szkoleniowy ROPS Kraków — seria szkoleń dla kadr OPS."
        ),
        tags=["szkolenie", "pracownicy socjalni", "zdrowie psychiczne", "OPS"],
        source=SOURCE_ROPS_KADRY,
        url=BASE + "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,szkolenie-spoleczne-aspekty-pracy-z-osobami-z-zaburzeniami-psychicznymi",
        area_slugs=["zdrowie-psychiczne"],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Dialog Motywujący w pracy socjalnej",
        summary='Metoda "Dialogu Motywującego" — jak wspierać klienta w zmianie zachowania bez wywierania presji i wyręczania.',
        content=(
            "## Dla kogo\n"
            "Pracownicy socjalni OPS pracujący z tzw. trudnymi klientami — osobami opornymi "
            "na zmianę lub wielokrotnie powracającymi po wsparcie.\n\n"
            "## Dialog Motywujący (DM)\n"
            "DM to udowodniona naukowo metoda rozmowy, która wzmacnia wewnętrzną motywację "
            "klienta do zmiany. Zamiast perswazji używa aktywnego słuchania, refleksji "
            "i zadawania otwartych pytań.\n\n"
            "## Zakres tematyczny\n"
            "- Cztery zasady DM: partnerstwo, akceptacja, współczucie, wywoływanie\n"
            "- Rozpoznawanie 'mowy zmiany' u klienta\n"
            "- Jak nie wzmacniać oporu (pułapki dyrektywności)\n"
            "- Praktyczne ćwiczenia z case studies\n\n"
            "## Dwa szkolenia ROPS w tej serii\n"
            "1. 'Trudny klient czy trudności klienta — Dialog Motywujący w pracy socjalnej'\n"
            "2. 'Klient w procesie zmian — jak skutecznie reagować na jego postawy'"
        ),
        tags=["szkolenie", "dialog motywujący", "metoda", "OPS", "zmiana"],
        source=SOURCE_ROPS_KADRY,
        url=BASE + "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,trudny-klient-czy-trudnosci-klienta-wykorzystanie-w-pracy-socjalnej-metody-dialogu-motywujacego",
        area_slugs=["aktywizacja-zawodowa"],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Stres i wypalenie zawodowe — jak radzić sobie w pomocy społecznej",
        summary="Materiał edukacyjny ROPS dla wszystkich kadr OPS, ŚDS i DPS: rozpoznawanie wypalenia, techniki redukcji stresu i superwizja jako narzędzie profilaktyki.",
        content=(
            "## Dla kogo\n"
            "Pracownicy socjalni, kadra Środowiskowych Domów Samopomocy, personel Domów Pomocy Społecznej.\n\n"
            "## Wypalenie zawodowe w pomocy społecznej\n"
            "Praca z osobami w trudnych sytuacjach życiowych generuje ryzyko 'wypalenia wtórnego' "
            "i 'zmęczenia współczuciem'. To nie jest słabość — to zmęczenie układu nerwowego "
            "wywołane stałą ekspozycją na cudze cierpienie.\n\n"
            "## Co obejmuje szkolenie\n"
            "- Fazy wypalenia wg modelu Freudenbergera i Maslach\n"
            "- Praktyczne techniki radzenia sobie ze stresem (mindfulness, granice, rytm dnia)\n"
            "- Rola superwizji grupowej i indywidualnej\n"
            "- Jak rozmawiać z przełożonym o przeciążeniu\n\n"
            "## Superwizja dla ŚDS\n"
            "ROPS prowadzi cykl superwizji dla kadr Środowiskowych Domów Samopomocy — "
            "zob. materiał 'Superwizja dla kadr ŚDS'."
        ),
        tags=["szkolenie", "wypalenie zawodowe", "stres", "superwizja", "OPS"],
        source=SOURCE_ROPS_KADRY,
        url=BASE + "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,stres-i-wypalenie-zawodowe-jak-mozna-radzic-sobie-z-problemami-zawodowymi",
        area_slugs=[],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Praca z klientem uzależnionym — specyfika i budowanie planu wsparcia",
        summary="Szkolenie ROPS dla pracowników socjalnych: jak rozumieć mechanizmy uzależnienia i budować plan wsparcia dla osoby z problemem alkoholowym lub narkotykowym.",
        content=(
            "## Dla kogo\n"
            "Pracownicy socjalni OPS, asystenci rodziny, kuratorzy.\n\n"
            "## Uzależnienie jako choroba, nie wybór\n"
            "Uzależnienie ma podstawy neurobiologiczne — nie jest efektem złej woli. "
            "To fundamentalne założenie, od którego zależy skuteczność pracy socjalnej.\n\n"
            "## Zakres szkolenia\n"
            "- Mechanizmy uzależnienia: fazy, zaprzeczanie, nawroty\n"
            "- Specyfika rozmowy z osobą aktywnie uzależnioną\n"
            "- Jak budować plan wsparcia, który uwzględnia etap zmiany\n"
            "- Kiedy kierować do specjalistycznych placówek lecznictwa uzależnień\n"
            "- Praca z rodziną osoby uzależnionej (współuzależnienie)\n\n"
            "## Powiązane materiały\n"
            "Dialog Motywujący — metoda szczególnie skuteczna w pracy z osobami uzależnionymi."
        ),
        tags=["szkolenie", "uzależnienia", "alkohol", "plan wsparcia", "OPS"],
        source=SOURCE_ROPS_KADRY,
        url=BASE + "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,specyfika-pracy-z-klientem-uzaleznionym-w-kontekscie-budowania-planu-wsparcia",
        area_slugs=["zdrowie-psychiczne"],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Integracja społeczna osób po odbyciu kary — jak wspierać powrót do społeczeństwa",
        summary="Szkolenie ROPS: wpływ wsparcia otoczenia na integrację społeczną osób opuszczających jednostki penitencjarne. Rola pracownika socjalnego i OPS.",
        content=(
            "## Dla kogo\n"
            "Pracownicy socjalni OPS w gminach z dużą liczbą osób opuszczających zakłady karne.\n\n"
            "## Problem\n"
            "Osoby opuszczające jednostki penitencjarne to jedna z najbardziej wykluczonych grup. "
            "Brak mieszkania, przerwa w zatrudnieniu, zerwane relacje rodzinne — te bariery "
            "prowadzą do recydywy i bezdomności.\n\n"
            "## Co obejmuje szkolenie\n"
            "- Prawne ramy wsparcia (pomoc postpenitencjarna)\n"
            "- Jak nawiązać kontakt z osobą wychodzącą z zakładu karnego\n"
            "- Budowanie sieci wsparcia (rodzina, sąsiedztwo, pracodawcy)\n"
            "- Współpraca z kuratorami sądowymi i służbą więzienną\n"
            "- Ścieżka aktywizacji zawodowej"
        ),
        tags=["szkolenie", "reintegracja", "wykluczenie", "OPS"],
        source=SOURCE_ROPS_KADRY,
        url=BASE + "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,wplyw-wsparcia-otoczenia-osoby-osadzonej-w-jednostce-penitencjarnej-na-proces-integracji-spolecznej",
        area_slugs=["ubostwo"],
    ),

    # ── Szkolenia dla kadr ŚDS ─────────────────────────────────────────────────
    ResourceCreate(
        type=ResourceType.education,
        title="Motywowanie uczestników ŚDS — Dialog Motywujący w centrum zdrowia psychicznego",
        summary="Szkolenie ROPS dla kadr Środowiskowych Domów Samopomocy: jak stosować metodę Dialogu Motywującego do zwiększania zaangażowania uczestników w terapię.",
        content=(
            "## Dla kogo\n"
            "Kadra terapeutyczna i instruktorzy terapii zajęciowej w Środowiskowych Domach Samopomocy.\n\n"
            "## Problem\n"
            "Osoby ze schorzeniami psychicznymi uczestniczące w programach ŚDS często "
            "wykazują niską motywację wewnętrzną, ambiwalencję wobec zmiany lub opór. "
            "Tradycyjne podejścia dyrektywne pogłębiają opór.\n\n"
            "## Dialog Motywujący w praktyce ŚDS\n"
            "- Zastosowanie DM w indywidualnych rozmowach z uczestnikiem\n"
            "- Jak rozmawiać z opiekunem/rodziną, żeby wzmacniać, nie wyręczać\n"
            "- Praca grupowa z elementami DM\n"
            "- Dokumentowanie rozmów motywujących w IPD (indywidualnym planie działania)"
        ),
        tags=["szkolenie", "ŚDS", "dialog motywujący", "zdrowie psychiczne"],
        source=SOURCE_ROPS_KADRY,
        url=BASE + "/dla-kadr-pomocy-spolecznej/srodowiskowe-domy-samopomocy-materialy-edukacyjne,sposoby-motywowania-uczestnikow-srodowiskowych-domow-samopomocy-do-aktywnego-uczestnictwa-w-procesie-terapeutycznym-z-wykorzystaniem-metody-dialogu-motywujacego",
        area_slugs=["zdrowie-psychiczne", "niepelnosprawnosc"],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Przemoc psychiczna wobec osób z niepełnosprawnością intelektualną — rozpoznanie i wsparcie",
        summary="Szkolenie ROPS dla kadr ŚDS: jak rozpoznawać przemoc psychiczną wobec uczestników, metody wsparcia ofiar i sposoby przeciwdziałania.",
        content=(
            "## Dla kogo\n"
            "Kadra Środowiskowych Domów Samopomocy pracująca z osobami z niepełnosprawnością "
            "intelektualną i chorobami psychicznymi.\n\n"
            "## Problem\n"
            "Osoby z niepełnosprawnością intelektualną są szczególnie narażone na przemoc psychiczną "
            "— ze strony opiekunów, rówieśników i rodziny. Trudność: często nie potrafią jej opisać.\n\n"
            "## Zakres szkolenia\n"
            "- Definicja i formy przemocy psychicznej\n"
            "- Wskaźniki ostrzegawcze (zmiana zachowania, regresja, samookaleczenia)\n"
            "- Jak prowadzić rozmowę z osobą podejrzaną o bycie ofiarą przemocy\n"
            "- Procedury interwencyjne i prawne\n"
            "- Współpraca z policją i sądem rodzinnym"
        ),
        tags=["szkolenie", "przemoc", "ŚDS", "niepełnosprawność", "ochrona"],
        source=SOURCE_ROPS_KADRY,
        url=BASE + "/dla-kadr-pomocy-spolecznej/srodowiskowe-domy-samopomocy-materialy-edukacyjne,seminarium-pn-przemoc-psychiczna-wobec-osob-uposledzonych-umyslowo-i-chorujacych-psychicznie-rozpoznanie-metody-wsparcia-sposoby-przeciwdzialania",
        area_slugs=["niepelnosprawnosc", "zdrowie-psychiczne"],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Wzbudzanie aktywności wśród seniorów w DPS i dziennych domach pomocy",
        summary="Seminarium ROPS dla kadr DPS i ŚDS: metody aktywizacji mieszkańców domów pomocy — aktywność fizyczna, kulturalna i społeczna jako sposób na poprawę jakości życia.",
        content=(
            "## Dla kogo\n"
            "Opiekunowie, terapeuci zajęciowi i kierownicy Domów Pomocy Społecznej "
            "oraz Placówek Wsparcia Dziennego dla seniorów.\n\n"
            "## Problem\n"
            "Nadmierna bierność i izolacja wewnątrz DPS prowadzi do przyspieszenia otępienia, "
            "depresji i pogorszenia sprawności fizycznej mieszkańców.\n\n"
            "## Zakres seminarium\n"
            "- Podstawy geroterapii i terapii zajęciowej dla seniorów\n"
            "- Aktywność fizyczna dostosowana do poziomu sprawności (ćwiczenia w fotelu, Nordic Walking)\n"
            "- Aktywizacja twórcza: plastyka, rękodzieło, muzykoterapia\n"
            "- Budowanie relacji społecznych: wolontariat seniorski, grupy samopomocowe\n"
            "- Jak zaangażować rodziny w życie DPS-u"
        ),
        tags=["szkolenie", "seniorzy", "DPS", "aktywizacja", "terapia zajęciowa"],
        source=SOURCE_ROPS_KADRY,
        url=BASE + "/dla-kadr-pomocy-spolecznej/srodowiskowe-domy-samopomocy-materialy-edukacyjne,seminarium-pn-wzbudzanie-aktywnosci-wsrod-seniorow-mieszkancow-domow-pomocy-spolecznej-oraz-uczestnikow-placowek-wsparcia-dziennego",
        area_slugs=["seniorzy"],
    ),

    # ── Szkolenia dla kadr DPS ─────────────────────────────────────────────────
    ResourceCreate(
        type=ResourceType.education,
        title="Metody pracy z seniorem — schorzenia wieku podeszłego w DPS",
        summary="Szkolenie ROPS dla personelu DPS: jak dostosować metody pracy i opiekę do najczęstszych schorzeń geriatrycznych — demencja, choroba Parkinsona, cukrzyca, upadki.",
        content=(
            "## Dla kogo\n"
            "Opiekunowie, pielęgniarki i terapeuci w Domach Pomocy Społecznej.\n\n"
            "## Zakres szkolenia\n"
            "- Demencja i choroba Alzheimera: etapy, komunikacja, bezpieczeństwo\n"
            "- Choroba Parkinsona: pomoc w codziennych czynnościach, zapobieganie upadkom\n"
            "- Cukrzyca u seniorów: dieta, monitoring, stopa cukrzycowa\n"
            "- Depresja geriatryczna: rozpoznanie i wsparcie\n"
            "- Komunikacja z osobami z zaburzeniami poznawczymi\n\n"
            "## Podejście zorientowane na osobę\n"
            "Szkolenie promuje podejście 'person-centred care' — "
            "indywidualne plany opieki oparte na historii życia, wartościach i preferencjach mieszkańca."
        ),
        tags=["szkolenie", "seniorzy", "DPS", "geriatria", "demencja"],
        source=SOURCE_ROPS_KADRY,
        url=BASE + "/dla-kadr-pomocy-spolecznej/domy-pomocy-spolecznej-materialy-edukacyjne,metody-pracy-z-seniorem-z-uwzglednieniem-najczesciej-wystepujacych-schorzen-wieku-podeszleg",
        area_slugs=["seniorzy"],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Duński model opieki nad seniorem — jak przenieść go do polskiego DPS",
        summary="Szkolenie ROPS: jak zastosować duńskie standardy opieki ('free choice', aktywizacja zamiast wyręczania, indywidualny plan opieki) w polskich Domach Pomocy Społecznej.",
        content=(
            "## Dla kogo\n"
            "Kierownicy i kadra DPS, koordynatorzy opieki.\n\n"
            "## Na czym polega model duński?\n"
            "Duński system opieki nad seniorami opiera się na trzech filarach:\n"
            "1. **'Free choice'** — senior sam wybiera usługodawcę spośród certyfikowanych podmiotów\n"
            "2. **Aktywizacja zamiast wyręczania** — pomoc wyłącznie tam, gdzie senior naprawdę nie daje rady\n"
            "3. **Plan opieki zorientowany na cel** — każdy senior ma plan z własnym celem "
            "(np. 'samodzielne gotowanie obiadu')\n\n"
            "## Co jest adaptowalnego w polskich realiach?\n"
            "- Indywidualny plan opieki jako dokument żywy (nie tylko formalność)\n"
            "- Szkolenie personelu z 'aktywizującej opieki'\n"
            "- Włączanie rodziny do planowania i ewaluacji opieki\n\n"
            "## Dlaczego to ważne?\n"
            "Podejście aktywizujące zmniejsza tempo utraty sprawności, "
            "poprawia samopoczucie i redukuje koszty opieki długoterminowej."
        ),
        tags=["szkolenie", "seniorzy", "DPS", "model duński", "aktywizacja"],
        source=SOURCE_ROPS_KADRY,
        url=BASE + "/dla-kadr-pomocy-spolecznej/domy-pomocy-spolecznej-materialy-edukacyjne,wsparcie-domow-pomocy-spolecznej-w-oparciu-o-dunski-model-pracy",
        area_slugs=["seniorzy"],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Profesjonalne wspieranie seniora w życiu codziennym",
        summary="Szkolenie ROPS dla personelu DPS: granica między asystencją a wyręczaniem, techniki podtrzymywania samodzielności i radzenia sobie z oporem seniora.",
        content=(
            "## Dla kogo\n"
            "Opiekunowie DPS i asystenci osób starszych.\n\n"
            "## Pułapka nadopiekuńczości\n"
            "Wyręczanie seniora — nawet z troski — przyspiesza utratę sprawności. "
            "Zasada '5P': Poczekaj, Pozwól, Podpowiedz, Powtórz, Pomóż.\n\n"
            "## Zakres szkolenia\n"
            "- Jak ocenić, w czym senior naprawdę potrzebuje pomocy\n"
            "- Techniki pielęgnacyjne przyjazne pacjentowi (transfer, pionizacja)\n"
            "- Komunikacja z osobą z demencją\n"
            "- Jak radzić sobie z odmową jedzenia, kąpieli, leków\n"
            "- Dokumentowanie zmian stanu mieszkańca\n\n"
            "## Powiązane materiały\n"
            "Zob. też 'Metody pracy z seniorem' i 'Model duński' z tej samej serii ROPS."
        ),
        tags=["szkolenie", "seniorzy", "DPS", "samodzielność", "pielęgnacja"],
        source=SOURCE_ROPS_KADRY,
        url=BASE + "/dla-kadr-pomocy-spolecznej/domy-pomocy-spolecznej-materialy-edukacyjne,profesjonalne-wspieranie-w-zyciu-codziennym-seniora",
        area_slugs=["seniorzy"],
    ),
]


def main() -> None:
    init_db()

    with Session(engine) as session:
        # Usuń demo-materiały edukacyjne
        demos = session.exec(
            select(Resource).where(
                Resource.type == ResourceType.education,
                Resource.source == DEMO_SOURCE,
            )
        ).all()
        for demo in demos:
            session.delete(demo)
        session.flush()
        removed = len(demos)

        # Dodaj realne materiały (upsert po type+title)
        added = updated = 0
        for data in EDUCATION_RESOURCES:
            existing = session.exec(
                select(Resource).where(
                    Resource.type == data.type,
                    Resource.title == data.title,
                )
            ).first()
            if existing:
                from app.zasobnik.services import update_resource
                update_resource(session, existing, data)
                updated += 1
            else:
                create_resource(session, data)
                added += 1
            session.flush()

        session.commit()

    print(f"Usunięto {removed} demo-rekordów.")
    print(f"Dodano {added}, zaktualizowano {updated} materiałów edukacyjnych.")
    print(f"Razem w zasobniku (education): {added + updated} rekordów.")


if __name__ == "__main__":
    main()
