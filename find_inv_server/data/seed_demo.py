"""
Seed demonstracyjny — wgrywa realistyczne innowacje do SQLite (bez ChromaDB).
Używa danych z mock_data.py + dodatkowych 15 innowacji inspirowanych ROPS Kraków.

Uruchom z katalogu find_inv_server/:
    python -m data.seed_demo
"""

import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import get_db, init_db
from app.models import Innovation, Challenge, InnovationGapIndex, ForumPost

INNOVATIONS = [
    # Seniorzy (4 innowacje z ROPS Kraków — Biblioteka Innowacji Społecznych)
    {
        "title": "BaWita",
        "short_desc": "Tablica manipulacyjno-terapeutyczna dla seniorów z chorobami dementywnymi",
        "full_desc": (
            "Tablica manipulacyjno-terapeutyczna przeznaczona dla seniorów oraz osób z chorobami "
            "dementywnymi i otępiennymi. Stymuluje zmysły, poprawia motorykę i opóźnia postęp "
            "demencji poprzez zróżnicowane elementy do manipulowania. Może być stosowana samodzielnie "
            "lub pod opieką terapeuty w DPS i centrach dziennego pobytu."
        ),
        "category": "seniorzy",
        "area": "demencja i rehabilitacja",
        "target_group": "seniorzy z chorobami dementywnymi i otępiennymi",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 12,
        "where_implemented": "Małopolska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow",
        "tags": json.dumps(["seniorzy", "demencja", "rehabilitacja", "dostępność"]),
        "embedding_id": "1",
    },
    {
        "title": "Korytarz wspomnień",
        "short_desc": "System audiowizualny przywoływania wspomnień dla osób z problemami pamięci",
        "full_desc": (
            "Model systemu audiowizualnego przywoływania wspomnień dla osób z problemami pamięci "
            "i chorobami otępiennymi. Personalizowane materiały audiowizualne aktywizują pamięć "
            "autobiograficzną i poprawiają samopoczucie seniorów w DPS i domach. Każdy senior "
            "otrzymuje spersonalizowaną kolekcję zdjęć, piosenek i nagrań z kluczowych momentów życia."
        ),
        "category": "seniorzy",
        "area": "demencja i rehabilitacja",
        "target_group": "seniorzy z chorobami otępiennymi w DPS",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "testers_count": 8,
        "where_implemented": "Kraków, Bochnia, Tarnów",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow",
        "tags": json.dumps(["seniorzy", "demencja", "DPS", "technologia"]),
        "embedding_id": "2",
    },
    {
        "title": "Mobilne centrum pomocy",
        "short_desc": "Mobilna metoda pracy z osobami starszymi na terenach wiejskich",
        "full_desc": (
            "Metoda pracy z osobami starszymi na terenach wiejskich poprzez mobilne centrum pomocy "
            "docierające do odległych miejscowości. Zapewnia dostęp do usług społecznych, medycznych "
            "i kulturalnych dla seniorów, którym bariery transportowe uniemożliwiają korzystanie "
            "z usług stacjonarnych. Wyposażony bus z pielęgniarką, pracownikiem socjalnym i terapeutą."
        ),
        "category": "seniorzy",
        "area": "dostęp do usług",
        "target_group": "seniorzy z terenów wiejskich bez dostępu do usług",
        "location": "gmina wiejska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 3,
        "testers_count": 15,
        "where_implemented": "powiaty: limanowski, nowotarski, gorlicki",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow",
        "tags": json.dumps(["seniorzy", "gmina_wiejska", "transport", "dostępność"]),
        "embedding_id": "3",
    },
    {
        "title": "Centrum antydepresyjne",
        "short_desc": "Kompleksowa pomoc seniorom w stanach depresyjnych i z zachowaniami suicydalnymi",
        "full_desc": (
            "Metoda świadczenia kompleksowej pomocy osobom starszym w stanach depresyjnych i z "
            "zachowaniami suicydalnymi. Centrum łączy wsparcie psychiatryczne, psychologiczne "
            "i społeczne w jednym miejscu. Dostępne bezpłatnie dla seniorów z Małopolski, "
            "z szybkim czasem przyjęcia (do 72 godzin od zgłoszenia)."
        ),
        "category": "seniorzy",
        "area": "zdrowie psychiczne seniorów",
        "target_group": "seniorzy 60+ z depresją i myślami suicydalnymi",
        "location": "Kraków",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 6,
        "testers_count": 6,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow",
        "tags": json.dumps(["seniorzy", "zdrowie_psychiczne", "dostępność", "OPS"]),
        "embedding_id": "4",
    },
    # Dzieci, młodzież i rodzina (4)
    {
        "title": "koMIX życiowy",
        "short_desc": "Gra terapeutyczna dla wychowanków placówek opiekuńczo-wychowawczych",
        "full_desc": (
            "Gra terapeutyczna dla wychowanków placówek opiekuńczo-wychowawczych. Pomaga w "
            "przepracowaniu trudnych doświadczeń, rozwijaniu umiejętności społecznych i "
            "przygotowaniu do samodzielnego życia po opuszczeniu pieczy zastępczej. "
            "Stosowana przez terapeutów i wychowawców jako narzędzie pracy grupowej."
        ),
        "category": "dzieci i rodzina",
        "area": "piecza zastępcza",
        "target_group": "wychowankowie placówek opiekuńczo-wychowawczych 12–18 lat",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 10,
        "where_implemented": "Małopolska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-dzieci-mlodziezy-i-rodziny",
        "tags": json.dumps(["dzieci", "rodzina", "piecza_zastępcza", "zdrowie_psychiczne"]),
        "embedding_id": "5",
    },
    {
        "title": "Bez presji z depresji",
        "short_desc": "Materiały psychoedukacyjne wspierające dzieci i młodzież w kryzysach psychicznych",
        "full_desc": (
            "Komplet materiałów psychoedukacyjnych wspierających dzieci i młodzież szkolną "
            "doświadczających kryzysów psychicznych, w tym depresji i lęku. Zestaw obejmuje "
            "narzędzia dla uczniów, rodziców i nauczycieli. Ułatwia wczesne rozpoznawanie "
            "problemów psychicznych i szukanie pomocy bez stygmatyzacji."
        ),
        "category": "dzieci i rodzina",
        "area": "zdrowie psychiczne dzieci",
        "target_group": "dzieci i młodzież szkolna 10–18 lat",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 20,
        "where_implemented": "Kraków, Nowy Sącz, Tarnów",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-dzieci-mlodziezy-i-rodziny",
        "tags": json.dumps(["dzieci", "młodzież", "zdrowie_psychiczne", "edukacja"]),
        "embedding_id": "6",
    },
    {
        "title": "Językołamacz",
        "short_desc": "Aplikacja do wsparcia rozwoju mowy u słyszących dzieci w spektrum autyzmu",
        "full_desc": (
            "Aplikacja służąca do wsparcia rozwoju mowy języka polskiego u słyszących dzieci "
            "w spektrum autyzmu w wieku 3–10 lat. Interaktywne ćwiczenia logopedyczne dostosowane "
            "do dzieci z ASD, możliwe do prowadzenia przez rodziców w domu między sesjami "
            "z terapeutą. Zawiera 200+ ćwiczeń na różnych poziomach trudności."
        ),
        "category": "dzieci i rodzina",
        "area": "autyzm",
        "target_group": "słyszące dzieci z ASD w wieku 3–10 lat",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 14,
        "where_implemented": "cała Polska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-dzieci-mlodziezy-i-rodziny",
        "tags": json.dumps(["dzieci", "autyzm", "technologia", "edukacja"]),
        "embedding_id": "7",
    },
    {
        "title": "Mobilna pomoc terapeutyczna",
        "short_desc": "Model diagnozy i pracy z rodziną doświadczającą przemocy domowej",
        "full_desc": (
            "Model diagnozy, pracy i działania z rodziną z problemem przemocy w rodzinie. "
            "Mobilny team terapeutyczny (psycholog, pracownik socjalny, prawnik) dociera do "
            "rodzin w miejscu zamieszkania, zapewniając kompleksowe wsparcie. Eliminuje bariery "
            "wyjścia z izolacji i dociera do rodzin, które nie szukają pomocy samodzielnie."
        ),
        "category": "dzieci i rodzina",
        "area": "przemoc w rodzinie",
        "target_group": "rodziny z problemem przemocy domowej, w tym z dziećmi",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 3,
        "testers_count": 7,
        "where_implemented": "Kraków, Nowy Sącz",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-dzieci-mlodziezy-i-rodziny",
        "tags": json.dumps(["rodzina", "przemoc", "zdrowie_psychiczne", "OPS"]),
        "embedding_id": "8",
    },
    # Rynek pracy (4)
    {
        "title": "Agencja pracy incydentalnej",
        "short_desc": "Model agencji dla osób w głębokim kryzysie powracających na rynek pracy",
        "full_desc": (
            "Model działania Agencji Pracy Incydentalnej pomagającej osobom znajdującym się w "
            "głębokim kryzysie (bezdomność, uzależnienia, długotrwałe bezrobocie) powrócić na "
            "rynek pracy. Oferuje elastyczne, krótkoterminowe zlecenia dostosowane do aktualnych "
            "możliwości klienta. Stopniowe zwiększanie wymiaru pracy w miarę stabilizacji sytuacji."
        ),
        "category": "rynek pracy",
        "area": "aktywizacja zawodowa",
        "target_group": "osoby w głębokim kryzysie: bezdomni, uzależnieni, długotrwale bezrobotni",
        "location": "gmina miejska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 4,
        "testers_count": 5,
        "where_implemented": "Kraków, Tarnów",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-rynku-pracy",
        "tags": json.dumps(["rynek_pracy", "bezdomność", "ubóstwo", "NGO"]),
        "embedding_id": "9",
    },
    {
        "title": "NIEwypaleni",
        "short_desc": "Narzędzia przeciwdziałające wypaleniu zawodowemu osób z niepełnosprawnością intelektualną",
        "full_desc": (
            "Narzędzia przeciwdziałające wypaleniu zawodowemu osób z niepełnosprawnością intelektualną "
            "zatrudnionych w zakładach pracy chronionej i na otwartym rynku. Program wspiera utrzymanie "
            "zatrudnienia i zapobiega przedwczesnemu rezygnowaniu z pracy. Szkolenia dla pracodawców "
            "i pracowników oraz monitoring wellbeing."
        ),
        "category": "rynek pracy",
        "area": "niepełnosprawność i zatrudnienie",
        "target_group": "pracownicy z niepełnosprawnością intelektualną i ich pracodawcy",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 3,
        "testers_count": 8,
        "where_implemented": "Małopolska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-rynku-pracy",
        "tags": json.dumps(["niepełnosprawność", "rynek_pracy", "zdrowie_psychiczne", "CUS"]),
        "embedding_id": "10",
    },
    {
        "title": "Mobilna giełda pracy",
        "short_desc": "Model wsparcia kobiet nieaktywnych zawodowo z obszarów wiejskich i małomiasteczkowych",
        "full_desc": (
            "Model wsparcia kobiet nieaktywnych zawodowo zamieszkujących obszary wiejskie i "
            "małomiasteczkowe. Mobilna giełda pracy dociera do miejsc, gdzie bariery transportowe "
            "i opiekuńcze utrudniają dostęp do rynku pracy. Łączy doradztwo zawodowe, oferty pracy "
            "lokalnych pracodawców i krótkie szkolenia dostosowane do potrzeb kobiet wiejskich."
        ),
        "category": "rynek pracy",
        "area": "kobiety na rynku pracy",
        "target_group": "kobiety nieaktywne zawodowo z gmin wiejskich 25–55 lat",
        "location": "gmina wiejska",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "testers_count": 18,
        "where_implemented": "powiat wielicki, powiat bocheński, powiat brzeski",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-rynku-pracy",
        "tags": json.dumps(["rynek_pracy", "kobiety", "gmina_wiejska", "aktywizacja"]),
        "embedding_id": "11",
    },
    {
        "title": "Konsultant ETR",
        "short_desc": "Model nowego zawodu konsultanta tekstów łatwych do czytania (ETR)",
        "full_desc": (
            "Model nowego zawodu tj. konsultanta tekstów ETR (Łatwe do Czytania i Rozumienia) "
            "dla osób z niepełnosprawnością intelektualną. Innowacja tworzy miejsce pracy dla osób "
            "z niepełnosprawnością intelektualną jako ekspertów w procesie tworzenia dostępnych "
            "materiałów przez instytucje publiczne i NGO."
        ),
        "category": "rynek pracy",
        "area": "niepełnosprawność i zatrudnienie",
        "target_group": "osoby z niepełnosprawnością intelektualną zdolne do pracy",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 4,
        "testers_count": 6,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-rynku-pracy",
        "tags": json.dumps(["niepełnosprawność", "rynek_pracy", "dostępność", "edukacja"]),
        "embedding_id": "12",
    },
    # Osoby o ograniczonej mobilności (4)
    {
        "title": "Nakręceni na aktywność",
        "short_desc": "Aplikacja informująca o standardach dostępności miejsc dla osób z niepełnosprawnością",
        "full_desc": (
            "Aplikacja, która pomaga osobom z niepełnosprawnością ruchową za sprawą informacji "
            "o standardach dostępności miejsc i usług. Oceny dostępności wprowadzane przez "
            "użytkowników tworzą mapę dostępności Małopolski. Obejmuje restauracje, urzędy, "
            "sklepy, miejsca kultury i sportu."
        ),
        "category": "niepełnosprawność ruchowa",
        "area": "dostępność przestrzeni",
        "target_group": "osoby z niepełnosprawnością ruchową, użytkownicy wózków",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "testers_count": 25,
        "where_implemented": "Małopolska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-o-ograniczonej-mobilnosci",
        "tags": json.dumps(["niepełnosprawność", "dostępność", "technologia", "aktywizacja"]),
        "embedding_id": "13",
    },
    {
        "title": "EV moduł",
        "short_desc": "Elektryczny moduł napędowy przekształcający ręczny wózek w elektryczny",
        "full_desc": (
            "Moduł elektryczny do wózka inwalidzkiego przekształcający ręczny wózek w elektryczny. "
            "Dostępne cenowo rozwiązanie (koszt kilkukrotnie niższy niż elektryczny wózek) "
            "zwiększa mobilność osób z ograniczeniami siły kończyn górnych. Montaż bez modyfikacji "
            "wózka, kompatybilny z większością modeli standardowych."
        ),
        "category": "niepełnosprawność ruchowa",
        "area": "mobilność",
        "target_group": "osoby z ograniczeniami siły rąk, użytkownicy wózków ręcznych",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 1,
        "testers_count": 9,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-o-ograniczonej-mobilnosci",
        "tags": json.dumps(["niepełnosprawność", "dostępność", "technologia", "rehabilitacja"]),
        "embedding_id": "14",
    },
    {
        "title": "Zakupy bez barier",
        "short_desc": "Dyskretny dzwonek przywołujący asystę dla osoby z niepełnosprawnością w sklepie",
        "full_desc": (
            "Dyskretny dzwonek przywołujący asystę dla osoby z niepełnosprawnością w sklepie. "
            "Umożliwia dyskretne wezwanie pomocy bez konieczności głośnego proszenia lub szukania "
            "personelu. System składa się z przycisku przy wejściu lub w wybranych strefach sklepu "
            "i powiadamia pracownika dyskretnym sygnałem."
        ),
        "category": "niepełnosprawność ruchowa",
        "area": "dostępność usług",
        "target_group": "osoby z niepełnosprawnością ruchową i sensoryczną robiące zakupy",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 11,
        "where_implemented": "Kraków, Nowy Sącz",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-o-ograniczonej-mobilnosci",
        "tags": json.dumps(["niepełnosprawność", "dostępność", "innowacja_produktowa", "samorząd"]),
        "embedding_id": "15",
    },
    {
        "title": "Kompleksowa pomoc po amputacji",
        "short_desc": "Kompleksowy model wsparcia osób po amputacji kończyny dolnej",
        "full_desc": (
            "Kompleksowy model pomocy dla osób po amputacji kończyny dolnej, obejmujący "
            "rehabilitację fizyczną, psychologiczną i wsparcie w powrocie do aktywności "
            "społecznej i zawodowej. Łączy pracę fizjoterapeuty, psychologa i pracownika "
            "socjalnego w skoordynowany plan powrotu do sprawności."
        ),
        "category": "niepełnosprawność ruchowa",
        "area": "rehabilitacja",
        "target_group": "osoby po amputacji kończyny dolnej, w każdym wieku",
        "location": None,
        "status": "active",
        "cost_level": "high",
        "implementation_time_months": 6,
        "testers_count": 7,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-o-ograniczonej-mobilnosci",
        "tags": json.dumps(["niepełnosprawność", "rehabilitacja", "zdrowie", "OPS"]),
        "embedding_id": "16",
    },
    # Osoby z niepełnosprawnością sensoryczną (4)
    {
        "title": "Strażnik",
        "short_desc": "Aplikacja mobilna bezpieczeństwa dla osób głuchych i niedosłyszących",
        "full_desc": (
            "Aplikacja mobilna dla osób g/Głuchych i niedosłyszących zapewniająca bezpieczeństwo. "
            "Konwertuje dźwięki alarmowe (alarm pożarowy, sygnał dymny, dzwonek do drzwi) na "
            "wibracje i powiadomienia wizualne na smartfonie. Działa w tle bez ciągłej aktywności "
            "użytkownika i może powiadamiać wybraną osobę kontaktową."
        ),
        "category": "niepełnosprawność sensoryczna",
        "area": "bezpieczeństwo",
        "target_group": "osoby głuche i niedosłyszące",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 16,
        "where_implemented": "cała Polska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-sensoryczna",
        "tags": json.dumps(["niepełnosprawność_sensoryczna", "bezpieczeństwo", "technologia", "dostępność"]),
        "embedding_id": "17",
    },
    {
        "title": "Teleasystent",
        "short_desc": "Aplikacja zdalnej asysty dla osób niewidzących i słabowidzących",
        "full_desc": (
            "Aplikacja umożliwiająca zdalną asystę dla osób niewidzących i słabowidzących. "
            "Wolontariusze lub pracownicy zdalnie pomagają poprzez kamerę smartfona w bieżących "
            "sytuacjach: czytanie etykiet w sklepie, pomoc w orientacji, opis otoczenia. "
            "Połączenie nawiązywane w ciągu kilkudziesięciu sekund od zgłoszenia."
        ),
        "category": "niepełnosprawność sensoryczna",
        "area": "asystencja",
        "target_group": "osoby niewidome i słabowidzące",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "testers_count": 12,
        "where_implemented": "cała Polska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-sensoryczna",
        "tags": json.dumps(["niepełnosprawność_sensoryczna", "technologia", "wolontariat", "dostępność"]),
        "embedding_id": "18",
    },
    {
        "title": "NGOZ",
        "short_desc": "Nawigacja głosowa wewnątrzbudynkowa dla osób niewidomych i słabowidzących",
        "full_desc": (
            "Nawigacja głosowa osób zależnych (NGOZ) – udźwiękowiona wewnątrzbudynkowa nawigacja "
            "dla osób niewidomych i słabowidzących. System prowadzi użytkownika przez budynek "
            "za pomocą komunikatów głosowych. Może być instalowany w urzędach, szpitalach, "
            "szkołach i innych budynkach użyteczności publicznej."
        ),
        "category": "niepełnosprawność sensoryczna",
        "area": "orientacja przestrzenna",
        "target_group": "osoby niewidome i słabowidzące w budynkach publicznych",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 3,
        "testers_count": 9,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-sensoryczna",
        "tags": json.dumps(["niepełnosprawność_sensoryczna", "technologia", "dostępność", "samorząd"]),
        "embedding_id": "19",
    },
    {
        "title": "Hear IT",
        "short_desc": "Platforma edukacyjna w Polskim Języku Migowym dla osób głuchych",
        "full_desc": (
            "Internetowa platforma edukacyjna w Polskim Języku Migowym (PJM) dla osób g/Głuchych. "
            "Zapewnia dostęp do edukacji w pierwszym języku osób niesłyszących. Kursy, materiały "
            "i ćwiczenia dostępne w PJM eliminują barierę językową w dostępie do wiedzy i edukacji "
            "formalnej oraz zawodowej."
        ),
        "category": "niepełnosprawność sensoryczna",
        "area": "edukacja i dostępność",
        "target_group": "osoby głuche i słabosłyszące posługujące się PJM",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 4,
        "testers_count": 22,
        "where_implemented": "cała Polska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-sensoryczna",
        "tags": json.dumps(["niepełnosprawność_sensoryczna", "edukacja", "dostępność", "technologia"]),
        "embedding_id": "20",
    },
    # Cudzoziemcy (4)
    {
        "title": "Bajkala",
        "short_desc": "Lampka włączająca kulturowo dzieci cudzoziemskie w polskie środowisko szkolne",
        "full_desc": (
            "Lampka włączająca kulturowo dzieci czeczeńskie i inne dzieci cudzoziemskie w polskie "
            "środowisko szkolne. Narzędzie integracji kulturowej poprzez wspólne czytanie bajek "
            "w dwóch językach. Buduje mosty między kulturami i pomaga dzieciom imigranckim "
            "czuć się akceptowanymi przy zachowaniu własnej tożsamości."
        ),
        "category": "integracja cudzoziemców",
        "area": "edukacja i integracja",
        "target_group": "dzieci cudzoziemskie w polskich szkołach i ich rówieśnicy",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 8,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-cudzoziemcow",
        "tags": json.dumps(["migranci", "dzieci", "edukacja", "integracja"]),
        "embedding_id": "21",
    },
    {
        "title": "Health Guide PL",
        "short_desc": "Przewodnik dla obcokrajowców o polskiej ochronie zdrowia",
        "full_desc": (
            "Przewodnik dla obcokrajowców pracujących w Polsce o polskiej ochronie zdrowia. "
            "Objaśnia system NFZ, prawa pacjenta i procedury w kilku językach (ukraiński, "
            "rosyjski, angielski, hindi, wietnamski). Eliminuje barierę informacyjną uniemożliwiającą "
            "efektywne korzystanie z systemu ochrony zdrowia."
        ),
        "category": "integracja cudzoziemców",
        "area": "zdrowie migrantów",
        "target_group": "obcokrajowcy pracujący i mieszkający w Polsce",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "testers_count": 13,
        "where_implemented": "Kraków, Tarnów",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-cudzoziemcow",
        "tags": json.dumps(["migranci", "zdrowie", "edukacja", "dostępność"]),
        "embedding_id": "22",
    },
    {
        "title": "Zrozum moją kulturę",
        "short_desc": "Gra integracyjna dla grup uchodźczych i migracyjnych",
        "full_desc": (
            "Gra integracyjna 'Zrozum moją kulturę, zrozum mnie' dla grup uchodźczych i "
            "migracyjnych. Gra planszowa buduje wzajemne zrozumienie między Polakami a "
            "imigrantami poprzez poznawanie zwyczajów, wartości i codzienności różnych kultur. "
            "Stosowana przez pracowników socjalnych, nauczycieli i animatorów społecznych."
        ),
        "category": "integracja cudzoziemców",
        "area": "integracja kulturowa",
        "target_group": "migranci i uchodźcy oraz lokalne społeczności przyjmujące",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 9,
        "where_implemented": "Kraków, Rzeszów",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-cudzoziemcow",
        "tags": json.dumps(["migranci", "integracja", "edukacja", "NGO"]),
        "embedding_id": "23",
    },
    {
        "title": "Dialog ponad kulturami – mediacja",
        "short_desc": "Wystandaryzowany model mediacji transgranicznej dla imigrantów",
        "full_desc": (
            "Wystandaryzowany model mediacji transgranicznej umożliwiający rozwiązywanie "
            "konfliktów kulturowych i prawnych z udziałem imigrantów. Mediatorzy przeszkoleni "
            "w specyfice kulturowej prowadzą procesy mediacyjne uwzględniające różnice kulturowe "
            "i bariery językowe. Model może być wdrożony przez każdy OPS lub organizację migracyjną."
        ),
        "category": "integracja cudzoziemców",
        "area": "mediacja kulturowa",
        "target_group": "imigranci w konfliktach z instytucjami lub polskim otoczeniem",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 4,
        "testers_count": 5,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-cudzoziemcow",
        "tags": json.dumps(["migranci", "integracja", "OPS", "NGO"]),
        "embedding_id": "24",
    },
    # Osoby z niepełnosprawnością intelektualną (4)
    {
        "title": "Urzędowy ambaras",
        "short_desc": "Gra planszowa ETR o załatwianiu spraw urzędowych",
        "full_desc": (
            "Edukacyjna gra planszowa wspierająca osoby z niepełnosprawnością intelektualną "
            "w załatwianiu spraw urzędowych. Materiały ETR (Łatwe do Czytania i Rozumienia) "
            "w formie gry planszowej uczą procedur administracyjnych w przystępny i angażujący "
            "sposób. Stosowana przez pracowników socjalnych, terapeutów i w warsztatach terapii zajęciowej."
        ),
        "category": "niepełnosprawność intelektualna",
        "area": "samodzielność i integracja",
        "target_group": "osoby z niepełnosprawnością intelektualną i ich opiekunowie",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 17,
        "where_implemented": "Małopolska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-intelektualna",
        "tags": json.dumps(["niepełnosprawność", "edukacja", "dostępność", "samorząd"]),
        "embedding_id": "25",
    },
    {
        "title": "Pełnia zdrowia",
        "short_desc": "Pudełko edukacyjne ETR o korzystaniu z usług medycznych",
        "full_desc": (
            "Pudełko edukacyjne wyposażające osoby z niepełnosprawnością intelektualną w "
            "umiejętności korzystania z usług medycznych. Materiały ETR objaśniają wizyty "
            "lekarskie, leki, procedury diagnostyczne i prawa pacjenta. Zawiera plansze, karty "
            "i ćwiczenia do samodzielnego i grupowego przygotowania do wizyt lekarskich."
        ),
        "category": "niepełnosprawność intelektualna",
        "area": "zdrowie i samodzielność",
        "target_group": "osoby z niepełnosprawnością intelektualną",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 13,
        "where_implemented": "Małopolska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-intelektualna",
        "tags": json.dumps(["niepełnosprawność", "zdrowie", "edukacja", "dostępność"]),
        "embedding_id": "26",
    },
    {
        "title": "Go ahead – mów śmiało!",
        "short_desc": "Aplikacja rozwijająca umiejętności komunikacyjne osób z trudnościami w mowie",
        "full_desc": (
            "Aplikacja służąca rozwijaniu umiejętności komunikacyjnych osób z trudnościami w "
            "mowie i komunikacji, w tym z niepełnosprawnością intelektualną. Interaktywne "
            "ćwiczenia i scenariusze komunikacyjne przygotowują do codziennych sytuacji: "
            "rozmowy telefoniczne, zakupy, wizyta u lekarza, załatwianie spraw w urzędzie."
        ),
        "category": "niepełnosprawność intelektualna",
        "area": "komunikacja i samodzielność",
        "target_group": "osoby z niepełnosprawnością intelektualną i trudnościami komunikacyjnymi",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 11,
        "where_implemented": "Małopolska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-intelektualna",
        "tags": json.dumps(["niepełnosprawność", "technologia", "edukacja", "rehabilitacja"]),
        "embedding_id": "27",
    },
    {
        "title": "AuTyzm i ja",
        "short_desc": "Rekomendacje dla opiekunów, nauczycieli i terapeutów osób z autyzmem",
        "full_desc": (
            "Rekomendacje dla opiekunów, nauczycieli i terapeutów osób z autyzmem. "
            "Praktyczny przewodnik oparty na dowodach naukowych i doświadczeniu rodzin "
            "osób ze spektrum autyzmu. Zawiera konkretne strategie postępowania w trudnych "
            "sytuacjach i zasoby wspierające codzienną opiekę nad osobą z ASD."
        ),
        "category": "niepełnosprawność intelektualna",
        "area": "autyzm",
        "target_group": "opiekunowie, nauczyciele i terapeuci osób z autyzmem",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 30,
        "where_implemented": "cała Polska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-intelektualna",
        "tags": json.dumps(["autyzm", "edukacja", "dzieci", "NGO"]),
        "embedding_id": "28",
    },
    # Osoby w kryzysie bezdomności (2)
    {
        "title": "Szlakiem ludzi bezdomnych",
        "short_desc": "Mobilny Punkt Higieniczny dla osób bezdomnych",
        "full_desc": (
            "Szlakiem ludzi bezdomnych – Mobilny Punkt Higieniczny docierający do miejsc "
            "przebywania osób bezdomnych. Zapewnia dostęp do prysznica, pralni i podstawowych "
            "usług higienicznych w miejscu, gdzie przebywa osoba bezdomna. Niweluje barierę "
            "dostępności usług higienicznych jako warunek aktywizacji zawodowej i społecznej."
        ),
        "category": "bezdomność",
        "area": "wsparcie w kryzysie",
        "target_group": "osoby doświadczające bezdomności w miastach",
        "location": "gmina miejska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 3,
        "testers_count": 8,
        "where_implemented": "Kraków, Tarnów",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-w-kryzysie-bezdomnosci",
        "tags": json.dumps(["bezdomność", "OPS", "gmina_miejska", "wolontariat"]),
        "embedding_id": "29",
    },
    {
        "title": "Ścieżka Feniksa",
        "short_desc": "Wiejski program pomocy osobom w kryzysie bezdomności",
        "full_desc": (
            "Ścieżka Feniksa – wiejski program pomocy osobom w kryzysie bezdomności. "
            "Model wsparcia adaptowany do warunków wiejskich, gdzie infrastruktura dla "
            "bezdomnych jest bardzo ograniczona. Integruje zasoby lokalne: sołtysów, "
            "parafie, wolontariuszy i OPS w sieć wsparcia dla osób bezdomnych na wsi."
        ),
        "category": "bezdomność",
        "area": "bezdomność wiejska",
        "target_group": "osoby bezdomne na terenach wiejskich",
        "location": "gmina wiejska",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 4,
        "testers_count": 5,
        "where_implemented": "powiat krakowski, powiat wielicki",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-w-kryzysie-bezdomnosci",
        "tags": json.dumps(["bezdomność", "gmina_wiejska", "OPS", "aktywizacja"]),
        "embedding_id": "30",
    },
    # Zdrowie i medycyna (4)
    {
        "title": "Paszport pacjenta z chorobą rzadką",
        "short_desc": "Dokument medyczny dla pacjentów z chorobami rzadkimi",
        "full_desc": (
            "Paszport pacjenta z chorobą rzadką – dokument zawierający wszystkie kluczowe "
            "informacje medyczne, umożliwiający szybką i prawidłową opiekę przez różnych "
            "lekarzy i ratowników. Szczególnie ważny przy podróżach i nagłych zdarzeniach "
            "medycznych, gdy lekarz nie zna specyfiki choroby rzadkiej pacjenta."
        ),
        "category": "zdrowie",
        "area": "choroby rzadkie",
        "target_group": "pacjenci z chorobami rzadkimi i ich rodziny",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "testers_count": 14,
        "where_implemented": "Małopolska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-zdrowia-i-medycyny",
        "tags": json.dumps(["zdrowie", "dostępność", "OPS", "NGO"]),
        "embedding_id": "31",
    },
    {
        "title": "Telerehabilitacja oddechowa",
        "short_desc": "Model telerehabilitacji oddechowej dla pacjentów z chorobami płuc",
        "full_desc": (
            "Model telerehabilitacji oddechowej dla pacjentów z przewlekłymi chorobami płuc "
            "(POChP, astma, stany po COVID-19). Rehabilitacja oddechowa prowadzona zdalnie "
            "przez specjalistów, bez konieczności dojazdu do centrum rehabilitacji. "
            "Szczególnie ważny dla pacjentów z terenów wiejskich i słabo mobilnych."
        ),
        "category": "zdrowie",
        "area": "rehabilitacja zdrowotna",
        "target_group": "pacjenci z przewlekłymi chorobami układu oddechowego",
        "location": "gmina wiejska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 3,
        "testers_count": 18,
        "where_implemented": "cała Małopolska",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-zdrowia-i-medycyny",
        "tags": json.dumps(["zdrowie", "dostępność", "gmina_wiejska", "technologia"]),
        "embedding_id": "32",
    },
    {
        "title": "Pacjent Pro",
        "short_desc": "Aplikacja dla pacjentów na oddziale ogólnopsychiatrycznym",
        "full_desc": (
            "Aplikacja dla pacjentów na oddziale ogólnopsychiatrycznym. Wspiera organizację "
            "dnia, komunikację z personelem i przygotowanie do wypisu, redukując lęk "
            "hospitalizacyjny. Pacjent ma dostęp do swojego planu terapeutycznego, harmonogramu "
            "i możliwości sygnalizowania potrzeb w sposób dyskretny."
        ),
        "category": "zdrowie",
        "area": "zdrowie psychiczne",
        "target_group": "pacjenci oddziałów psychiatrycznych",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 3,
        "testers_count": 10,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-zdrowia-i-medycyny",
        "tags": json.dumps(["zdrowie_psychiczne", "technologia", "dostępność", "NGO"]),
        "embedding_id": "33",
    },
    {
        "title": "Oncotriada",
        "short_desc": "Model wsparcia osób z diagnozą onkologiczną i ich rodzin",
        "full_desc": (
            "Model wsparcia osób z diagnozą onkologiczną łączący wsparcie medyczne, psychologiczne "
            "i społeczne w trójfilarowym systemie opieki. Obejmuje chorego i jego rodzinę od "
            "momentu diagnozy przez leczenie aż do remisji lub opieki paliatywnej. Koordynator "
            "onkologiczny synchronizuje wszystkie formy wsparcia."
        ),
        "category": "zdrowie",
        "area": "onkologia i wsparcie",
        "target_group": "osoby z diagnozą onkologiczną i ich rodziny",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 6,
        "testers_count": 9,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-zdrowia-i-medycyny",
        "tags": json.dumps(["zdrowie", "zdrowie_psychiczne", "onkologia", "OPS"]),
        "embedding_id": "34",
    },
]

