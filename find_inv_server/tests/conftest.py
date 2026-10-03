import os
import tempfile

# Testy nie mogą pisać do lokalnej zasobnik.db — ustawiamy bazę tymczasową przed importem aplikacji.
os.environ["ZASOBNIK_DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"

from app.db import init_db  # noqa: E402

init_db()
