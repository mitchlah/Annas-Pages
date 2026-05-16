# Cloud setup (Supabase)

Anna's Pages stores data locally until you connect it to a Supabase
project. Once connected it requires a passwordless email sign-in and syncs
each user's library across their devices. Every user only ever sees their
own data (enforced by row-level security).

Follow these steps once.

## 1. Create a project

1. Sign up at https://supabase.com (free tier is enough).
2. Create a new project. Pick a region close to you and set a database
   password (you won't need it for the app).

## 2. Create the table

In the Supabase dashboard open **SQL Editor**, paste the following and run it:

```sql
create table public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "Users read their own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users insert their own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "Users update their own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

This gives every signed-in user one private row holding their whole library.

## 3. Turn the emails into a 6-digit code

By default Supabase emails a confirmation/magic **link**. We want a code
instead. Supabase uses **two** templates and you must edit **both**:

- **Confirm signup** — sent the first time a new email signs in.
- **Magic Link** — sent to returning users.

If you only edit one, some users will still get a "confirm your email" link.

1. Go to **Authentication → Providers → Email** and make sure it is
   enabled. Leave "Confirm email" on.
2. Go to **Authentication → Email Templates**. For **both** the
   **Confirm signup** and **Magic Link** templates, replace the message
   body with something like:

   ```html
   <h2>Your Anna's Pages sign-in code</h2>
   <p>Enter this code to sign in:</p>
   <p style="font-size:24px;font-weight:bold;letter-spacing:3px">{{ .Token }}</p>
   <p>The code expires shortly. If you didn't request it, ignore this email.</p>
   ```

   The key part is `{{ .Token }}` — that is the 6-digit code. Make sure
   neither template still contains `{{ .ConfirmationURL }}`.

## 4. Set the site URL

Go to **Authentication → URL Configuration** and set **Site URL** to your
deployed address, e.g. `https://<your-username>.github.io/Annas-Pages/`.

## 5. Get your keys

Go to **Project Settings → API** and copy:

- **Project URL**
- **anon public** API key (safe to expose in the browser — row-level
  security protects the data).

## 6. Give the keys to the app

**For the deployed site:** in the GitHub repo go to
**Settings → Secrets and variables → Actions → New repository secret** and
add two secrets:

- `VITE_SUPABASE_URL` — the Project URL
- `VITE_SUPABASE_ANON_KEY` — the anon public key

Then re-run the **Deploy to GitHub Pages** workflow.

**For local development:** copy `.env.example` to `.env` and fill in the
same two values.

## Done

Open the app — it now asks for an email, sends a 6-digit code, and after
sign-in keeps that user's library in the cloud. The first time an existing
local user signs in, their on-device data is uploaded to their new account.

### Notes

- Supabase's built-in email sender is rate-limited (a few messages per
  hour). For heavier use, configure a custom SMTP provider under
  **Authentication → Emails**.
- Anyone with the link can sign up; that's expected for a multi-user app.
  To restrict it, disable open sign-ups in **Authentication → Providers →
  Email** and invite users from the dashboard instead.