CHALLENGES = [
    # 1. Rodzina i piecza zastępcza (ROPS Mapa Wyzwań 2024)
    {"title": "Niedobór rodzin zastępczych", "area": "rodzina i piecza zastępcza",
     "description": "Wzrost liczby dzieci w pieczy zastępczej o 3,5% w 2023 vs 2022. Niewystarczająca liczba rodzin zastępczych. Dzieci poniżej 10 r.ż. trafiają do ośrodków instytucjonalnych wbrew ustawie.",
     "indicator_value": 3.5, "indicator_unit": "% wzrost liczby dzieci w pieczy zastępczej (2023 vs 2022)",
     "source": "GUS – Piecza zastępcza w 2023 roku", "data_year": 2023, "powiat": "krakowski"},
    {"title": "Rozdzielanie rodzeństwa w pieczy", "area": "rodzina i piecza zastępcza",
     "description": "Brak wszystkich form wsparcia rodzin zastępczych; niedostateczna współpraca instytucji powiatowych i gminnych prowadzi do rozdzielania rodzeństwa.",
     "indicator_value": 40.0, "indicator_unit": "% dzieci w pieczy instytucjonalnej poniżej 10 r.ż.",
     "source": "NIK – Wsparcie systemu pieczy zastępczej 2022", "data_year": 2022, "powiat": "tarnowski"},

    # 2. Bezdomność (ROPS Mapa Wyzwań 2024)
    {"title": "Bezdomność młodych dorosłych", "area": "bezdomność",
     "description": "Rosnąca liczba młodych bezdomnych (0–25 lat). Niewidzialność i niepoliczalność tej grupy – noszą modne ubrania, sprawiają wrażenie beztroski. Brak dostosowanej oferty w noclegowniach.",
     "indicator_value": 25.0, "indicator_unit": "% bezdomnych poniżej 25 roku życia",
     "source": "DODAJ MNIE – Bezdomność Młodzieży i Młodych Dorosłych w Polsce 2023", "data_year": 2023, "powiat": "krakowski"},
    {"title": "Luka transferu pomocy po opuszczeniu pieczy", "area": "bezdomność",
     "description": "Wychowankowie placówek opiekuńczo-wychowawczych po 18 roku życia wpadają w bezdomność z powodu braku wsparcia w usamodzielnieniu.",
     "indicator_value": 35.0, "indicator_unit": "% byłych wychowanków zagrożonych bezdomnością",
     "source": "DODAJ MNIE 2023 / NIK", "data_year": 2023, "powiat": "nowosądecki"},

    # 3. Niepełnosprawność (ROPS Mapa Wyzwań 2024)
    {"title": "Niskie zatrudnienie osób z niepełnosprawnością", "area": "niepełnosprawność",
     "description": "Wskaźnik zatrudnienia osób z niepełnosprawnością w wieku 16–64 lata wynosi 30,1% (2023). Trudności z dostępem do edukacji wyższej i rynku pracy.",
     "indicator_value": 30.1, "indicator_unit": "% osób z niepełnosprawnością zatrudnionych (16–64 lata, 2023)",
     "source": "GUS BDL / bdl.stat.gov.pl", "data_year": 2023, "powiat": "nowosądecki"},
    {"title": "Bariery architektoniczne i dostępność", "area": "niepełnosprawność",
     "description": "5,4 mln osób niepełnosprawnych w Polsce (14,3% populacji wg NSP 2021). Główne potrzeby: mieszkalnictwo, dostęp do informacji, rehabilitacja, praca.",
     "indicator_value": 14.3, "indicator_unit": "% osób z niepełnosprawnością w populacji (NSP 2021)",
     "source": "NSP 2021 / PFRON Badanie potrzeb 2024", "data_year": 2024, "powiat": "limanowski"},

    # 4. Ubóstwo (ROPS Mapa Wyzwań 2024)
    {"title": "Wzrost ubóstwa skrajnego", "area": "ubóstwo",
     "description": "Ubóstwo skrajne dotknęło 6,6% gospodarstw domowych w 2023 – wzrost o 2pp vs 2022. Najsilniej dotknięci: rolnicy (14,1%), renciści (8,4%), osoby z niezarobkowych źródeł (17,9%).",
     "indicator_value": 6.6, "indicator_unit": "% gospodarstw domowych w ubóstwie skrajnym (2023)",
     "source": "GUS – Zasięg ubóstwa ekonomicznego w Polsce 2023", "data_year": 2023, "powiat": "miechowski"},
    {"title": "Ubóstwo energetyczne i głód", "area": "ubóstwo",
     "description": "78% ubogich korzystających z pomocy żywnościowej ocenia, że ich sytuacja ekonomiczna pogorszyła się. Ponad 53% ankietowanych: środki finansowe nie wystarczają na podstawowe potrzeby.",
     "indicator_value": 78.0, "indicator_unit": "% ubogich z pogorszoną sytuacją ekonomiczną (2023)",
     "source": "Federacja Banków Żywności 2023 / Szlachetna Paczka", "data_year": 2023, "powiat": "dąbrowski"},

    # 5. Integracja cudzoziemców (ROPS Mapa Wyzwań 2024)
    {"title": "Integracja uchodźców z Ukrainy", "area": "integracja cudzoziemców",
     "description": "Brak dostosowanych usług publicznych dla migrantów nieznających języka polskiego. Trudności z wynajmem mieszkań, adaptacją dzieci w systemie edukacyjnym, uznawaniem kwalifikacji.",
     "indicator_value": 37.0, "indicator_unit": "% migrantek szukających pracy poza zawodem",
     "source": "Monitor Deloitte – Uchodźcy z Ukrainy w Polsce 2022 / PIE 2022", "data_year": 2022, "powiat": "krakowski"},
    {"title": "Bariery językowe i kulturowe", "area": "integracja cudzoziemców",
     "description": "Cudzoziemcy mają ograniczony dostęp do usług publicznych z powodu barier językowych. Brak tłumaczy i asystentów kulturowych w urzędach i szkołach.",
     "indicator_value": 60.0, "indicator_unit": "% migrantów z problemami językowymi w dostępie do usług",
     "source": "Model polityki włączania migrantów – UW 2023", "data_year": 2023, "powiat": "tarnowski"},

    # 6. Zdrowie (ROPS Mapa Wyzwań 2024)
    {"title": "Choroby sercowo-naczyniowe", "area": "zdrowie",
     "description": "Choroba niedokrwienna serca – największe wyzwanie polskiego systemu ochrony zdrowia. Udary – druga najczęstsza przyczyna zgonów. Palenie tytoniu i nieodpowiednia dieta jako główne przyczyny.",
     "indicator_value": 45.0, "indicator_unit": "% zgonów z przyczyn sercowo-naczyniowych",
     "source": "OECD/European Observatory – State of Health in the EU, Polska 2023", "data_year": 2023, "powiat": "gorlicki"},
    {"title": "Brak dostępu do specjalistów na wsi", "area": "zdrowie",
     "description": "Mieszkańcy gmin wiejskich bez dostępu do lekarzy specjalistów. Długie kolejki, brak transportu do miasta, pandemia nasiliła samotność i izolację szczególnie wśród seniorów.",
     "indicator_value": 42.0, "indicator_unit": "% mieszkańców wsi bez dostępu do specjalisty w 30 min",
     "source": "Mapa potrzeb zdrowotnych 2022–2026, Minister Zdrowia", "data_year": 2023, "powiat": "limanowski"},

    # 7. Zdrowie psychiczne (ROPS Mapa Wyzwań 2024)
    {"title": "Kryzys zdrowia psychicznego dzieci i młodzieży", "area": "zdrowie psychiczne",
     "description": "Wzrost prób samobójczych wśród dzieci i młodzieży. FOMO dotyka co 3. młodego Polaka. Nadmierne korzystanie z elektroniki → depresja. Brak motywacji i problemy z samoakceptacją.",
     "indicator_value": 18.7, "indicator_unit": "% wzrost liczby prób samobójczych wśród dzieci (r/r)",
     "source": "Raport MŁODE GŁOWY – Fundacja UNAWEZA 2023", "data_year": 2023, "powiat": "tarnowski"},
    {"title": "Niedofinansowanie psychiatrii i stygmatyzacja", "area": "zdrowie psychiczne",
     "description": "Finansowanie opieki psychiatrycznej: ok. 3% wydatków NFZ. Stygmatyzacja powoduje niechęć do szukania pomocy. Długofalowe skutki pandemii COVID-19.",
     "indicator_value": 3.0, "indicator_unit": "% wydatków NFZ na psychiatrię",
     "source": "Polska: Profil systemu ochrony zdrowia 2023, State of Health in the EU", "data_year": 2023, "powiat": "myślenicki"},

    # 8. Seniorzy (ROPS Mapa Wyzwań 2024)
    {"title": "Samotność i izolacja seniorów", "area": "seniorzy",
     "description": "Największe problemy seniorów: zdrowie, samotność, finanse, cyfryzacja. Poczucie samotności koreluje z sytuacją materialną. Polipragmazja (wielolekowość) jako zagrożenie zdrowotne.",
     "indicator_value": 31.2, "indicator_unit": "% seniorów 65+ w jednoosobowych gospodarstwach (NSP 2021)",
     "source": "GUS – Sytuacja osób starszych w Polsce 2022 / SeniorApp 2023", "data_year": 2023, "powiat": "nowosądecki"},
    {"title": "Wykluczenie cyfrowe seniorów", "area": "seniorzy",
     "description": "Znaczna część seniorów bez kompetencji cyfrowych – brak dostępu do e-usług, telemedycyny, kontaktu z rodziną przez internet. Starzejące się społeczeństwo jako wyzwanie systemowe.",
     "indicator_value": 68.0, "indicator_unit": "% osób 65+ bez umiejętności cyfrowych",
     "source": "GUS – Społeczeństwo informacyjne 2023", "data_year": 2023, "powiat": "krakowski"},
]

