# BrainWave — Custom Employee Portal with Zoho One Integration

BrainWave is a MERN employee portal. Employees sign in with **portal credentials only**. The backend uses one Zoho OAuth service account to fetch authorized Zoho People, CRM, Desk, and Books data. Employees never see Zoho tokens and never log in to Zoho.

## Architecture

```
Employee
  → BrainWave Login (JWT)
  → Role + permission check (MongoDB RBAC)
  → Role-specific dashboard
  → Internal service page (People / CRM / Desk / Books)
  → BrainWave backend
  → Zoho OAuth access token (server-side only)
  → Zoho People / CRM / Desk / Books API
  → Sanitized JSON
  → BrainWave UI
```

Employees do **not** open `zoho.in` login pages.

## Tech stack

- MongoDB + Mongoose
- Node.js + Express.js
- React.js + Vite
- JWT + bcrypt
- Zoho REST APIs (India data center)

## Installation

```bash
cd backend
npm install

cd ../frontend
npm install
```

Copy `.env.example` to `.env` in the project root and fill secrets.

Copy `frontend/.env.example` to `frontend/.env` if you need a non-default API URL.

## MongoDB setup

Set `MONGO_URI` to a local MongoDB URL or a MongoDB Atlas connection string.

If Atlas fails with an IP whitelist error, add your current IP under **Network Access**. The app will not start without a working database.

## Environment variables

See `.env.example`. Required:

- `MONGO_URI`
- `JWT_SECRET`
- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`

India defaults:

```
ZOHO_OAUTH_TOKEN_URL=https://accounts.zoho.in/oauth/v2/token
ZOHO_PEOPLE_API_BASE_URL=https://people.zoho.in/people/api
ZOHO_CRM_API_BASE_URL=https://www.zohoapis.in/crm/v2
ZOHO_DESK_API_BASE_URL=https://desk.zoho.in/api/v1
ZOHO_BOOKS_API_BASE_URL=https://www.zohoapis.in/books/v3
```

## Zoho One + API Console (Self Client)

1. Use a Zoho One trial on the **India** data center (`accounts.zoho.in`).
2. Open [Zoho API Console](https://api-console.zoho.com/) and create a **Self Client**.
3. Copy Client ID and Client Secret into `.env`.
4. Generate a grant code with the READ scopes below.
5. Exchange the code for a refresh token:

```bash
curl -X POST "https://accounts.zoho.in/oauth/v2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=YOUR_GRANT_CODE"
```

6. Put the `refresh_token` in `ZOHO_REFRESH_TOKEN`.

The backend later calls the same token URL with `grant_type=refresh_token` and never returns tokens to the browser.

## Required OAuth scopes

These match the implemented READ endpoints only:

```
ZOHOPEOPLE.forms.READ,ZohoCRM.modules.READ,ZohoCRM.settings.fields.ALL,Desk.tickets.READ,Desk.basic.READ,ZohoBooks.settings.READ,ZohoBooks.invoices.READ
```

- People employees: `ZOHOPEOPLE.forms.READ`
- CRM leads: `ZohoCRM.modules.READ` and `ZohoCRM.settings.fields.ALL`
- Desk tickets (live mode): `Desk.tickets.READ` and `Desk.basic.READ`
- Books invoices + org discovery: `ZohoBooks.invoices.READ` and `ZohoBooks.settings.READ`

Do not request full-access scopes unless you add write APIs later.

## Role mapping

| Portal role | Zoho application | Backend permission |
|---|---|---|
| Admin | People, CRM, Desk, Books + Admin panel | all listed permissions |
| HR | Zoho People | `zoho:people:access` |
| Sales | Zoho CRM | `zoho:crm:access` |
| Support | Zoho Desk | `zoho:desk:access` |
| Finance | Zoho Books | `zoho:books:access` |

RBAC is enforced on the backend. Manually calling another role’s API returns **403**.

## API endpoints

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Portal
- `GET /api/portal/applications`

### Admin (Admin only)
- Users: `GET/POST /api/admin/users`, `PUT/DELETE /api/admin/users/:userId`
- Roles: `GET/POST /api/admin/roles`, `PUT/DELETE /api/admin/roles/:roleId`
- Permissions: `GET/POST /api/admin/permissions`, `PUT/DELETE /api/admin/permissions/:permissionId`
- Role permissions: `GET/POST /api/admin/roles/:roleId/permissions`
- Audit logs: `GET /api/admin/audit-logs`

### Zoho (JWT + service permission)
- `GET /api/zoho/people/employees`
- `GET /api/zoho/crm/leads`
- `GET /api/zoho/desk/tickets`
- `GET /api/zoho/books/invoices`
- `GET /api/zoho/status`
- `POST /api/zoho/connect` (token check only; never returns Zoho tokens)

## Demo users

Seeded on backend startup (idempotent):

- Admin: `admin` / `Admin@12345`
- HR: `hr` / `Hr@12345`
- Sales: `sales` / `Sales@12345`
- Support: `support` / `Support@12345`
- Finance: `finance` / `Finance@12345`

## Desk mock mode

`ZOHO_DESK_MOCK_MODE=true` (default) returns realistic demo tickets with `source: "mock"`. The UI shows **Demo Mode — Mock Data**.

To use live Desk:

1. Provision Zoho Desk.
2. Set `ZOHO_DESK_MOCK_MODE=false`.
3. Optionally set `ZOHO_DESK_ORG_ID`.
4. Restart the backend.

The live Desk client is already implemented (`orgId` header + `/tickets`).

## Books organization ID

If `ZOHO_BOOKS_ORGANIZATION_ID` is empty, the backend calls `GET /organizations`.

- One organization: it is used automatically.
- Multiple organizations: configure `ZOHO_BOOKS_ORGANIZATION_ID`.

## Security model

- Passwords hashed with bcrypt
- JWT required on protected APIs
- Permissions loaded from MongoDB on each request
- Zoho client secret, refresh token, and access token stay on the server
- Helmet + CORS
- `.env` is gitignored
- Tokens and secrets are not returned or logged

## Employee flow

1. Sign in at `/login`.
2. Dashboard lists only authorized services.
3. Open a service card to stay inside BrainWave (`/services/people`, `/crm`, `/desk`, `/books`).
4. The page calls the BrainWave API. The backend talks to Zoho.

## Admin flow

1. Sign in as Admin.
2. Open Admin to manage users, roles, permissions, and audit logs.
3. Open any Zoho service page the same way employees do.

## Start the app

```bash
cd backend
npm run dev

cd frontend
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Troubleshooting

| Problem | What to check |
|---|---|
| MongoDB connection failed | Atlas IP allowlist or local `mongod` |
| Session expired | JWT expired (`JWT_EXPIRES_IN`) — sign in again |
| 403 on a service page | That role is not mapped to the service |
| Zoho token error | Refresh token, India token URL, and scopes |
| Desk shows Demo Mode | `ZOHO_DESK_MOCK_MODE=true` |
| Books asks for organization ID | Set `ZOHO_BOOKS_ORGANIZATION_ID` |
