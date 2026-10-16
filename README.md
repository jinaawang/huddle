# Huddle

Your calendar, shared with your groups. Everyone gets their own username and password and sees their calendar by day, week, month or year. You add people to groups (Office, Friends…), choose per event who sees it and how much they see, find a time when a whole group is free, and send invites.

It's a web app: there's nothing to install from the App Store. You put it on GitHub Pages (free hosting), Supabase stores the data (free plan is plenty), and on iPhone you add it to your Home Screen so it opens like an app.

**What's in this folder**

| File | What it is |
| --- | --- |
| `index.html`, `app.js`, `styles.css` | The app itself |
| `config.js` | **The one file you edit**: your Supabase address and key |
| `manifest.webmanifest`, `icons/` | Name and icon for the iPhone Home Screen |
| `supabase/schema.sql` | Sets up the database and its privacy rules (you paste this into Supabase once) |

---

## Step 1: Set up Supabase (about 10 minutes)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**.
   - Name: `Huddle`
   - Database password: make one and save it somewhere (you won't need it for the app, but keep it)
   - Region: **Southeast Asia (Singapore)** is closest to Bangkok
   - Click **Create new project** and wait a minute or two until it's ready.
2. In the left menu open **SQL Editor** → **New query**.
   Open `supabase/schema.sql` from this folder in any text editor, copy **everything**, paste it in, and press **Run**.
   You should see *"Success. No rows returned."*
3. In the left menu open **Authentication** → **Sign In / Providers** (on some accounts it's under **Providers → Email**).
   Make sure **Email** is enabled, then turn **Confirm email OFF** and click **Save**.
   *Why: Huddle signs people in with a username, not a real email, so there's nothing to confirm.*
4. Click the **Connect** button at the top of the project (or go to **Project Settings** → **API**) and copy two things:
   - **Project URL**: looks like `https://abcdefgh.supabase.co`
   - **anon public** key: a long string starting with `eyJ…`. (If you only see a "Publishable key" starting with `sb_publishable_…`, that works too.)

   ⚠️ Never use the **service_role** or **secret** key. That one must stay private.

## Step 2: Put your keys into `config.js`

Open `config.js` in a plain text editor (TextEdit: Format → Make Plain Text; or Notepad on Windows) and replace the two placeholders, keeping the quote marks:

```js
export const SUPABASE_URL = 'https://abcdefgh.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOi…your whole key…';
```

Save the file. Leave the third line (`USERNAME_EMAIL_DOMAIN`) as it is.

> The anon key is meant to be public. It's safe in a public GitHub repo, because the database's privacy rules decide what each signed-in person can see.

## Step 3: Put it on GitHub and turn on GitHub Pages

1. Go to [github.com/new](https://github.com/new).
   - Repository name: `huddle`
   - Choose **Public** (free GitHub Pages needs a public repo; your *data* stays private in Supabase, only the app code is visible)
   - Click **Create repository**.
2. On the new, empty repo page click the link **"uploading an existing file"**.
   Drag in **everything inside** this `huddle` folder: the files *and* the `icons` and `supabase` folders.
   Scroll down and click **Commit changes**.
3. Open the repo's **Settings** → **Pages**.
   Under **Build and deployment**: Source = **Deploy from a branch**, Branch = **main** and **/ (root)** → **Save**.
4. Wait 1–2 minutes and refresh that page. GitHub shows your link, something like
   `https://YOUR-GITHUB-NAME.github.io/huddle/`

Open the link: you should see Huddle's **Create account** screen.

## Step 4: Put it on your iPhone

1. Open your link in **Safari** on the iPhone.
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. Open Huddle from the Home Screen. It runs full-screen like an app.

## Step 5: Try it with real people

1. Create your account (name, username, password).
2. Send your friends the link; each creates their own account.
3. **Groups** tab → **New group** → name it → add people by their username.
4. Tap **+** to add events. Choose **Private**, or pick the groups that can see it, and whether they see **Full details** or **Busy only**.
5. **Find a time** tab → pick a group → tap a time when everyone's free → **Plan a group event** → **Send invite**.
6. Your friends see it in their **Invites** tab and can accept or decline.

---

## Making changes later

Edit a file on GitHub (open it → pencil icon → **Commit changes**), or upload a new version the same way as before. GitHub Pages updates within a minute or two; on iPhone, close and reopen Huddle to pick it up.

## Troubleshooting

| You see | Fix |
| --- | --- |
| **"Almost there"** screen | `config.js` still has the placeholders. Paste your URL and anon key (Step 2) and upload `config.js` again. |
| "Supabase wants email confirmation" after creating an account | Turn off **Confirm email** (Step 1.3). Then sign in with the same username and password. |
| "Supabase rejected the sign-in address" | In `config.js`, change `USERNAME_EMAIL_DOMAIN` to a domain you own (e.g. `users.yourcompany.com`). Do this before people sign up, because changing it later stops existing accounts from signing in. |
| "Can't reach Huddle's server" | Check your internet. If it keeps happening, check the URL in `config.js`. Free Supabase projects pause after a week of no use; open the Supabase dashboard and click **Restore**. |
| The SQL in Step 1.2 says something "already exists" | It was already run once. Nothing to do. |
| Forgot a password | Huddle doesn't send emails, so there's no reset link yet. In Supabase → **Authentication** → **Users** you can delete that user so they can sign up again. |

## How privacy works

- **Private** events are only ever visible to you. They don't even count as "busy" for your groups.
- **Busy only**: the group sees *"Jina · busy"* and the time, never the title, place or notes. This is enforced by the database, not just hidden in the app.
- **Full details**: the group sees everything.
- **Find a time** only counts events each person has shared with *that* group (plus group events they've said yes to), and never shows what they are.
- Only a group's manager (whoever made it) can add or remove people. Anyone can leave a group.
- You can only invite people who are in one of your groups.

## Not in this first version (yet)

- **Phone notifications when Huddle is closed.** "Remind me" alerts show at the top of your calendar when they're due. Real push notifications on iPhone are the next step.
- Changing a single date of a repeating event (edits apply to the whole series).
- Password reset by email, renaming a group, and hiding a birthday reminder from the birthday person.
