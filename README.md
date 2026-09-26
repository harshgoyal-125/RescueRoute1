# RescueRoute1

A food rescue coordination app based on the existing RescueRoute React/Vite and Express/Mongoose codebase. Donors post surplus food, shelters review deterministic matches, drivers claim pickups and record delivery, and coordinators manage public food requests and impact records. Gemini helps parse donation text and explain matches; it does not choose recipients or change records.

## Status

The frontend builds locally and the backend matching/security unit suite passes (22 tests). The existing frontend suite has 11 failing tests out of 41 because its older expectations still assume simulated data or localStorage as proof of login; those tests have not yet been brought up to date. End-to-end and database-backed tests must be rerun against an isolated MongoDB test database before this can be called verified. No sample records are loaded in production. A connected database, backend URL, CORS origin and optional Gemini key are required for the hosted app. See [DEPLOYMENT.md](DEPLOYMENT.md) for setup and validation.

## Run locally

Requires Node.js 20+ and MongoDB. Keep secrets in `backend/.env` (ignored by Git); start from `backend/.env.example` and choose a new JWT secret. Start with `npm ci` in both the root and `backend` directories, then run `npm run dev` in the root and `npm run dev` in `backend` in separate terminals. The frontend defaults to `http://localhost:5000/api` unless `VITE_API_URL` is supplied.

Run `npm run build` and `npm test` in the root. Backend pure matching tests run with `cd backend && npm test -- --run test/matchingService.unit.test.js`; full backend tests require an isolated local MongoDB test instance. The destructive demo seed script was removed; use isolated test data only.

## Data and access notes

Public registration creates donor, shelter or driver accounts only. Administrators must be provisioned separately by the site owner, not through public signup. No shared demo accounts are provisioned by deployment. Users without verified geographic coordinates are not placed at a guessed location or matched as nearby. Impact counts only delivered records in their original units: meals, lbs and kg are not converted into each other, and no CO2e figure is claimed without a verified methodology. Map distances are straight-line estimates, not turn-by-turn routing.

The code is not proof of real-world food safety, partner vetting or delivery completion; those require operational controls outside this app.
