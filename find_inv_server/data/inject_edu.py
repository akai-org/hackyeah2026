"""Dołącza do parsed_innovations.json rekordy z:
1. Inkubatora Dostępności (PDF) - 9 szczegółowych innowacji
2. Materiałów edukacyjnych dla kadr pomocy społecznej (17 tytułów)

Uruchom: python -m data.inject_edu
"""
import json
from pathlib import Path

OUT = Path(__file__).parent / "parsed_innovations.json"
BASE_ROPS = "https://rops.krakow.pl"

# ── 1. Inkubator Dostępności – innowacje z PDF ──────────────────────────────

PDF_INNOVATIONS = [
    {
        "title": "Wibraap — instrument elektroniczny i aplikacja do odczuwania dźwięku przez wibracje",
        "short_desc": "Urządzenie elektroniczne (kamizelka + aplikacja), które przetwarza dźwięki na wibracje odczuwalne przez ciało — umożliwia osobom niesłyszącym pozasłuchowe doświadczanie muzyki.",
        "full_desc": (
            "Na czym polega: Wibraap to zestaw składający się z wibrującej kamizelki i aplikacji mobilnej/komputerowej. "
            "Przetwarza dowolne dźwięki (mikrofon, własne próbki, instrument elektroniczny) na wibracje wyczuwalne przez ciało. "
            "Zaprojektowana zgodnie ze standardem WCAG, działa na Android i Windows.\n\n"
            "Grupa docelowa: Osoby niesłyszące i niedosłyszące, osoby z niepełnosprawnością sprzężoną.\n\n"
            "Skuteczność: Pozytywnie zaopiniowana przez Radę Innowacji Społecznych. Testowana z użytkownikami Głuchymi — "
            "wysoka ocena komfortu i inkluzywności na wydarzeniach muzycznych."
        ),
        "category": "niepełnosprawność sensoryczna",
        "categories": ["niepełnosprawność sensoryczna"],
        "area": "niepełnosprawność sensoryczna",
        "target_group": "Osoby niesłyszące i niedosłyszące.",
        "location": "Małopolska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": None,
        "testers_count": 0,
        "where_implemented": "Małopolska",
        "who_can_use": "Osoby niesłyszące, niedosłyszące, placówki kulturalne, szkoły muzyczne.",
        "source_url": BASE_ROPS + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-sensoryczna",
        "video_url": None,
        "materials_url": BASE_ROPS + "/mpliki/IS/ikony_PUBLIKACJE/Innowacje_spoleczne_dla_dostepnosci.pdf",
        "project": "Inkubator Dostępności",
        "authors": "Piotr Peszat",
        "tags": ["niepełnosprawność", "dostępność", "wykluczenie_cyfrowe"],
    },
    {
        "title": "Strażnik — aplikacja mobilna wykrywająca alarmy dźwiękowe dla osób niesłyszących",
        "short_desc": "Aplikacja mobilna współpracująca z opaską/smartwatchem — wykrywa dźwiękowe sygnały alarmowe (pożar, tlenek węgla) i powiadamia osobę niesłyszącą przez wibracje.",
        "full_desc": (
            "Na czym polega: Aplikacja 'Strażnik' wykrywa dźwięki alarmowe z otoczenia i powiadamia użytkownika przez wibracje w opasce, "
            "latarkę w telefonie lub połączenie alarmowe do wskazanej osoby. Rozwiązuje problem braku percepcji alarmów dźwiękowych u osób Głuchych — "
            "szczególnie w nocy, gdy nie korzystają z aparatów słuchowych.\n\n"
            "Grupa docelowa: Osoby niesłyszące i niedosłyszące.\n\n"
            "Skuteczność: Pozytywnie zaopiniowana przez Radę Innowacji Społecznych. Testujące osoby oceniły jako kluczowe narzędzie bezpieczeństwa."
        ),
        "category": "niepełnosprawność sensoryczna",
        "categories": ["niepełnosprawność sensoryczna"],
        "area": "niepełnosprawność sensoryczna",
        "target_group": "Osoby niesłyszące i niedosłyszące.",
        "location": "Małopolska",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": None,
        "testers_count": 0,
        "where_implemented": "Małopolska",
        "who_can_use": "Osoby niesłyszące i niedosłyszące, opiekunowie.",
        "source_url": BASE_ROPS + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-sensoryczna",
        "video_url": None,
        "materials_url": BASE_ROPS + "/mpliki/IS/ikony_PUBLIKACJE/Innowacje_spoleczne_dla_dostepnosci.pdf",
        "project": "Inkubator Dostępności",
        "authors": "Marcin Kotliński",
        "tags": ["niepełnosprawność", "dostępność", "wykluczenie_cyfrowe"],
    },
    {
        "title": "Hop Hop – mobilny plac zabaw wspierający rehabilitację dzieci w domu",
        "short_desc": "Zestaw meblo-zabawek z scenariuszami ćwiczeń, umożliwiający domową rehabilitację dzieci w wieku przedszkolnym z zaburzeniami integracji sensorycznej i niepełnosprawnościami ruchowymi.",
        "full_desc": (
            "Na czym polega: Mobilny plac zabaw składa się ze scenariuszy zabaw rehabilitacyjnych oraz zestawu meblo-zabawek do ćwiczeń ruchowych. "
            "Wspomaga terapię dzieci z trudnościami motoryki dużej, zaburzeniami integracji sensorycznej i wadami postawy. "
            "Umożliwia rehabilitację w warunkach domowych bez konieczności specjalistycznej wizyty.\n\n"
            "Grupa docelowa: Dzieci w wieku przedszkolnym z zaburzeniami integracji sensorycznej, niepełnosprawnościami ruchowymi. Przedszkola, gabinety SI, fizjoterapeuci.\n\n"
            "Skuteczność: Pozytywnie zaopiniowana przez Radę Innowacji Społecznych. Testujący fizjoterapeuci i rodzice ocenili jako elastyczne i intuicyjne narzędzie."
        ),
        "category": "dzieci, młodzież i rodzina",
        "categories": ["dzieci, młodzież i rodzina", "dostępność i mobilność"],
        "area": "dzieci, młodzież i rodzina",
        "target_group": "Dzieci w wieku przedszkolnym z zaburzeniami integracji sensorycznej, niepełnosprawnościami ruchowymi, wadami postawy.",
        "location": "Małopolska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": None,
        "testers_count": 0,
        "where_implemented": "Małopolska",
        "who_can_use": "Rodziny, przedszkola, gabinety integracji sensorycznej, fizjoterapeuci.",
        "source_url": BASE_ROPS + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-o-ograniczonej-mobilnosci",
        "video_url": None,
        "materials_url": BASE_ROPS + "/mpliki/IS/ikony_PUBLIKACJE/Innowacje_spoleczne_dla_dostepnosci.pdf",
        "project": "Inkubator Dostępności",
        "authors": "Aleksandra Satława",
        "tags": ["dzieci", "niepełnosprawność", "dostępność", "edukacja"],
    },
    {
        "title": "Himalaje Autyzmu — model pracy przygotowujący osoby neuroatypowe do wizyt medycznych",
        "short_desc": "Przetestowane scenariusze i metody pracy asystenta, umożliwiające osobom z autyzmem i zachowaniami trudnymi bezstresowe przejście procedur medycznych.",
        "full_desc": (
            "Na czym polega: Model pracy asystenta z osobą neuroatypową (autyzm, ADHD, niepełnosprawność intelektualna) przejawiającą zachowania trudne. "
            "Obejmuje serię spotkań z pacjentem i opiekunem, przygotowanie scenariusza wizyt lekarskich, współpracę z personelem medycznym. "
            "Redukuje stres, umożliwia diagnostykę i leczenie wcześniej niedostępne.\n\n"
            "Grupa docelowa: Osoby neuroatypowe (autyzm, ADHD) przejawiające zachowania agresywne/autoagresywne. Opiekunowie, rodzice, personel medyczny.\n\n"
            "Skuteczność: Pozytywnie zaopiniowana przez Radę Innowacji Społecznych. Skrócenie czasu oczekiwania na badania z 4 lat do 3 miesięcy w jednym przypadku."
        ),
        "category": "niepełnosprawność intelektualna",
        "categories": ["niepełnosprawność intelektualna", "zdrowie i medycyna"],
        "area": "niepełnosprawność intelektualna",
        "target_group": "Osoby neuroatypowe z autyzmem, ADHD, niepełnosprawnością intelektualną. Personel medyczny, opiekunowie.",
        "location": "Małopolska",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": None,
        "testers_count": 0,
        "where_implemented": "Małopolska",
        "who_can_use": "Placówki medyczne, asystenci osoby niepełnosprawnej, rodzice dzieci neuroatypowych.",
        "source_url": BASE_ROPS + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-intelektualna",
        "video_url": None,
        "materials_url": BASE_ROPS + "/mpliki/IS/ikony_PUBLIKACJE/Innowacje_spoleczne_dla_dostepnosci.pdf",
        "project": "Inkubator Dostępności",
        "authors": 'Chrześcijańskie Stowarzyszenie Osób Niepełnosprawnych, Ich Rodzin i Przyjaciół "Ognisko"',
        "tags": ["niepełnosprawność", "zdrowie_psychiczne", "dzieci", "edukacja"],
    },
    {
        "title": "Gra o zdrowie — terapeutyczna gra planszowa aktywizująca zawodowo osoby z zaburzeniami psychicznymi",
        "short_desc": "Gra planszowa wymagająca wcielania się w role z rynku pracy, przygotowująca osoby po kryzysach psychicznych do podjęcia zatrudnienia.",
        "full_desc": (
            "Na czym polega: Terapeutyczna gra planszowa dedykowana osobom z doświadczeniem problemów ze zdrowiem psychicznym. "
            "Gracze wcielają się w role (pracownik, pracodawca, kandydat), odkrywają swój potencjał zawodowy i przygotowują się do wyzwań rynku pracy. "
            "Gra zawiera karty społeczne, prawne i finansowe, karty dotyczące instytucji i urzędów, podręcznik edukacyjny. "
            "Elementy dostępne cyfrowo i fizycznie zgodnie ze standardami WCAG.\n\n"
            "Grupa docelowa: Osoby z zaburzeniami psychicznymi, dzienne oddziały psychiatryczne, WTZ.\n\n"
            "Skuteczność: Pozytywnie zaopiniowana przez Radę Innowacji Społecznych. Uczestnicy testów grali 4h — oceniali jako skuteczne narzędzie oswajania tematu pracy."
        ),
        "category": "rynek pracy",
        "categories": ["rynek pracy", "zdrowie i medycyna"],
        "area": "rynek pracy",
        "target_group": "Osoby z zaburzeniami psychicznymi doświadczające kryzysów psychicznych. Dzienne oddziały psychiatryczne, WTZ.",
        "location": "Małopolska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": None,
        "testers_count": 0,
        "where_implemented": "Małopolska",
        "who_can_use": "Terapeuci, psycholodzy, pracownicy WTZ, dzienne oddziały psychiatryczne.",
        "source_url": BASE_ROPS + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-rynku-pracy",
        "video_url": None,
        "materials_url": BASE_ROPS + "/mpliki/IS/ikony_PUBLIKACJE/Innowacje_spoleczne_dla_dostepnosci.pdf",
        "project": "Inkubator Dostępności",
        "authors": "Paulina Dąbrowska",
        "tags": ["rynek_pracy", "zdrowie_psychiczne", "edukacja", "niepełnosprawność"],
    },
    {
        "title": "Zakupy na jednym wózku — wózek zakupowy dostosowany dla dzieci z niepełnosprawnością ruchową",
        "short_desc": "Wózek zakupowy z wyprofilowanym siedziskiem, zagłówkiem i pasami bezpieczeństwa, umożliwiający dzieciom z mózgowym porażeniem dziecięcym udział w zakupach rodzinnych.",
        "full_desc": (
            "Na czym polega: Dostosowanie siedziska w wózku zakupowym do potrzeb dziecka z niepełnosprawnością ruchową. "
            "Wózek posiada specjalne siedzisko z profilowanymi gąbkami stabilizacyjnymi, pięciopunktowe pasy bezpieczeństwa, zagłówek i stabilizator odcinka lędźwiowego. "
            "Umożliwia dziecku uczestnictwo w zakupach, samodzielny wybór produktów, budowanie kompetencji społecznych.\n\n"
            "Grupa docelowa: Dzieci z niepełnosprawnością ruchową (mózgowe porażenie dziecięce). Rodzice, opiekunowie. Supermarkety.\n\n"
            "Skuteczność: Pozytywnie zaopiniowana przez Radę Innowacji Społecznych. Rodzice i dzieci ocenili jako znaczące zwiększenie samodzielności."
        ),
        "category": "dostępność i mobilność",
        "categories": ["dostępność i mobilność", "dzieci, młodzież i rodzina"],
        "area": "dostępność i mobilność",
        "target_group": "Dzieci z niepełnosprawnością ruchową i ich rodziny.",
        "location": "Małopolska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": None,
        "testers_count": 0,
        "where_implemented": "Małopolska",
        "who_can_use": "Sklepy wielkopowierzchniowe, rodziny dzieci z niepełnosprawnością ruchową.",
        "source_url": BASE_ROPS + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-o-ograniczonej-mobilnosci",
        "video_url": None,
        "materials_url": BASE_ROPS + "/mpliki/IS/ikony_PUBLIKACJE/Innowacje_spoleczne_dla_dostepnosci.pdf",
        "project": "Inkubator Dostępności",
        "authors": 'Jolanta Fień, Fundacja "APROBATA"',
        "tags": ["niepełnosprawność", "dostępność", "dzieci", "rodzina"],
    },
    {
        "title": "Wsparcie imprez masowych — modułowe maty naprowadzające dla osób niewidomych",
        "short_desc": "Modułowe maty z liniami wodzącymi i polami uwagi, tworzące bezpieczne ścieżki poruszania się dla osób z dysfunkcją wzroku na koncertach, festiwalach i w budynkach.",
        "full_desc": (
            "Na czym polega: Modułowe maty antypoślizgowe z fakturowymi oznaczeniami, liniami wodzącymi i polami uwagi "
            "tworzone z kontrastu kolorystycznego (żółte podłoże, żółto-czarne ostrzeżenia). "
            "Dołączony podręcznik dla organizatorów imprez masowych. Nie utrudniają korzystania osobom na wózkach inwalidzkich.\n\n"
            "Grupa docelowa: Osoby niewidome i niedowidzące. Organizatorzy imprez masowych, instytucje kultury.\n\n"
            "Skuteczność: Pozytywnie zaopiniowana przez Radę Innowacji Społecznych. Użytkownicy ocenili jako wyraźne i czytelne wsparcie w samodzielnym poruszaniu się."
        ),
        "category": "niepełnosprawność sensoryczna",
        "categories": ["niepełnosprawność sensoryczna", "dostępność i mobilność"],
        "area": "niepełnosprawność sensoryczna",
        "target_group": "Osoby niewidome i niedowidzące. Organizatorzy wydarzeń kulturalnych.",
        "location": "Małopolska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": None,
        "testers_count": 0,
        "where_implemented": "Małopolska",
        "who_can_use": "Organizatorzy imprez masowych, instytucje kultury, szkoły.",
        "source_url": BASE_ROPS + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-sensoryczna",
        "video_url": None,
        "materials_url": BASE_ROPS + "/mpliki/IS/ikony_PUBLIKACJE/Innowacje_spoleczne_dla_dostepnosci.pdf",
        "project": "Inkubator Dostępności",
        "authors": "Tomasz Koźmiński",
        "tags": ["niepełnosprawność", "dostępność", "NGO"],
    },
    {
        "title": "Paszport pacjenta z chorobą rzadką — elektroniczny nośnik danych medycznych",
        "short_desc": "System informatyczny (aplikacja webowa + chip NFC) zapisujący dane o chorobie rzadkiej, lekach i lekarzach prowadzących pacjenta — umożliwia szybką pomoc medyczną w sytuacjach nagłych.",
        "full_desc": (
            "Na czym polega: System składa się z aplikacji webowej (dla personelu Centrum Referencyjnego), elektronicznego nośnika NFC "
            "wydawanego pacjentowi oraz programatora chipów. Chip zawiera dane o chorobie, standardy postępowania, listę leków i lekarzy prowadzących. "
            "Ułatwia diagnostykę i leczenie zarówno w sytuacjach nagłych, jak i podczas rutynowych wizyt specjalistycznych.\n\n"
            "Grupa docelowa: Pacjenci z chorobami rzadkimi, personel medyczny.\n\n"
            "Skuteczność: Pozytywnie zaopiniowana przez Radę Innowacji Społecznych. Lekarze i pacjenci ocenili jako znaczące ułatwienie diagnostyki."
        ),
        "category": "zdrowie i medycyna",
        "categories": ["zdrowie i medycyna"],
        "area": "zdrowie i medycyna",
        "target_group": "Pacjenci z chorobami rzadkimi i personel medyczny.",
        "location": "Małopolska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": None,
        "testers_count": 0,
        "where_implemented": "Małopolska",
        "who_can_use": "Centra Chorób Rzadkich, szpitale, pacjenci z chorobami rzadkimi.",
        "source_url": BASE_ROPS + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-zdrowia-i-medycyny",
        "video_url": None,
        "materials_url": BASE_ROPS + "/mpliki/IS/ikony_PUBLIKACJE/Innowacje_spoleczne_dla_dostepnosci.pdf",
        "project": "Inkubator Dostępności",
        "authors": "Jacek Sztajnke, Katarzyna Witkowska",
        "tags": ["zdrowie_psychiczne", "dostępność", "wykluczenie_cyfrowe"],
    },
    {
        "title": "Druk 3D — zabawki edukacyjne dla dzieci niewidomych z alfabetem Braille'a",
        "short_desc": "Puzzle 3D drukowane przestrzennie, których elementy mają litery w alfabecie Braille'a — po złożeniu tworzą kształt odpowiadający słowu, wspierając naukę czytania i pisania u dzieci niewidomych.",
        "full_desc": (
            "Na czym polega: Edukacyjne zabawki dla dzieci z dysfunkcją wzroku w formie puzzli 3D. "
            "Każda układanka podzielona jest na tyle elementów, z ilu znaków składa się dane słowo. "
            "Na częściach umieszczone są litery Braille'a — po połączeniu powstaje przedmiot kształtem odwzorowujący słowo. "
            "Ćwiczą percepcję dotykową, wyobraźnię przestrzenną i umiejętności czytania/pisania.\n\n"
            "Grupa docelowa: Dzieci niewidome i słabowidzące. Szkoły specjalne, terapeuci, biblioteki.\n\n"
            "Skuteczność: Pozytywnie zaopiniowana przez Radę Innowacji Społecznych. Nauczyciele ocenili jako atrakcyjne i wartościowe pomoce dydaktyczne."
        ),
        "category": "niepełnosprawność sensoryczna",
        "categories": ["niepełnosprawność sensoryczna", "dzieci, młodzież i rodzina"],
        "area": "niepełnosprawność sensoryczna",
        "target_group": "Dzieci niewidome i słabowidzące. Szkoły specjalne, terapeuci, bibliotekarze.",
        "location": "Małopolska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": None,
        "testers_count": 0,
        "where_implemented": "Małopolska",
        "who_can_use": "Szkoły specjalne, biblioteki szkolne, nauczyciele, terapeuci dzieci niewidomych.",
        "source_url": BASE_ROPS + "/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-sensoryczna",
        "video_url": None,
        "materials_url": BASE_ROPS + "/mpliki/IS/ikony_PUBLIKACJE/Innowacje_spoleczne_dla_dostepnosci.pdf",
        "project": "Inkubator Dostępności",
        "authors": "Społeczna 21 Sp. z o.o.",
        "tags": ["niepełnosprawność", "edukacja", "dzieci"],
    },
]

