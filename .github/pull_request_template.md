## Agent
<!-- A1 / A2 / A3 / A4 / A5 -->

## Co dodaje ten PR
<!-- Jeden endpoint = jeden PR. Max 2 zdania. -->

## Endpointy gotowe do użycia
<!-- Lista - wklej curl lub przykład request/response -->
```
POST /api/...
GET  /api/...
```

## Zależności dla innych agentów
<!-- Czy ktoś czekał na ten PR? Napisz w COMMS.md że skończyłeś. -->
- [ ] Zaktualizowałem swój blok w `COMMS.md`

## Checklist
- [ ] Działa lokalnie (`uvicorn app.main:app`)
- [ ] Nie ruszyłem `models.py` / `schemas.py` / `llm.py` / `embeddings.py` bez opisu
- [ ] Response format: `{ "data": ..., "error": null }`
