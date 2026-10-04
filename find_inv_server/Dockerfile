# Backend HubMI (FastAPI). Budowa: docker compose build backend  (albo: docker build -t hubmi-api find_inv_server)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN chmod +x docker-entrypoint.sh

# Dane (SQLite, ChromaDB, załączniki) trzymamy w /data — w compose to wolumen, przeżywa restart i aktualizację.
ENV DATABASE_URL=sqlite+aiosqlite:////data/findinv.db \
    ZASOBNIK_DATABASE_URL=sqlite:////data/zasobnik.db \
    CHROMA_PATH=/data/chroma_db \
    UPLOADS_PATH=/data/uploads \
    DATA_REFRESH_STATE_PATH=/data/data_refresh.json
VOLUME ["/data"]
EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
