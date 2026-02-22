# LedgerBook (MERN Learning Project)

LedgerBook is a shared grocery credit ledger for a **buyer** and a **seller**.

Both sides can create and edit entries, but each entry needs agreement from both roles:
- `pending`: waiting for one/both approvals
- `approved`: both sides approved (locked)
- `disputed`: one side marked disagreement

If an approved entry needs a change, this app creates a **correction entry** instead of silently changing history.

### New Productivity Features

- **Smart recommendations**: Suggests item quantity and price from approved history.
- **Shortcuts**: Save one-click presets for recurring items (like Snapchat shortcuts idea).
- **Automation templates**: Configure recurring items (`daily`, `every_2_days`, `weekly`, `monthly`) and run due templates in one click.
- **Theme Studio**: User-controlled light/dark mode with major tone + undertone customization.
- **Animated branding**: Gradient animated LedgerBook logo.

## 1. Tech Stack (and why)

- **MongoDB**: Stores users and ledger records.
- **Express + Node.js**: Backend API and business rules.
- **React + Vite**: Frontend dashboards and forms.
- **JWT auth**: Secure login session for API requests.

## 2. Project Structure

```txt
LedgerBook/
  server/   # Node + Express + Mongo backend
  client/   # React frontend
```

## 3. Setup

### Configure MongoDB Atlas (Free Tier, Required)

1. Create a free Atlas cluster.
2. Create a DB user (username/password).
3. In Network Access, allow your current IP (or `0.0.0.0/0` for development).
4. Copy the connection string and replace `MONGO_URI` in `/Users/pranshutiwari/LedgerBook/server/.env`.
5. URL-encode special password characters (`@`, `#`, `%`, `/`, `:`) before putting password in URI.

### Backend

1. Go to backend folder:
```bash
cd server
```

2. Install packages:
```bash
npm install
```

3. Create env file:
```bash
cp .env.example .env
```

4. Paste your Atlas URI in `/Users/pranshutiwari/LedgerBook/server/.env`:
```txt
MONGO_URI=mongodb+srv://<username>:<url-encoded-password>@<cluster-url>/ledgerbook?retryWrites=true&w=majority&appName=LedgerBook
```

5. Test Atlas connection:
```bash
npm run db:check
```

6. Start backend:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

### Frontend

1. Open new terminal, go to frontend folder:
```bash
cd client
```

2. Install packages:
```bash
npm install
```

3. Create env file:
```bash
cp .env.example .env
```

4. Start frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

## 4. Auth + Group Concept

At signup, both buyer and seller should use the same `groupCode` (example: `HOME123`).
That group code connects both users to the same ledger data.

## 5. Main API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/ledger?month=YYYY-MM`
- `GET /api/ledger/summary?month=YYYY-MM`
- `GET /api/ledger/recommendations?limit=8`
- `POST /api/ledger`
- `PATCH /api/ledger/:id` (edit pending/disputed and reset approvals)
- `PATCH /api/ledger/:id/decision` (`approve` or `dispute`)
- `POST /api/ledger/:id/corrections` (for approved entries)
- `GET /api/ledger/shortcuts`
- `POST /api/ledger/shortcuts`
- `PATCH /api/ledger/shortcuts/:id`
- `DELETE /api/ledger/shortcuts/:id`
- `POST /api/ledger/shortcuts/:id/use`
- `GET /api/ledger/automations`
- `POST /api/ledger/automations`
- `PATCH /api/ledger/automations/:id`
- `POST /api/ledger/automations/run-due`

## 6. Learning Notes

- Entry creation auto-approves creator's side, then waits for the other side.
- Any edit resets approvals and records change history (`version` + `history[]`).
- Approved entries are locked to preserve trust.
- Corrections create a new trail entry, similar to audit/blockchain thinking.
- Shortcuts are your reusable presets for common daily items.
- Recommendations are generated from approved historical entries.
- Automations are templates; running due automations creates pending entries quickly.
- Theme Studio stores user theme preferences in browser local storage.

## 7. Troubleshooting Signup "Failed to fetch"

If signup/login shows `Failed to fetch`, check:

1. Backend is running:
```bash
cd server
npm run start
```

2. Atlas connection is valid:
```bash
cd server
npm run db:check
```

3. Common Atlas failures:
- Wrong username/password in `MONGO_URI`
- Password not URL-encoded
- Your IP is not allowed in Atlas Network Access
- DB user has no permissions for the selected database

4. Frontend `.env` has:
```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

5. CORS env allows your dev origin ports (`CLIENT_ORIGINS` already supports common localhost ports in `.env.example`).

The Auth page now shows backend health status to make this easier to debug.
If DB is down, backend now stays up and returns clear `503 Database unavailable` errors instead of hard-failing.
