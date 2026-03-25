# StudySync — Full MVP

Canvas-connected study planner. Two parts: a React frontend and a Node.js backend.

---

## Setup (do this once)

### Step 1 — Install dependencies

Open TWO terminals in VS Code.

**Terminal 1 (backend):**
```bash
cd backend
npm install
```

**Terminal 2 (frontend):**
```bash
cd frontend
npm install
```

---

### Step 2 — Set up Supabase (free, no credit card)

1. Go to https://supabase.com and create a free account
2. Create a new project (remember your database password)
3. Once the project loads, go to **SQL Editor**
4. Paste the contents of `supabase_schema.sql` and click **Run**
5. Go to **Project Settings → API** and copy:
   - Project URL
   - anon/public key

---

### Step 3 — Environment variables

**backend/.env** — copy from `backend/.env.example` and fill in:
```
CANVAS_BASE_URL=https://uta.instructure.com
CANVAS_CLIENT_ID=          ← get from Canvas admin or use personal token
CANVAS_CLIENT_SECRET=      ← same
SUPABASE_URL=              ← from Step 2
SUPABASE_SERVICE_KEY=      ← Service Role key (not anon) — in Project Settings → API
ANTHROPIC_API_KEY=         ← from console.anthropic.com (for announcement parser)
PORT=3001
```

**frontend/.env** — copy from `frontend/.env.example` and fill in:
```
REACT_APP_CANVAS_BASE_URL=https://uta.instructure.com
REACT_APP_CANVAS_CLIENT_ID=   ← same as backend
REACT_APP_SUPABASE_URL=       ← from Step 2
REACT_APP_SUPABASE_ANON_KEY=  ← anon key (not service key)
REACT_APP_API_URL=http://localhost:3001
```

---

### Step 4 — Canvas token (skip OAuth for now)

While building locally, skip the full OAuth flow. Just:
1. Log into Canvas → Account → Settings
2. Scroll to **Approved Integrations** → **New Access Token**
3. Copy the token
4. In `backend/.env` add: `CANVAS_PERSONAL_TOKEN=your_token_here`

The app will use this token automatically in dev mode.

---

### Step 5 — Run it

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm start
```

Open http://localhost:3000

---

## Project Structure

```
studysync-full/
├── README.md                 ← you are here
├── supabase_schema.sql       ← run this in Supabase SQL editor
│
├── backend/
│   ├── server.js             ← Express server, all API routes
│   ├── canvasApi.js          ← Canvas REST API helpers
│   ├── announcementParser.js ← Claude AI date extraction
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── App.jsx           ← Routes + layout
    │   ├── index.js
    │   ├── index.css         ← Global styles
    │   ├── lib/
    │   │   └── api.js        ← All API calls + Supabase client
    │   ├── hooks/
    │   │   ├── useSchedule.js
    │   │   └── useCanvas.js
    │   ├── components/
    │   │   ├── BottomNav.jsx
    │   │   └── AnnouncementAlert.jsx
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Schedule.jsx
    │       ├── Tasks.jsx
    │       ├── Connect.jsx
    │       └── AuthCallback.jsx
    ├── public/
    │   └── index.html
    ├── package.json
    └── .env.example
```
