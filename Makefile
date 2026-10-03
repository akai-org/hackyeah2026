.PHONY: setup backend frontend

setup:
	bash setup.sh

backend:
	cd find_inv_server && source .venv/bin/activate && fastapi dev app/main.py

frontend:
	cd find_inv && npm run dev
