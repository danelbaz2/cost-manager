# Cost Manager — RESTful Web Services

Final project for the **Asynchronous Server-Side Development** course.

A cost-tracking REST API split into **four independent Node.js processes**
(microservices) backed by a single MongoDB Atlas database. Built with
Express.js, Mongoose, and Pino.

## Services

| Process | Port (default) | Responsibility | Endpoints |
| --- | --- | --- | --- |
| `users`  | 3001 | User accounts            | `POST /api/add`, `GET /api/users`, `GET /api/users/:id` |
| `costs`  | 3002 | Cost items & reports     | `POST /api/add`, `GET /api/report` |
| `logs`   | 3003 | Admin: read request logs | `GET /api/logs` |
| `about`  | 3004 | Team / developer info    | `GET /api/about` |

> The `about` service does **not** touch the database — team members are read
> from `.env` (or hardcoded) per the spec.

## Repository layout

```
cost-manager/
├── shared/                # Mongoose models, logger, config (consumed by services)
│   ├── models/            # users.js, costs.js, logs.js, reports.js
│   ├── logger.js          # Pino → MongoDB transport + Express middleware
│   ├── db.js              # Mongoose connection helper
│   └── env.js             # dotenv loading + validation
├── services/
│   ├── users/             # Process 1 — user-related endpoints
│   ├── costs/             # Process 2 — cost-related endpoints + report
│   ├── logs/              # Process 3 — log reader (admin)
│   └── about/             # Process 4 — developers info
├── tests/                 # Unit / integration tests for every endpoint
├── scripts/seed.js        # inserts the single demo user
├── .env.example
├── package.json           # Workspaces root: scripts to run each service
└── README.md
```

## Quick start

```bash
cp .env.example .env       # fill MONGO_URI etc.
npm install                # installs deps for all workspaces
npm run dev:users          # or dev:costs / dev:logs / dev:about
npm test                   # run unit tests
```
