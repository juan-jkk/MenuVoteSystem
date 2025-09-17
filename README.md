# MenuVoteSystem - Dockerized (no-auth) - Ready to run

This package has been prepared to run with Docker. Authentication has been disabled so the site is accessible without login. Data is persisted to a JSON file in a Docker volume (no external DB setup required).

## Run
1. Make sure you have Docker and Docker Compose installed.
2. From the project root, run:
   ```bash
   docker compose up --build
   ```
3. Open http://localhost:3000 in your browser (or use your phone on the same network).

## Notes
- The `db` service (Postgres) is included but the app currently uses a simple file-based data store at `/data/data.json`. This keeps setup simple and reliable.
- If you later want to switch to Postgres, we can migrate storage to use Postgres and create proper migrations.
