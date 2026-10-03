# hackyeah

Monorepo projektu na HackYeah.

| Folder | Co to jest | Stack |
| --- | --- | --- |
| [`find_inv/`](find_inv) | client – frontend | Next.js, React, Tailwind |
| [`find_inv_server/`](find_inv_server) | server – backend API | FastAPI (Python 3.12+) |

## Szybki start

### Server (port 8000)

```powershell
cd find_inv_server
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
fastapi dev app/main.py
```

Szczegóły (macOS/Linux, testy, dodawanie endpointów): [find_inv_server/README.md](find_inv_server/README.md).

### Client (port 3000)

Wymaga Node.js 20+.

```bash
cd find_inv
npm install
npm run dev
```

Frontend: http://localhost:3000 · API: http://localhost:8000 · Swagger: http://localhost:8000/docs
