# DevMatch

## Run locally

The application reads `DATABASE_URL`, `SECRET_KEY`, and optional `GITHUB_TOKEN`
from the local `.env` file. Point `DATABASE_URL` at the already-provisioned
PostgreSQL database described in [SPEC.md](./SPEC.md). The database schema,
canonical skills, and demo data are managed outside this repository.

Install the runtime dependencies and start the app:

```sh
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Keep `.env` local and git-ignored. Never commit database credentials or other
secrets.
