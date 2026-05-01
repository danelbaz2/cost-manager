# Deployment

Each of the four services must end up on its own URL. The submission form
asks for four addresses.

## Recommended target: Render.com (free tier)

Each service becomes a separate **Web Service** on Render, all pointing to
the same repo but with different start commands and root directories:

| Render service name      | Root dir            | Start command       | Env vars                                                  |
| ------------------------ | ------------------- | ------------------- | --------------------------------------------------------- |
| `cost-manager-users`     | `services/users`    | `node index.js`     | `MONGO_URI`, `PORT=10000`                                 |
| `cost-manager-costs`     | `services/costs`    | `node index.js`     | `MONGO_URI`, `PORT=10000`                                 |
| `cost-manager-logs`      | `services/logs`     | `node index.js`     | `MONGO_URI`, `PORT=10000`                                 |
| `cost-manager-about`     | `services/about`    | `node index.js`     | `TEAM_MEMBERS`, `PORT=10000`                              |

> Render assigns one HTTPS URL per service and listens on `$PORT`. Same-port
> conflicts can't happen because the services are on different machines.

Alternatives that work the same way: **Railway**, **Fly.io**,
**Cyclic**, or four small VMs on AWS Lightsail / DigitalOcean.

## Local "all four at once"

Root `package.json` will expose:

```jsonc
{
  "scripts": {
    "dev:users": "node services/users/index.js",
    "dev:costs": "node services/costs/index.js",
    "dev:logs":  "node services/logs/index.js",
    "dev:about": "node services/about/index.js",
    "start":     "concurrently -n users,costs,logs,about -c blue,green,yellow,magenta \"npm:dev:users\" \"npm:dev:costs\" \"npm:dev:logs\" \"npm:dev:about\""
  }
}
```

## `.env` contract

```
# MongoDB Atlas connection string (any DB name, e.g. cost_manager)
MONGO_URI=mongodb+srv://USER:PASS@cluster0.example.mongodb.net/cost_manager

# Local ports (only used when running locally, not on Render)
PORT_USERS=3001
PORT_COSTS=3002
PORT_LOGS=3003
PORT_ABOUT=3004

# About service — JSON array, no DB
TEAM_MEMBERS=[{"first_name":"Dan","last_name":"Elbaz"}]
```

## Pre-submission checklist

- [ ] Four URLs respond on the public internet
- [ ] Database is empty except for the single `mosh israeli` user
- [ ] All 7 endpoints work end-to-end against the deployed services
- [ ] Demo video uploaded (unlisted) on YouTube, link in PDF
- [ ] PDF includes every source file with filename headers
- [ ] ZIP excludes `node_modules`
- [ ] Submission form filled with the four URLs