# ── 2. Materiały edukacyjne dla kadr pomocy społecznej ──────────────────────

def kadr_rec(title: str, section: str, url: str, target: str, tags: list) -> dict:
    return {
        "title": title,
        "short_desc": f"Materiał edukacyjny ROPS dla kadr pomocy społecznej ({section}): {title}.",
        "full_desc": f"Na czym polega: Szkolenie/seminarium ROPS Kraków dla kadr {section}. Temat: {title}.\n\nGrupa docelowa: {target}",
        "category": "edukacja kadry pomocy społecznej",
        "categories": ["edukacja kadry pomocy społecznej"],
        "area": "edukacja kadry pomocy społecznej",
        "target_group": target,
        "location": "Małopolska",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": None,
        "testers_count": 0,
        "where_implemented": "Małopolska",
        "who_can_use": target,
        "source_url": BASE_ROPS + url,
        "video_url": None,
        "materials_url": None,
        "project": None,
        "authors": "ROPS Kraków",
        "tags": tags,
    }


KADR_INNOVATIONS = [
    kadr_rec(
        "Szkolenie: Społeczne aspekty pracy z osobami z zaburzeniami psychicznymi",
        "pracownicy socjalni",
        "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,szkolenie-spoleczne-aspekty-pracy-z-osobami-z-zaburzeniami-psychicznymi",
        "Pracownicy socjalni OPS.",
        ["zdrowie_psychiczne", "edukacja", "OPS"],
    ),
    kadr_rec(
        "Wpływ wsparcia otoczenia osoby osadzonej w jednostce penitencjarnej na proces integracji społecznej",
        "pracownicy socjalni",
        "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,wplyw-wsparcia-otoczenia-osoby-osadzonej-w-jednostce-penitencjarnej-na-proces-integracji-spolecznej",
        "Pracownicy socjalni OPS.",
        ["edukacja", "OPS", "ubóstwo"],
    ),
    kadr_rec(
        "Motywowanie do zmiany – jak wspierać a nie wyręczać",
        "pracownicy socjalni",
        "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,motywowanie-do-zmiany-jak-wspierac-a-nie-wyreczac",
        "Pracownicy socjalni OPS.",
        ["edukacja", "OPS"],
    ),
    kadr_rec(
        "Specyfika pracy z klientem uzależnionym w kontekście budowania planu wsparcia",
        "pracownicy socjalni",
        "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,specyfika-pracy-z-klientem-uzaleznionym-w-kontekscie-budowania-planu-wsparcia",
        "Pracownicy socjalni OPS.",
        ["edukacja", "OPS", "uzależnienia"],
    ),
    kadr_rec(
        "Trudny klient czy trudności klienta – metoda Dialogu Motywującego w pracy socjalnej",
        "pracownicy socjalni",
        "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,trudny-klient-czy-trudnosci-klienta-wykorzystanie-w-pracy-socjalnej-metody-dialogu-motywujacego",
        "Pracownicy socjalni OPS.",
        ["edukacja", "OPS"],
    ),
    kadr_rec(
        "Klient w procesie zmian – jak skutecznie reagować na jego postawy",
        "pracownicy socjalni",
        "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,klient-w-procesie-zmian-jak-skutecznie-reagowac-na-jego-postawy",
        "Pracownicy socjalni OPS.",
        ["edukacja", "OPS"],
    ),
    kadr_rec(
        "Stres i wypalenie zawodowe – jak radzić sobie z problemami zawodowymi? (pracownicy socjalni)",
        "pracownicy socjalni",
        "/dla-kadr-pomocy-spolecznej/pracownicy-socjalni-materialy-edukacyjne,stres-i-wypalenie-zawodowe-jak-mozna-radzic-sobie-z-problemami-zawodowymi",
        "Pracownicy socjalni OPS.",
        ["edukacja", "OPS", "zdrowie_psychiczne"],
    ),
    kadr_rec(
        "Sposoby motywowania uczestników ŚDS do aktywnego uczestnictwa w procesie terapeutycznym (Dialog Motywujący)",
        "Środowiskowe Domy Samopomocy",
        "/dla-kadr-pomocy-spolecznej/srodowiskowe-domy-samopomocy-materialy-edukacyjne,sposoby-motywowania-uczestnikow-srodowiskowych-domow-samopomocy-do-aktywnego-uczestnictwa-w-procesie-terapeutycznym-z-wykorzystaniem-metody-dialogu-motywujacego",
        "Kadra Środowiskowych Domów Samopomocy.",
        ["edukacja", "zdrowie_psychiczne", "niepełnosprawność"],
    ),
    kadr_rec(
        "Stres i wypalenie zawodowe – jak radzić sobie z problemami zawodowymi? (kadra ŚDS)",
        "Środowiskowe Domy Samopomocy",
        "/dla-kadr-pomocy-spolecznej/srodowiskowe-domy-samopomocy-materialy-edukacyjne,stres-i-wypalenie-zawodowe-jak-mozna-radzic-sobie-z-problemami-zawodowymi",
        "Kadra Środowiskowych Domów Samopomocy.",
        ["edukacja", "zdrowie_psychiczne"],
    ),
    kadr_rec(
        "Superwizja dla kadr ŚDS",
        "Środowiskowe Domy Samopomocy",
        "/dla-kadr-pomocy-spolecznej/srodowiskowe-domy-samopomocy-materialy-edukacyjne,superwizja-dla-kadr-sds",
        "Kadra Środowiskowych Domów Samopomocy.",
        ["edukacja", "zdrowie_psychiczne", "niepełnosprawność"],
    ),
    kadr_rec(
        "Wzbudzanie aktywności wśród seniorów – mieszkańców DPS oraz uczestników placówek wsparcia dziennego",
        "Środowiskowe Domy Samopomocy / DPS",
        "/dla-kadr-pomocy-spolecznej/srodowiskowe-domy-samopomocy-materialy-edukacyjne,seminarium-pn-wzbudzanie-aktywnosci-wsrod-seniorow-mieszkancow-domow-pomocy-spolecznej-oraz-uczestnikow-placowek-wsparcia-dziennego",
        "Kadra DPS i ŚDS.",
        ["edukacja", "seniorzy", "DPS"],
    ),
    kadr_rec(
        "Przemoc psychiczna wobec osób upośledzonych umysłowo i chorujących psychicznie – rozpoznanie, wsparcie, przeciwdziałanie",
        "Środowiskowe Domy Samopomocy",
        "/dla-kadr-pomocy-spolecznej/srodowiskowe-domy-samopomocy-materialy-edukacyjne,seminarium-pn-przemoc-psychiczna-wobec-osob-uposledzonych-umyslowo-i-chorujacych-psychicznie-rozpoznanie-metody-wsparcia-sposoby-przeciwdzialania",
        "Kadra Środowiskowych Domów Samopomocy.",
        ["edukacja", "zdrowie_psychiczne", "niepełnosprawność"],
    ),
    kadr_rec(
        "Wzbudzanie aktywności wśród seniorów – mieszkańców Domów Pomocy Społecznej",
        "Domy Pomocy Społecznej",
        "/dla-kadr-pomocy-spolecznej/domy-pomocy-spolecznej-materialy-edukacyjne,wzbudzanie-aktywnosci-wsrod-seniorow-mieszkancow-domow-pomocy-spolecznej-oraz-uczestnikow-placowek-wsparcia-dziennego",
        "Kadra Domów Pomocy Społecznej.",
        ["edukacja", "seniorzy", "DPS"],
    ),
    kadr_rec(
        "Metody pracy z Seniorem z uwzględnieniem najczęściej występujących schorzeń wieku podeszłego",
        "Domy Pomocy Społecznej",
        "/dla-kadr-pomocy-spolecznej/domy-pomocy-spolecznej-materialy-edukacyjne,metody-pracy-z-seniorem-z-uwzglednieniem-najczesciej-wystepujacych-schorzen-wieku-podeszleg",
        "Kadra Domów Pomocy Społecznej.",
        ["edukacja", "seniorzy", "DPS", "zdrowie_psychiczne"],
    ),
    kadr_rec(
        "Profesjonalne wspieranie w życiu codziennym seniora",
        "Domy Pomocy Społecznej",
        "/dla-kadr-pomocy-spolecznej/domy-pomocy-spolecznej-materialy-edukacyjne,profesjonalne-wspieranie-w-zyciu-codziennym-seniora",
        "Kadra Domów Pomocy Społecznej.",
        ["edukacja", "seniorzy", "DPS"],
    ),
    kadr_rec(
        "Wsparcie domów pomocy społecznej w oparciu o duński model pracy",
        "Domy Pomocy Społecznej",
        "/dla-kadr-pomocy-spolecznej/domy-pomocy-spolecznej-materialy-edukacyjne,wsparcie-domow-pomocy-spolecznej-w-oparciu-o-dunski-model-pracy",
        "Kadra Domów Pomocy Społecznej.",
        ["edukacja", "seniorzy", "DPS"],
    ),
]

# ── Merge z istniejącymi danymi ─────────────────────────────────────────────

def main() -> None:
    existing = json.loads(OUT.read_text(encoding="utf-8"))
    existing_titles = {r["title"].lower().strip() for r in existing}

    new_records = PDF_INNOVATIONS + KADR_INNOVATIONS
    added = 0
    for rec in new_records:
        key = rec["title"].lower().strip()
        if key not in existing_titles:
            existing.append(rec)
            existing_titles.add(key)
            added += 1
        else:
            print(f"  SKIP (duplicate): {rec['title'][:60]}")

    # przepisz ID
    for n, rec in enumerate(existing, 1):
        rec["id"] = n

    OUT.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDodano {added} nowych rekordów. Łącznie: {len(existing)}")


if __name__ == "__main__":
    main()