# Indeks Luki Innowacyjnej dla powiatów Małopolski
# gap_score: 1.0 (mało innowacji potrzeba) → 9.9 (duża luka, wiele innowacji brak)
# Dane realistyczne dla hackathon demo
GAP_INDEX = [
    # Powiaty grodzkie
    {"powiat": "Kraków",           "challenge_area": "integracja cudzoziemców",  "innovations_count": 6, "gap_score": 2.1},
    {"powiat": "Tarnów",           "challenge_area": "zdrowie psychiczne",        "innovations_count": 3, "gap_score": 4.2},
    {"powiat": "Nowy Sącz",        "challenge_area": "bezdomność",               "innovations_count": 2, "gap_score": 5.1},
    # Powiaty ziemskie
    {"powiat": "bocheński",        "challenge_area": "rodzina i piecza zastępcza","innovations_count": 2, "gap_score": 5.8},
    {"powiat": "brzeski",          "challenge_area": "ubóstwo",                   "innovations_count": 1, "gap_score": 6.3},
    {"powiat": "chrzanowski",      "challenge_area": "seniorzy",                  "innovations_count": 3, "gap_score": 4.0},
    {"powiat": "dąbrowski",        "challenge_area": "ubóstwo",                   "innovations_count": 1, "gap_score": 7.2},
    {"powiat": "gorlicki",         "challenge_area": "zdrowie",                   "innovations_count": 1, "gap_score": 6.8},
    {"powiat": "krakowski",        "challenge_area": "seniorzy",                  "innovations_count": 8, "gap_score": 1.9},
    {"powiat": "limanowski",       "challenge_area": "niepełnosprawność",          "innovations_count": 1, "gap_score": 7.5},
    {"powiat": "miechowski",       "challenge_area": "ubóstwo",                   "innovations_count": 1, "gap_score": 7.8},
    {"powiat": "myślenicki",       "challenge_area": "zdrowie psychiczne",        "innovations_count": 4, "gap_score": 3.6},
    {"powiat": "nowosądecki",      "challenge_area": "seniorzy",                  "innovations_count": 2, "gap_score": 5.4},
    {"powiat": "nowotarski",       "challenge_area": "bezdomność",               "innovations_count": 1, "gap_score": 6.1},
    {"powiat": "olkuski",          "challenge_area": "rynek pracy",               "innovations_count": 2, "gap_score": 5.0},
    {"powiat": "oświęcimski",      "challenge_area": "zdrowie",                   "innovations_count": 3, "gap_score": 3.8},
    {"powiat": "proszowicki",      "challenge_area": "ubóstwo",                   "innovations_count": 1, "gap_score": 8.1},
    {"powiat": "suski",            "challenge_area": "dostęp do usług",           "innovations_count": 1, "gap_score": 7.0},
    {"powiat": "tarnowski",        "challenge_area": "rodzina i piecza zastępcza","innovations_count": 2, "gap_score": 5.5},
    {"powiat": "tatrzański",       "challenge_area": "integracja cudzoziemców",   "innovations_count": 2, "gap_score": 4.5},
    {"powiat": "wadowicki",        "challenge_area": "seniorzy",                  "innovations_count": 3, "gap_score": 4.1},
    {"powiat": "wielicki",         "challenge_area": "zdrowie psychiczne",        "innovations_count": 4, "gap_score": 3.3},
]


