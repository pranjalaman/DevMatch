# DevMatch

### Great ideas need the right team.

DevMatch helps BIT Sindri students find projects that fit their skills—and helps project leads find the teammates they need.

## Why DevMatch?

- **Skill-based project matches** — See a match score, shared skills, and the role that fits you best.
- **Find teammates for open roles** — Project leads get ranked student suggestions for each role.
- **Discover projects quickly** — Browse, search, and filter by skills or availability.
- **Build a team across campus** — Connect with students from different branches and years.
- **Turn an idea into a listing** — Post a project, define roles, and manage your team needs.
- **See the project behind the pitch** — Review details and follow contact or GitHub links.

## Quick demo

1. Sign up and add a few skills.
2. Browse the feed and notice how matches are ranked.
3. Open a project to see why it matches and which roles are open.
4. Post a project with roles to see how a lead can recruit teammates.

## Run locally

1. Point `DATABASE_URL` at a PostgreSQL database that already has the DevMatch tables.
2. Create `.env` in the project folder:

   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
   SECRET_KEY=use-a-long-random-secret
   APP_ENV=development
   ```

   A public deploy must set both `APP_ENV=production` and `SECRET_KEY`. The process will not start when `APP_ENV` is any value other than `development` and `SECRET_KEY` is missing.

3. Install and run:

   ```sh
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

4. Open http://127.0.0.1:8000. API docs: http://127.0.0.1:8000/docs.

**Built with:** FastAPI · PostgreSQL · Vanilla JavaScript

Keep `.env` private. Never commit passwords, tokens, or database credentials.
