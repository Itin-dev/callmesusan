# Convenience shortcuts — hooks/CI still call scripts/validate.sh directly.
.PHONY: check bootstrap doctor api web requirements

check:
	bash scripts/validate.sh

bootstrap:
	bash scripts/bootstrap.sh

doctor:
	bash scripts/doctor.sh

api:  ## FastAPI on http://localhost:8000 (auto-reload)
	cd services/api && uv run uvicorn app.main:app --reload

web:  ## Vite dev server on http://localhost:5173 (proxies /api to :8000)
	npm --prefix apps/web run dev

requirements:  ## Regenerate root requirements.txt (used by Vercel) from services/api/uv.lock
	cd services/api && uv export --frozen --no-dev --no-hashes --no-emit-project --no-header -q -o ../../requirements.txt
