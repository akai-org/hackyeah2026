import asyncio
import os
import tempfile

# Testy nie mogą pisać do lokalnych baz ani wołać OpenRouter — ustawiamy wszystko przed importem aplikacji.
_tmp = tempfile.mkdtemp()
os.environ["ZASOBNIK_DATABASE_URL"] = f"sqlite:///{_tmp}/zasobnik.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_tmp}/findinv.db"
os.environ["CHROMA_PATH"] = f"{_tmp}/chroma"
os.environ["OPENROUTER_API_KEY"] = ""

from app.database import init_db  # noqa: E402
from app.zasobnik.db import init_db as init_zasobnik_db  # noqa: E402

init_zasobnik_db()
asyncio.run(init_db())
