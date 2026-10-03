# find_inv_server

Backend w FastAPI dla frontendu `find_inv` (Next.js, folder obok).

## Co musisz mieć

- **Python 3.12 lub nowszy** – sprawdź: `python --version` (Windows: `py --list`).
  Pobierz z https://www.python.org/downloads/ – przy instalacji na Windows zaznacz **„Add python.exe to PATH”**.
- **Git** (do pobrania repo).
- Opcjonalnie **Node.js 20+**, jeśli chcesz odpalić też frontend `find_inv`.

Nic więcej – wszystkie biblioteki instalują się z `requirements.txt` do lokalnego venv'a.

## Pierwsze uruchomienie

> Folder `.venv` **nie jest w repo** (jest w `.gitignore`) – każdy tworzy własny, bo venv nie jest przenośny między komputerami.

### Windows (PowerShell)

```powershell
cd find_inv_server
py -3.12 -m venv .venv            # albo: python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env            # opcjonalnie, domyślne wartości działają
```

Jeśli `Activate.ps1` wywala błąd o „execution policy”, uruchom raz:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### macOS / Linux

```bash
cd find_inv_server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # opcjonalnie
```

## Uruchamianie serwera

Z aktywnym venv'em, w folderze `find_inv_server`:

```bash
fastapi dev app/main.py
```

(równoważnie: `uvicorn app.main:app --reload --port 8000`)

- API: http://localhost:8000
- Dokumentacja Swagger: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health → `{"status": "ok"}`

Serwer przeładowuje się sam po zapisaniu pliku.

## Testy

```bash
pytest
```

## Struktura

```
find_inv_server/
├── app/
│   ├── main.py          # tworzy aplikację, CORS, podpina routery
│   ├── config.py        # ustawienia (czytane z .env)
│   └── routers/
│       └── health.py    # GET /api/health
├── tests/               # testy pytest
├── requirements.txt     # zależności (wersje przypięte)
└── .env.example         # wzór konfiguracji
```

## Jak dodać nowy endpoint

1. Utwórz plik w `app/routers/`, np. `app/routers/items.py`:

   ```python
   from fastapi import APIRouter

   router = APIRouter(prefix="/items", tags=["items"])

   @router.get("")
   def list_items() -> list[str]:
       return ["a", "b"]
   ```

2. Podepnij go w `app/main.py`:

   ```python
   from app.routers import health, items
   app.include_router(items.router, prefix="/api")
   ```

3. Wejdź na http://localhost:8000/docs – endpoint `GET /api/items` już tam jest.

## Połączenie z frontendem (find_inv)

CORS jest domyślnie otwarty dla `http://localhost:3000` (port Next.js). Z frontendu:

```ts
const res = await fetch("http://localhost:8000/api/health");
```

Inny port/adres frontendu? Zmień `CORS_ORIGINS` w `.env`.

## Dodawanie bibliotek

```bash
pip install nazwa-paczki
```

i **dopisz ją z wersją do `requirements.txt`** (`pip show nazwa-paczki` pokaże wersję), żeby reszta zespołu miała to samo.
