# HES Retrofits Tracker

Role-based project tracker for Home Energy Savings retrofit workflow.

## Deploy Guide — Supabase + Netlify

### Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and open your project
2. Go to **SQL Editor** (left sidebar)
3. Click **New query**
4. Copy/paste the entire contents of `supabase/schema.sql` and click **Run**
5. This creates the `users` and `projects` tables and seeds default accounts

**Get your API keys:**
1. Go to **Settings → API** (left sidebar)
2. Copy **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy **anon public** key (under Project API keys)

### Step 2: GitHub Setup

```bash
# In this project folder:
git init
git add .
git commit -m "Initial commit"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR-USERNAME/hes-tracker.git
git branch -M main
git push -u origin main
```

### Step 3: Netlify Deploy

1. Go to [netlify.com](https://netlify.com) and log in
2. Click **Add new site → Import an existing project**
3. Connect to **GitHub** and select your `hes-tracker` repo
4. Build settings should auto-detect from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Show advanced** → **New variable** and add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **Deploy site**

### Step 4: Verify

1. Open your Netlify URL
2. Log in with `admin` / `1234`
3. Create a test project
4. Check Supabase **Table Editor** — you should see the project in the `projects` table

### Default Accounts

| Username    | PIN  | Role             |
|-------------|------|------------------|
| admin       | 1234 | Admin/Ops        |
| scheduler   | 1234 | Scheduler        |
| assessor    | 1234 | Assessor         |
| scope       | 1234 | Scope/Compliance |
| installer   | 1234 | Install Crew     |

**Change PINs immediately** after first login via the 👥 Users panel (Admin only).

### Local Development

```bash
# Copy env file and add your keys
cp .env.example .env

# Install and run
npm install
npm run dev
```

Opens at `http://localhost:5173`

### Project Structure

```
hes-tracker/
├── index.html          # Entry point
├── netlify.toml        # Netlify config (SPA redirect)
├── package.json
├── vite.config.js
├── .env.example        # Template for env vars
├── supabase/
│   └── schema.sql      # Run this in Supabase SQL Editor
└── src/
    ├── main.jsx        # React mount
    ├── App.jsx         # Full application
    ├── supabase.js     # Supabase client
    └── db.js           # Database operations layer
```

### Notes

- **Photos** are stored as base64 in the project JSONB. For high-volume use, consider migrating to Supabase Storage.
- **RLS policies** are wide open (anon access). Once stable, consider adding Supabase Auth for proper row-level security.
- **Session** uses browser sessionStorage — closing the tab logs you out. This is intentional for shared devices.