async def seed():
    await init_db()

    async with get_db() as db:
        # Sprawdź czy już seedowano
        from sqlalchemy import select, func
        count = (await db.execute(select(func.count()).select_from(Innovation))).scalar() or 0
        if count >= len(INNOVATIONS):
            print(f"Baza już zawiera {count} innowacji — pomijam seed.")
            return

        print(f"Seedowanie {len(INNOVATIONS)} innowacji...")
        for innov_data in INNOVATIONS:
            innov = Innovation(**innov_data)
            db.add(innov)

        print(f"Seedowanie {len(CHALLENGES)} wyzwań...")
        for ch_data in CHALLENGES:
            ch = Challenge(**ch_data)
            db.add(ch)

        print(f"Seedowanie {len(GAP_INDEX)} wpisów indeksu luki...")
        for gap_data in GAP_INDEX:
            gap = InnovationGapIndex(**gap_data)
            db.add(gap)

        await db.commit()

    # Seed forum posts (only if empty)
    async with get_db() as db:
        from sqlalchemy import select, func as sqlfunc
        forum_count = (await db.execute(select(sqlfunc.count()).select_from(ForumPost))).scalar() or 0
        if forum_count == 0:
            print("Seedowanie wpisów forum...")
            demo_posts = [
                ForumPost(content="Szukam partnera do realizacji projektu dla seniorów w powiecie krakowskim. Mamy już finansowanie z FIO, szukamy doświadczonej NGO z doświadczeniem w pracy z osobami 65+.", author_name="Anna K.", badge="consultant"),
                ForumPost(parent_id=None, content="Jesteśmy NGO z Wieliczki, działamy z seniorami od 10 lat. Chętnie porozmawiamy — proszę o kontakt na kontakt@ngo-wieliczka.pl", author_name="Jan W.", badge="user"),
                ForumPost(content="Testowałem program Cyfrowy Senior w Nowym Sączu — wyniki są bardzo obiecujące. 87% uczestników oceniło zajęcia jako bardzo przydatne. Mogę podzielić się raportem.", author_name="Piotr M.", badge="tester"),
                ForumPost(parent_id=None, content="Proszę o raport! Rozważamy wdrożenie tego programu w naszej gminie w 2027 roku.", author_name="Maria Z.", badge="user"),
                ForumPost(content="Przypominam o aktualizacji wpisów w Bibliotece ROPS — kilka innowacji ma nieaktualne dane kontaktowe i linki do zasobów.", author_name="Admin ROPS", badge="admin"),
                ForumPost(content="Mamy wolne miejsce w naszym projekcie streetworkingu — szukamy wolontariuszy z min. rocznym doświadczeniem w pracy z osobami bezdomnymi. Praca w Krakowie, okolice Kazimierza.", author_name="Tomasz B.", badge="consultant"),
            ]
            # Fix parent_ids — posts 2 and 4 are replies to posts 1 and 3
            # We add them in order, then fix references
            for i, post in enumerate(demo_posts):
                db.add(post)
            await db.flush()
            # Set reply parent_ids
            demo_posts[1].parent_id = demo_posts[0].id
            demo_posts[3].parent_id = demo_posts[2].id
            await db.commit()
            print(f"Zaseedowano {len(demo_posts)} wpisów forum.")

    print(f"[DONE] Seeded: {len(INNOVATIONS)} innowacji, {len(CHALLENGES)} wyzwań, {len(GAP_INDEX)} indeks luki")
    print("Uwaga: ChromaDB nie zostało zaseedowane — wyszukiwanie semantyczne używa mock scoring.")
    print("Aby zaseedować ChromaDB, ustaw OPENROUTER_API_KEY w .env i uruchom seed_innovations.py")


if __name__ == "__main__":
    asyncio.run(seed())
