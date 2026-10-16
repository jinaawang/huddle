// Huddle — a shared calendar for you and your groups.
// Plain JavaScript, no build step. Data lives in Supabase (see supabase/schema.sql).
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY, USERNAME_EMAIL_DOMAIN } from './config.js';

const configured = /^https?:\/\//.test(SUPABASE_URL) && !/^PASTE/.test(SUPABASE_ANON_KEY);
const sb = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

// ---------------------------------------------------------------- icons
const ICONS = {
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  note: '<path d="M4 6h16M4 12h16M4 18h10"/>'
};
const icon = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

// ---------------------------------------------------------------- helpers
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HOUR = 3600000;
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD_CAPS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLORS = ['tangerine', 'blush', 'olive', 'cobalt', 'sun', 'slate'];

const sod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
const startOfWeek = (d) => addDays(sod(d), -((d.getDay() + 6) % 7));
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const timeKey = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const combine = (dateK, timeK) => { const d = fromKey(dateK); const [h, m] = (timeK || '00:00').split(':').map(Number); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m); };
const fmtDate = (d) => `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''}`;
const ampm = (d) => (d.getHours() < 12 ? 'am' : 'pm');
const clock = (d) => `${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`;
const fmtTime = (d) => `${clock(d)} ${ampm(d)}`;
const fmtRange = (s, e, allDay) => {
  if (allDay) return 'All day';
  if (!sameDay(s, e)) return `${fmtTime(s)} – ${fmtDate(e)} ${fmtTime(e)}`;
  return ampm(s) === ampm(e) ? `${clock(s)} – ${clock(e)} ${ampm(e)}` : `${fmtTime(s)} – ${fmtTime(e)}`;
};
const hourLabel = (h) => (h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`);
const initial = (name) => esc((name || '?').trim().charAt(0).toUpperCase());
const listNames = (arr) => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]);
const store = {
  get(k, d) { try { const v = localStorage.getItem('huddle.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('huddle.' + k, JSON.stringify(v)); } catch { /* private mode */ } }
};
const REPEAT_LABEL = { none: 'Never', weekly: 'Every week', monthly: 'Every month', yearly: 'Every year' };
const ALERTS = {
  reminder: [[-540, 'On the day, 9:00 am'], [900, '1 day before, 9:00 am'], [9540, '1 week before, 9:00 am'], [42660, '1 month before, 9:00 am']],
  event: [[0, 'At the start time'], [10, '10 minutes before'], [60, '1 hour before'], [1440, '1 day before']]
};
const alertLabel = (m) => [...ALERTS.reminder, ...ALERTS.event].find((a) => a[0] === m)?.[1] || `${m} minutes before`;
const REMINDER_TYPES = [['birthday', 'Birthday'], ['anniversary', 'Anniversary'], ['bill', 'Bill due'], ['other', 'Other']];

// Every time a (possibly repeating) item happens between `from` and `to`.
function occurrences(item, from, to) {
  const s0 = new Date(item.starts_at), e0 = new Date(item.ends_at), dur = e0 - s0;
  const out = [];
  if (!item.repeat || item.repeat === 'none') {
    if (s0 < to && e0 > from) out.push({ start: s0, end: e0 });
    return out;
  }
  let i = 0;
  if (item.repeat === 'weekly') i = Math.max(0, Math.floor((from - s0 - dur) / (7 * 24 * HOUR)));
  if (item.repeat === 'monthly') i = Math.max(0, (from.getFullYear() - s0.getFullYear()) * 12 + from.getMonth() - s0.getMonth() - 1);
  if (item.repeat === 'yearly') i = Math.max(0, from.getFullYear() - s0.getFullYear() - 1);
  for (let guard = 0; guard < 600; guard++, i++) {
    let s;
    if (item.repeat === 'weekly') s = addDays(s0, 7 * i);
    else if (item.repeat === 'monthly') s = new Date(s0.getFullYear(), s0.getMonth() + i, s0.getDate(), s0.getHours(), s0.getMinutes());
    else s = new Date(s0.getFullYear() + i, s0.getMonth(), s0.getDate(), s0.getHours(), s0.getMinutes());
    if (s >= to) break;
    if (item.repeat !== 'weekly' && s.getDate() !== s0.getDate()) continue; // e.g. 31st in a short month
    const e = new Date(s.getTime() + dur);
    if (e > from) out.push({ start: s, end: e });
  }
  return out;
}

// ---------------------------------------------------------------- state
const today = () => sod(new Date());
const S = {
  session: null, me: null, ready: false,
  tab: 'calendar', view: store.get('view', 'day'), date: today(),
  groups: [], groupsById: {},
  events: [], eventsKey: null,
  enabled: new Set(store.get('enabled', ['me'])),
  invites: { received: [], sent: [] },
  find: { groupId: null, weekStart: startOfWeek(new Date()), window: store.get('findWindow', 'evening'), dur: 2, busy: null, sel: null },
  authMode: 'create', scrollToNow: true
};
let sheet = null; // the open bottom sheet, if any

// ---------------------------------------------------------------- data
async function loadProfile() {
  const { data, error } = await sb.from('profiles').select('id, username, display_name').eq('id', S.session.user.id).single();
  if (error) throw error;
  S.me = data;
}
async function loadGroups() {
  const { data, error } = await sb.from('groups')
    .select('id, name, color, default_detail, owner_id, created_at, group_members(user_id, profiles!group_members_user_id_fkey(id, username, display_name))')
    .order('created_at');
  if (error) throw error;
  S.groups = (data || []).map((g) => ({
    ...g,
    members: (g.group_members || []).map((m) => m.profiles).filter(Boolean)
      .sort((a, b) => (a.id === S.me.id ? -1 : b.id === S.me.id ? 1 : a.display_name.localeCompare(b.display_name)))
  }));
  S.groupsById = Object.fromEntries(S.groups.map((g) => [g.id, g]));
  for (const id of [...S.enabled]) if (id !== 'me' && !S.groupsById[id]) S.enabled.delete(id);
  if (!S.find.groupId || !S.groupsById[S.find.groupId]) S.find.groupId = S.groups[0]?.id || null;
}
function viewRange() {
  const d = S.date;
  if (S.view === 'year') return [new Date(d.getFullYear(), 0, 1), new Date(d.getFullYear() + 1, 0, 1)];
  if (S.view === 'month') { const s = startOfWeek(new Date(d.getFullYear(), d.getMonth(), 1)); return [s, addDays(s, 42)]; }
  const s = startOfWeek(d); return [s, addDays(s, 7)];
}
async function loadEvents(force = false) {
  const [from, to] = viewRange();
  const key = from.toISOString() + to.toISOString();
  if (!force && key === S.eventsKey) return;
  const { data, error } = await sb.rpc('visible_events', { p_from: from.toISOString(), p_to: to.toISOString() });
  if (error) throw error;
  S.events = data || [];
  S.eventsKey = key;
}
// Your own events with "Remind me" alerts over the next five weeks.
async function loadUpcoming() {
  const now = new Date();
  const { data, error } = await sb.rpc('visible_events', { p_from: addDays(now, -1).toISOString(), p_to: addDays(now, 35).toISOString() });
  if (error) throw error;
  S.upcoming = (data || []).filter((e) => e.is_mine && (e.alerts || []).length);
}
// Alerts whose time has come and whose event hasn't finished yet.
function dueAlerts() {
  const now = new Date(), dismissed = new Set(store.get('dismissed', []));
  const out = [];
  for (const ev of S.upcoming || []) {
    for (const o of occurrences(ev, addDays(now, -1), addDays(now, 35))) {
      if (o.end <= now) continue;
      const fired = ev.alerts.some((m) => o.start.getTime() - m * 60000 <= now.getTime());
      const key = `${ev.id}|${o.start.toISOString()}`;
      if (fired && !dismissed.has(key)) out.push({ ev, start: o.start, key });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}
function alertText(a) {
  const now = new Date(), t = a.ev.title;
  const days = Math.round((sod(a.start) - sod(now)) / (24 * HOUR));
  if (a.ev.all_day) return days === 0 ? `${t} is today` : days === 1 ? `${t} is tomorrow` : `${t} is on ${fmtDate(a.start)}`;
  if (a.start <= now) return `${t} has started`;
  return days === 0 ? `${t} starts at ${fmtTime(a.start)}` : `${t} is on ${fmtDate(a.start)} at ${fmtTime(a.start)}`;
}
async function loadInvites() {
  const me = S.me.id;
  const since = new Date(Date.now() - 24 * HOUR).toISOString();
  const [rec, sent] = await Promise.all([
    sb.from('invites')
      .select('status, event_id, events(id, title, starts_at, ends_at, all_day, location, notes, repeat, group_id, owner_id, profiles!events_owner_id_fkey(display_name), groups!events_group_id_fkey(name, color))')
      .eq('user_id', me),
    sb.from('events')
      .select('id, title, starts_at, ends_at, all_day, group_id, groups!events_group_id_fkey(name, color), invites(status, user_id, profiles!invites_user_id_fkey(display_name))')
      .eq('owner_id', me).not('group_id', 'is', null).gte('ends_at', since).order('starts_at')
  ]);
  if (rec.error) throw rec.error;
  if (sent.error) throw sent.error;
  const received = (rec.data || []).filter((r) => r.events && new Date(r.events.ends_at) > new Date(since))
    .sort((a, b) => (b.status === 'pending') - (a.status === 'pending') || new Date(a.events.starts_at) - new Date(b.events.starts_at));
  // Check each invite against your own calendar.
  if (received.length) {
    const from = new Date(Math.min(...received.map((r) => new Date(r.events.starts_at))));
    const to = new Date(Math.max(...received.map((r) => new Date(r.events.ends_at))));
    const { data: mine } = await sb.rpc('visible_events', { p_from: from.toISOString(), p_to: to.toISOString() });
    for (const r of received) {
      const s = new Date(r.events.starts_at), e = new Date(r.events.ends_at);
      const clash = (mine || []).find((ev) => ev.id !== r.event_id && ev.kind === 'event' && (ev.is_mine || ev.my_status === 'going')
        && occurrences(ev, s, e).length);
      r.clash = clash ? clash.title || 'something else' : null;
    }
  }
  S.invites = { received, sent: sent.data || [] };
}
async function loadFind() {
  const g = S.find.groupId;
  if (!g) { S.find.busy = null; return; }
  const from = S.find.weekStart, to = addDays(from, 7);
  const { data, error } = await sb.rpc('group_busy', { p_group: g, p_from: from.toISOString(), p_to: to.toISOString() });
  if (error) throw error;
  const busy = {};
  for (const row of data || []) {
    (busy[row.user_id] ||= []).push(...occurrences(row, from, to));
  }
  S.find.busy = { key: g + from.toISOString(), byUser: busy };
}
async function bootstrap() {
  try {
    await loadProfile();
    await loadGroups();
    await Promise.all([loadEvents(true), loadInvites(), loadUpcoming()]);
    S.ready = true; S.loadError = null;
  } catch (e) {
    S.loadError = niceError(e);
  }
  render();
}
async function refresh(what = ['events']) {
  try {
    const jobs = [];
    if (what.includes('groups')) await loadGroups();
    if (what.includes('events')) jobs.push(loadEvents(true), loadUpcoming());
    if (what.includes('invites')) jobs.push(loadInvites());
    if (what.includes('find')) jobs.push(loadFind());
    await Promise.all(jobs);
  } catch (e) { showToast(niceError(e), true); }
  render();
}
function niceError(e) {
  const m = (e && (e.message || e.error_description)) || String(e);
  if (/Invalid login credentials/i.test(m)) return "That username and password don't match.";
  if (/already registered|already exists/i.test(m)) return 'That username is taken. Try another.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Can't reach Huddle's server. Check your connection.";
  if (/email.*invalid|invalid.*email/i.test(m)) return "Supabase didn't accept that email address. Check it and try again.";
  return m;
}

// ---------------------------------------------------------------- how an event looks
const groupColor = (id) => S.groupsById[id]?.color || 'blush';
function look(ev) {
  const busy = ev.busy_only;
  let color = 'tangerine';
  if (busy) color = 'slate';
  else if (ev.kind === 'reminder') color = 'sun';
  else if (ev.is_mine) color = ev.group_id ? groupColor(ev.group_id) : 'tangerine';
  else if (ev.my_status) color = ev.group_id ? groupColor(ev.group_id) : 'blush';
  else color = groupColor((ev.share_group_ids || []).find((g) => S.enabled.has(g)) || ev.share_group_ids?.[0]);
  const title = busy ? `${ev.owner_name} · busy` : ev.title;
  const pending = !ev.is_mine && ev.my_status === 'pending';
  return { color, title, busy, pending };
}
function shareText(ev) {
  if (ev.is_private || !(ev.share_group_ids || []).length) return { icon: 'lock', text: 'Private' };
  const names = ev.share_group_ids.map((g) => S.groupsById[g]?.name).filter(Boolean);
  return ev.detail === 'full' || ev.kind === 'reminder'
    ? { icon: 'eye', text: `${listNames(names)} see${names.length === 1 ? 's' : ''} details` }
    : { icon: 'eyeOff', text: `${listNames(names)} see${names.length === 1 ? 's' : ''} busy only` };
}
function onCalendar(ev) {
  if (ev.is_mine) return S.enabled.has('me');
  if (ev.my_status && ev.my_status !== 'declined') return S.enabled.has('me');
  return (ev.share_group_ids || []).some((g) => S.enabled.has(g));
}
function occsBetween(from, to) {
  const out = [];
  for (const ev of S.events) {
    if (!onCalendar(ev)) continue;
    for (const o of occurrences(ev, from, to)) out.push({ ev, start: o.start, end: o.end });
  }
  return out.sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------- rendering
const $app = document.getElementById('app');
const $sheet = document.getElementById('sheet-root');
const $toast = document.getElementById('toast-root');

function render() {
  const wrap = $app.querySelector('.timeline-wrap');
  const keep = wrap ? wrap.scrollTop : null;
  if (!configured) $app.innerHTML = setupScreen();
  else if (!S.session) $app.innerHTML = authScreen();
  else if (!S.ready && S.loadError) $app.innerHTML = `<div class="setup"><div class="wordmark">Huddle</div>
    <h1 class="title">Couldn't load your calendar</h1><p class="muted" style="margin:0">${esc(S.loadError)}</p>
    <button type="button" class="btn btn-primary big" data-action="retry">Try again</button>
    <button type="button" class="btn btn-outline big" data-action="sign-out">Sign out</button></div>`;
  else if (!S.ready) $app.innerHTML = '<div class="loading">Loading your calendar…</div>';
  else $app.innerHTML = mainScreen();
  const w2 = $app.querySelector('.timeline-wrap');
  if (w2) {
    if (S.scrollToNow) {
      const now = new Date();
      const h = (S.view === 'day' && sameDay(S.date, now)) || (S.view === 'week' && startOfWeek(now).getTime() === startOfWeek(S.date).getTime()) ? Math.max(0, now.getHours() - 1) : 7;
      w2.scrollTop = h * 48;
      S.scrollToNow = false;
    } else if (keep != null) w2.scrollTop = keep;
  }
  renderSheet();
}

function setupScreen() {
  return `<div class="setup">
    <div class="wordmark">Huddle</div>
    <h1 class="title">Almost there</h1>
    <p>Huddle isn't connected to your Supabase project yet. Open <code>config.js</code> and paste in your
    <b>Project URL</b> and <b>anon public key</b> from Supabase › Project Settings › API, then reload this page.</p>
    <p class="muted">The README has the full step-by-step.</p>
  </div>`;
}

function authScreen() {
  const create = S.authMode === 'create';
  return `<main class="screen no-tabs" style="gap:24px">
    <div class="top"><div class="wordmark">Huddle</div>
      <div class="row" aria-hidden="true" style="gap:0">
        <span class="avatar c-blush" style="background:var(--evt-blush-soft);border:3px solid var(--surface)">M</span>
        <span class="avatar" style="background:var(--evt-olive-soft);border:3px solid var(--surface);margin-left:-14px">P</span>
        <span class="avatar" style="background:var(--evt-cobalt-soft);border:3px solid var(--surface);margin-left:-14px">T</span>
        <span class="avatar" style="background:var(--brand);color:var(--on-brand);margin-left:-12px;font-family:var(--display);font-size:20px">${new Date().getDate()}</span>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <h1 class="display">Your week, together</h1>
      <p class="muted" style="margin:0">Keep your own calendar, share only what you want with each group, and find a time that works for everyone.</p>
    </div>
    <div class="seg" role="group" aria-label="Account">
      <button type="button" data-action="auth-mode" data-mode="create" aria-pressed="${create}">Create account</button>
      <button type="button" data-action="auth-mode" data-mode="signin" aria-pressed="${!create}">Sign in</button>
    </div>
    <form data-form="auth" style="display:flex;flex-direction:column;gap:16px" novalidate>
      ${create ? `<div class="field"><label class="label" for="a-name">Your name</label>
        <input class="input" id="a-name" name="name" autocomplete="name" required maxlength="40" placeholder="Your name"></div>` : ''}
      ${create ? `<div class="field"><label class="label" for="a-email">Email</label>
        <input class="input" id="a-email" name="email" type="email" autocomplete="email" autocapitalize="none" autocorrect="off" spellcheck="false" required placeholder="you@example.com"></div>
      <div class="field"><label class="label" for="a-user">Username</label>
        <input class="input" id="a-user" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required placeholder="yourname"></div>
      <p class="note" style="margin:-8px 0 0">3–24 characters: letters, numbers, dots or underscores. Friends add you by this name. You can sign in with it or your email.</p>`
      : `<div class="field"><label class="label" for="a-login">Username or email</label>
        <input class="input" id="a-login" name="login" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required placeholder="yourname or you@example.com"></div>`}
      <div class="field"><label class="label" for="a-pw">Password</label>
        <input class="input" id="a-pw" name="password" type="password" autocomplete="${create ? 'new-password' : 'current-password'}" required minlength="8" placeholder="At least 8 characters"></div>
      <button class="btn btn-primary big" type="submit">${create ? 'Create account' : 'Sign in'} ${icon('arrow')}</button>
    </form>
    <p class="note" style="justify-content:center">${icon('lock', 'sm')} Everything is private until you share it.</p>
  </main>`;
}

function tabbar() {
  const pending = S.invites.received.filter((r) => r.status === 'pending').length;
  const tab = (id, ic, label, extra = '') =>
    `<button type="button" data-action="tab" data-tab="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>${icon(ic)}${label}${extra}</button>`;
  return `<nav class="tabbar" aria-label="Main">
    ${tab('calendar', 'calendar', 'Calendar')}
    ${tab('groups', 'users', 'Groups')}
    ${tab('find', 'clock', 'Find a time')}
    ${tab('invites', 'inbox', 'Invites', pending ? `<span class="badge" aria-label="${pending} new">${pending}</span>` : '')}
  </nav>`;
}

function mainScreen() {
  let body = '';
  if (S.tab === 'calendar') body = calendarScreen();
  else if (S.tab === 'groups') body = groupsScreen();
  else if (S.tab === 'find') body = findScreen();
  else body = invitesScreen();
  const fab = S.tab === 'calendar'
    ? `<button type="button" class="fab" data-action="new-event" aria-label="New event or reminder">${icon('plus')}</button>` : '';
  return body + fab + tabbar();
}

// ---------- calendar
function calendarScreen() {
  const d = S.date, t = today();
  let title, sub;
  if (S.view === 'day') { title = `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; sub = `${MONTH[d.getMonth()]} ${d.getFullYear()}`; }
  else if (S.view === 'week') { const s = startOfWeek(d), e = addDays(s, 6); title = `${MONTH[s.getMonth()]} ${s.getFullYear()}`; sub = `${s.getDate()} ${s.getMonth() !== e.getMonth() ? MON[s.getMonth()] + ' ' : ''}– ${e.getDate()} ${MON[e.getMonth()]}`; }
  else if (S.view === 'month') { title = `${MONTH[d.getMonth()]} ${d.getFullYear()}`; sub = 'Month'; }
  else { title = String(d.getFullYear()); sub = 'Year'; }
  const viewBtn = (v, l) => `<button type="button" data-action="view" data-view="${v}" aria-pressed="${S.view === v}">${l}</button>`;
  const showingToday = S.view === 'day' ? sameDay(d, t) : S.view === 'week' ? startOfWeek(d).getTime() === startOfWeek(t).getTime()
    : S.view === 'month' ? d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear() : d.getFullYear() === t.getFullYear();
  const pill = (id, name, color) => `<button type="button" class="pill c-${color}" data-action="toggle-cal" data-cal="${esc(id)}" aria-pressed="${S.enabled.has(id)}"><span class="dot"></span>${esc(name)}</button>`;
  let view = '';
  if (S.view === 'day') view = dayView();
  else if (S.view === 'week') view = weekView();
  else if (S.view === 'month') view = monthView();
  else view = yearView();
  return `<main class="screen">
    <header class="top">
      <div class="stack"><span class="label muted">${esc(sub)}</span><h1 class="title">${esc(title)}</h1></div>
      <div class="row">
        <button type="button" class="icon-btn" data-action="prev" aria-label="Previous">${icon('chevL')}</button>
        <button type="button" class="icon-btn" data-action="next" aria-label="Next">${icon('chevR')}</button>
        <button type="button" class="avatar" data-action="me" aria-label="Your account, ${esc(S.me.display_name)}">${initial(S.me.display_name)}</button>
      </div>
    </header>
    <nav class="seg" aria-label="Calendar view">${viewBtn('day', 'Day')}${viewBtn('week', 'Week')}${viewBtn('month', 'Month')}${viewBtn('year', 'Year')}</nav>
    <div class="scroll-x" role="group" aria-label="Calendars to show">
      ${showingToday ? '' : '<button type="button" class="pill" data-action="today">Today</button>'}
      ${pill('me', 'My calendar', 'tangerine')}
      ${S.groups.map((g) => pill(g.id, g.name, g.color)).join('')}
    </div>
    ${dueAlerts().slice(0, 3).map((a) => `<div class="card c-${a.ev.kind === 'reminder' ? 'sun' : 'tangerine'}" role="status" style="flex-direction:row;align-items:center;gap:12px;padding:10px 8px 10px 12px;box-shadow:var(--shadow)">
      <span class="avatar small" style="background:var(--evt-soft)" aria-hidden="true">${icon('bell', 'sm')}</span>
      <button type="button" class="grow" data-action="open-event" data-id="${a.ev.id}" data-start="${a.start.toISOString()}" style="border:0;background:transparent;text-align:left;padding:0;font-weight:600">${esc(alertText(a))}</button>
      <button type="button" class="icon-btn plain" data-action="dismiss-alert" data-key="${esc(a.key)}" aria-label="Dismiss">${icon('x')}</button></div>`).join('')}
    ${view}
  </main>`;
}

function blockHtml(o, compact) {
  const L = look(o.ev);
  let sub;
  if (L.busy) sub = esc(fmtRange(o.start, o.end));
  else if (L.pending) sub = `${icon('inbox', 'sm')} Invite · ${esc(o.ev.owner_name)}`;
  else if (o.ev.is_mine) { const st = shareText(o.ev); sub = `${icon(st.icon, 'sm')} ${esc(st.text)}`; }
  else sub = esc(o.ev.owner_name);
  return { L, sub };
}
function timedColumn(day, occs, compact) {
  const ds = sod(day), de = addDays(ds, 1);
  const items = occs.filter((o) => !o.ev.all_day && o.start < de && o.end > ds)
    .map((o) => ({ o, s: Math.max(o.start, ds), e: Math.min(o.end, de) }))
    .sort((a, b) => a.s - b.s || b.e - a.e);
  let cluster = null, clusterEnd = 0;
  const clusters = [];
  for (const it of items) {
    if (!cluster || it.s >= clusterEnd) { cluster = { items: [], lanes: [] }; clusters.push(cluster); clusterEnd = 0; }
    let lane = cluster.lanes.findIndex((end) => end <= it.s);
    if (lane < 0) { lane = cluster.lanes.length; cluster.lanes.push(it.e); } else cluster.lanes[lane] = it.e;
    it.lane = lane; cluster.items.push(it); clusterEnd = Math.max(clusterEnd, it.e);
  }
  clusters.forEach((c) => c.items.forEach((it) => { it.n = c.lanes.length; }));
  const blocks = items.map((it) => {
    const top = ((it.s - ds) / HOUR) * 48;
    const h = Math.max(compact ? 20 : 24, ((it.e - it.s) / HOUR) * 48 - 2);
    const w = 100 / it.n, l = it.lane * w;
    const { L, sub } = blockHtml(it.o, compact);
    return `<button type="button" class="blk c-${L.color}${L.busy ? ' busy' : ''}${L.pending ? ' pending' : ''}"
      style="top:${top}px;height:${h}px;left:calc(${l}% + 1px);width:calc(${w}% - 3px)"
      data-action="open-event" data-id="${it.o.ev.id}" data-start="${it.o.start.toISOString()}"${it.o.ev.is_mine ? ' data-drag="1"' : ''}
      aria-label="${esc(L.title)}, ${esc(fmtRange(it.o.start, it.o.end))}">
      <span class="t">${esc(L.title)}</span>${!compact && h >= 38 ? `<span class="s">${sub}</span>` : ''}${!compact && h >= 56 ? `<span class="s">${esc(fmtRange(it.o.start, it.o.end))}</span>` : ''}
    </button>`;
  }).join('');
  const now = new Date();
  const nowLine = sameDay(day, now) ? `<div class="now-line" style="top:${((now - ds) / HOUR) * 48}px" aria-label="Now, ${fmtTime(now)}"></div>` : '';
  return `<div class="col${compact && sameDay(day, now) ? ' today' : ''}" data-col="${dayKey(day)}">${blocks}${nowLine}</div>`;
}
function chipHtml(o, compact) {
  const L = look(o.ev);
  return `<button type="button" class="chip c-${L.color}${L.busy ? ' busy' : ''}${L.pending ? ' pending' : ''}" data-action="open-event" data-id="${o.ev.id}" data-start="${o.start.toISOString()}"${o.ev.is_mine ? ' data-drag="1"' : ''}>
    ${compact ? '' : icon(o.ev.kind === 'reminder' ? 'bell' : 'calendar', 'sm')}<span class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(L.title)}</span>${compact ? '' : `<span class="s">${o.ev.all_day ? 'All day' : esc(fmtTime(o.start))}</span>`}
  </button>`;
}
const hoursCol = () => `<div class="hours">${Array.from({ length: 24 }, (_, h) => `<span>${h ? hourLabel(h) : ''}</span>`).join('')}</div>`;

function dayView() {
  const d = S.date, ws = startOfWeek(d);
  const strip = Array.from({ length: 7 }, (_, i) => {
    const x = addDays(ws, i);
    return `<button type="button" class="${sameDay(x, new Date()) ? 'today' : ''}" data-action="pick-day" data-date="${dayKey(x)}" aria-pressed="${sameDay(x, d)}" aria-label="${fmtDate(x)}">
      <span class="caption muted">${WD_CAPS[i]}</span><span class="n">${x.getDate()}</span></button>`;
  }).join('');
  const occs = occsBetween(sod(d), addDays(sod(d), 1));
  const allDay = occs.filter((o) => o.ev.all_day);
  const timed = occs.filter((o) => !o.ev.all_day);
  return `<div class="week-strip">${strip}</div>
    ${allDay.length ? `<div class="allday">${allDay.map((o) => chipHtml(o)).join('')}</div>` : ''}
    ${!occs.length ? '<p class="note" style="margin:0">Nothing planned. Tap + to add an event or a reminder.</p>' : ''}
    <div class="timeline-wrap"><div class="timeline">${hoursCol()}<div class="cols" style="--days:1">${timedColumn(d, timed, false)}</div></div></div>`;
}

function weekView() {
  const ws = startOfWeek(S.date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const occs = occsBetween(ws, addDays(ws, 7));
  const head = days.map((x, i) => `<button type="button" class="${sameDay(x, new Date()) ? 'today' : ''}" data-action="pick-day" data-date="${dayKey(x)}" data-go="day" aria-label="${fmtDate(x)}">
    <span class="caption muted">${WD_CAPS[i]}</span><span class="n">${x.getDate()}</span></button>`).join('');
  const allDayCells = days.map((x) => {
    const list = occs.filter((o) => o.ev.all_day && o.start < addDays(x, 1) && o.end > x);
    return `<div style="display:flex;flex-direction:column;gap:2px">${list.map((o) => chipHtml(o, true)).join('')}</div>`;
  }).join('');
  const hasAllDay = occs.some((o) => o.ev.all_day);
  return `<div class="week-head"><span></span>${head}</div>
    ${hasAllDay ? `<div class="allday-week"><span class="caption muted" style="align-self:center">ALL DAY</span>${allDayCells}</div>` : ''}
    <div class="timeline-wrap"><div class="timeline">${hoursCol()}<div class="cols multi" style="--days:7">${days.map((x) => timedColumn(x, occs, true)).join('')}</div></div></div>`;
}

function monthView() {
  const d = S.date, first = new Date(d.getFullYear(), d.getMonth(), 1);
  const gs = startOfWeek(first);
  const daysIn = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((((first.getDay() + 6) % 7) + daysIn) / 7) * 7;
  const occs = occsBetween(gs, addDays(gs, cells));
  const byDay = {};
  for (const o of occs) {
    for (let x = sod(o.start); x < o.end; x = addDays(x, 1)) (byDay[dayKey(x)] ||= []).push(o);
  }
  const grid = Array.from({ length: cells }, (_, i) => {
    const x = addDays(gs, i), k = dayKey(x), list = byDay[k] || [];
    const colors = [...new Set(list.map((o) => look(o.ev).color))].slice(0, 4);
    return `<button type="button" class="mcell${x.getMonth() !== d.getMonth() ? ' out' : ''}${sameDay(x, new Date()) ? ' today' : ''}" data-action="pick-day" data-date="${k}" aria-pressed="${sameDay(x, d)}" aria-label="${fmtDate(x)}${list.length ? `, ${list.length} item${list.length > 1 ? 's' : ''}` : ''}">
      <span class="n">${x.getDate()}</span><span class="mdots" aria-hidden="true">${colors.map((c) => `<i class="c-${c}"></i>`).join('')}</span></button>`;
  }).join('');
  const agenda = (byDay[dayKey(d)] || []).sort((a, b) => a.ev.all_day === b.ev.all_day ? a.start - b.start : a.ev.all_day ? -1 : 1);
  return `<div class="month-grid">${WD_CAPS.map((w) => `<span class="wd caption">${w}</span>`).join('')}${grid}</div>
    <section style="display:flex;flex-direction:column;gap:8px;margin-top:4px" aria-label="${fmtDate(d)}">
      <h2 class="h2">${sameDay(d, new Date()) ? 'Today · ' : ''}${fmtDate(d)}</h2>
      ${agenda.length ? agenda.map((o) => chipHtml(o)).join('') : '<p class="note" style="margin:0">Nothing planned.</p>'}
    </section>`;
}

function yearView() {
  const y = S.date.getFullYear();
  const occs = occsBetween(new Date(y, 0, 1), new Date(y + 1, 0, 1));
  const has = new Set();
  for (const o of occs) for (let x = sod(o.start); x < o.end; x = addDays(x, 1)) has.add(dayKey(x));
  const now = new Date();
  const months = MON.map((name, m) => {
    const lead = (new Date(y, m, 1).getDay() + 6) % 7;
    const len = new Date(y, m + 1, 0).getDate();
    let cells = '<span></span>'.repeat(lead);
    for (let day = 1; day <= len; day++) {
      const x = new Date(y, m, day);
      cells += `<span class="${sameDay(x, now) ? 'today' : has.has(dayKey(x)) ? 'has' : ''}">${day}</span>`;
    }
    return `<button type="button" class="ymonth${y === now.getFullYear() && m === now.getMonth() ? ' current' : ''}" data-action="pick-month" data-month="${m}" aria-label="${MONTH[m]} ${y}">
      <span class="name">${name}</span><span class="ydays" aria-hidden="true">${cells}</span></button>`;
  }).join('');
  return `<div class="year-grid">${months}</div><p class="note" style="margin:0">Bold days have something planned.</p>`;
}

// ---------- groups
function groupsScreen() {
  const rows = S.groups.map((g) => `
    <button type="button" class="card c-${g.color}" data-action="open-group" data-id="${g.id}" style="flex-direction:row;align-items:center;gap:12px;border:0;border-radius:999px;padding:8px 16px 8px 8px;text-align:left">
      <span class="avatar" style="background:var(--evt-soft)" aria-hidden="true"><span class="dot" style="width:12px;height:12px"></span></span>
      <span class="grow" style="display:flex;flex-direction:column"><span style="font-weight:600">${esc(g.name)}</span>
        <span class="label muted">${g.members.length} ${g.members.length === 1 ? 'person' : 'people'}${g.owner_id === S.me.id ? ' · you manage this' : ''}</span></span>
      ${icon('chevR')}
    </button>`).join('');
  return `<main class="screen">
    <header class="top"><h1 class="title">Groups</h1>
      <button type="button" class="btn btn-primary sm" data-action="new-group">${icon('plus')} New group</button></header>
    ${rows || `<div class="card empty"><p style="margin:0">No groups yet.</p><p class="label" style="margin:0">Make one for your office, your friends or your family, then add people by their username.</p></div>`}
    <p class="note">${icon('lock', 'sm')} Groups only see events you choose to share with them.</p>
  </main>`;
}

// ---------- find a time
const WINDOWS = { morning: [8, 12, 'Morning'], afternoon: [12, 17, 'Afternoon'], evening: [17, 22, 'Evening'], day: [8, 22, 'All day'] };
function findScreen() {
  if (!S.groups.length) {
    return `<main class="screen"><h1 class="title">Find a time</h1>
      <div class="card empty"><p style="margin:0">Make a group first.</p><p class="label" style="margin:0">Then you'll see when everyone in it is free.</p>
      <button type="button" class="btn btn-primary" data-action="tab" data-tab="groups" style="align-self:center;margin-top:8px">Go to groups</button></div></main>`;
  }
  const F = S.find, g = S.groupsById[F.groupId];
  const key = F.groupId + F.weekStart.toISOString();
  if ((!F.busy || F.busy.key !== key) && F.loadingKey !== key) {
    F.loadingKey = key;
    loadFind().then(render).catch((e) => showToast(niceError(e), true)).finally(() => { F.loadingKey = null; });
  }
  const members = g.members;
  const ws = F.weekStart, we = addDays(ws, 6);
  const [h0, h1] = WINDOWS[F.window];
  const byUser = F.busy && F.busy.key === key ? F.busy.byUser : null;
  const freeCount = (s, e) => members.filter((m) => !(byUser?.[m.id] || []).some((iv) => iv.start < e && iv.end > s)).length;
  const now = new Date();
  let rows = '';
  for (let h = h0; h < h1; h++) {
    rows += `<span class="hl">${hourLabel(h)}</span>`;
    for (let i = 0; i < 7; i++) {
      const s = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i, h), e = new Date(s.getTime() + HOUR);
      if (!byUser) { rows += '<span class="slot" aria-hidden="true">…</span>'; continue; }
      const n = freeCount(s, e), all = n === members.length;
      const sel = F.sel && F.sel.getTime() === s.getTime();
      rows += `<button type="button" class="slot${all ? ' all' : n === 0 ? ' none' : ''}${s < now ? ' past' : ''}" data-action="pick-slot" data-t="${s.toISOString()}" aria-pressed="${!!sel}"
        aria-label="${fmtDate(s)} ${hourLabel(h)}: ${n} of ${members.length} free">${all ? icon('check', 'sm') : `${n}/${members.length}`}</button>`;
    }
  }
  // Best times: everyone free for the whole length.
  const best = [];
  if (byUser) {
    for (let i = 0; i < 7 && best.length < 3; i++) {
      for (let h = h0; h + F.dur <= h1 && best.length < 3; h++) {
        const s = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i, h), e = new Date(s.getTime() + F.dur * HOUR);
        if (s < now) continue;
        if (freeCount(s, e) === members.length) { best.push(s); h += F.dur - 1; }
      }
    }
  }
  const sel = F.sel;
  const selEnd = sel ? new Date(sel.getTime() + F.dur * HOUR) : null;
  const selFree = sel && byUser ? freeCount(sel, selEnd) : null;
  const names = members.map((m) => (m.id === S.me.id ? 'You' : m.display_name));
  return `<main class="screen">
    <header class="top"><div class="stack"><h1 class="title">Find a time</h1><span class="label muted">Everyone's calendars, overlaid</span></div></header>
    <div class="scroll-x" role="group" aria-label="Group">${S.groups.map((x) => `<button type="button" class="pill c-${x.color}" data-action="find-group" data-id="${x.id}" aria-pressed="${x.id === F.groupId}"><span class="dot"></span>${esc(x.name)}</button>`).join('')}</div>
    <div class="row">
      <div class="row" aria-hidden="true" style="gap:0">${members.slice(0, 5).map((m, i) => `<span class="avatar small" style="border:2px solid var(--surface);${i ? 'margin-left:-8px' : ''}">${initial(m.display_name)}</span>`).join('')}</div>
      <span class="label muted grow">${esc(listNames(names))} · only free and busy times are shown</span>
    </div>
    <div class="row">
      <button type="button" class="icon-btn" data-action="find-week" data-dir="-1" aria-label="Previous week">${icon('chevL')}</button>
      <span class="grow" style="text-align:center;font-weight:600">${ws.getDate()} ${MON[ws.getMonth()]} – ${we.getDate()} ${MON[we.getMonth()]}</span>
      <button type="button" class="icon-btn" data-action="find-week" data-dir="1" aria-label="Next week">${icon('chevR')}</button>
    </div>
    <div class="seg" role="group" aria-label="Time of day">${Object.entries(WINDOWS).map(([k, v]) => `<button type="button" data-action="find-window" data-w="${k}" aria-pressed="${F.window === k}">${v[2]}</button>`).join('')}</div>
    <div class="seg" role="group" aria-label="How long">${[1, 2, 3].map((n) => `<button type="button" data-action="find-dur" data-n="${n}" aria-pressed="${F.dur === n}">${n} hr</button>`).join('')}</div>
    <section class="heat" aria-label="How many people are free">
      <span></span>${Array.from({ length: 7 }, (_, i) => { const x = addDays(ws, i); return `<span class="hd"><span class="caption muted">${WD_CAPS[i]}</span><span style="font-weight:600">${x.getDate()}</span></span>`; }).join('')}
      ${rows}
    </section>
    <div class="row label muted" style="gap:16px;padding-left:44px">
      <span class="row" style="gap:4px"><span style="width:12px;height:12px;border-radius:4px;background:var(--evt-olive-soft)"></span>Everyone free</span>
      <span>2/${members.length} = people free</span>
    </div>
    <section style="display:flex;flex-direction:column;gap:8px">
      <h2 class="h2">Best times for ${F.dur} hour${F.dur > 1 ? 's' : ''}</h2>
      ${!byUser ? '<p class="note" style="margin:0">Checking calendars…</p>'
        : best.length ? best.map((s) => `<button type="button" class="card" data-action="pick-slot" data-t="${s.toISOString()}" style="flex-direction:row;align-items:center;border:0;border-radius:999px;padding:14px 16px;text-align:left">
          <span class="grow" style="font-weight:600">${fmtDate(s)} · ${esc(fmtRange(s, new Date(s.getTime() + F.dur * HOUR)))}</span><span class="label ok">Everyone free</span></button>`).join('')
        : '<p class="note" style="margin:0">No time this week when everyone is free. Try another week or time of day.</p>'}
    </section>
    <button type="button" class="btn btn-primary big" data-action="plan-group" ${sel ? '' : 'disabled'} style="height:auto;min-height:56px;flex-direction:column;gap:0;padding:8px 16px">
      <span>Plan a group event</span>
      <span class="label">${sel ? `${fmtDate(sel)} · ${esc(fmtRange(sel, selEnd))} · ${selFree === members.length ? 'everyone free' : `${selFree} of ${members.length} free`}` : 'Pick a time above'}</span>
    </button>
  </main>`;
}

// ---------- invites
function invitesScreen() {
  const { received, sent } = S.invites;
  const card = (r) => {
    const ev = r.events, s = new Date(ev.starts_at), e = new Date(ev.ends_at), gr = ev.groups;
    const host = ev.profiles?.display_name || 'Someone';
    const actions = r.status === 'pending'
      ? `<div class="row" style="margin-top:8px">
          <button type="button" class="btn btn-accent grow" data-action="reply" data-id="${ev.id}" data-status="going">Accept invite</button>
          <button type="button" class="btn btn-outline" data-action="reply" data-id="${ev.id}" data-status="declined">Decline</button></div>`
      : `<div class="row" role="status" style="margin-top:8px;min-height:44px">
          <span class="status ${r.status === 'going' ? 'going' : 'declined'}">${r.status === 'going' ? 'Going' : 'Declined'}</span>
          <span class="grow label muted">${r.status === 'going' ? 'On your calendar' : `${esc(host)} has been told`}</span>
          <button type="button" class="btn btn-text sm" data-action="reply" data-id="${ev.id}" data-status="${r.status === 'going' ? 'declined' : 'going'}">${r.status === 'going' ? "Can't go" : 'I can go'}</button></div>`;
    return `<article class="card">
      <div class="row"><span class="avatar small" aria-hidden="true">${initial(host)}</span><span class="grow label muted">${esc(host)} invited you</span>
        ${gr ? `<span class="pill c-${gr.color}" style="height:28px;padding:0 10px;border:0;background:var(--evt-soft)"><span class="dot"></span>${esc(gr.name)}</span>` : ''}</div>
      <h2 class="h-event">${esc(ev.title)}</h2>
      <span>${fmtDate(s)} · ${esc(fmtRange(s, e, ev.all_day))}</span>
      ${ev.location ? `<span class="row label muted">${icon('pin', 'sm')} ${esc(ev.location)}</span>` : ''}
      ${r.clash ? `<span class="row label warn">${icon('alert', 'sm')} Clashes with ${esc(r.clash)}</span>` : `<span class="row label ok">${icon('check', 'sm')} You're free then</span>`}
      ${actions}
    </article>`;
  };
  const sentRow = (ev) => {
    const inv = ev.invites || [], going = inv.filter((i) => i.status === 'going').length, s = new Date(ev.starts_at);
    return `<button type="button" class="card" data-action="open-event" data-id="${ev.id}" data-start="${ev.starts_at}" style="flex-direction:row;align-items:center;border:0;border-radius:999px;padding:10px 10px 10px 20px;text-align:left">
      <span class="grow" style="display:flex;flex-direction:column"><span style="font-weight:600">${esc(ev.title)}</span>
      <span class="label muted">${fmtDate(s)} · ${going} of ${inv.length} going</span></span>
      <span class="icon-btn" aria-hidden="true">${icon('arrow')}</span></button>`;
  };
  return `<main class="screen">
    <h1 class="title">Invites</h1>
    ${received.length ? received.map(card).join('') : '<div class="card empty"><p style="margin:0">No invites right now.</p><p class="label" style="margin:0">When someone plans a group event with you, it shows up here.</p></div>'}
    <section style="display:flex;flex-direction:column;gap:8px">
      <h2 class="h2">Sent by you</h2>
      ${sent.length ? sent.map(sentRow).join('') : '<p class="note" style="margin:0">Use Find a time to plan something with a group.</p>'}
    </section>
  </main>`;
}

// ---------------------------------------------------------------- sheets
function openSheet(s) { sheet = s; renderSheet(); }
function closeSheet() { sheet = null; renderSheet(); }
function renderSheet() {
  if (!sheet) { $sheet.innerHTML = ''; document.body.style.overflow = ''; return; }
  const keep = $sheet.querySelector('.sheet')?.scrollTop;
  let inner = '';
  if (sheet.type === 'event') inner = eventSheet();
  else if (sheet.type === 'editor') inner = editorSheet();
  else if (sheet.type === 'group') inner = groupSheet();
  else if (sheet.type === 'new-group') inner = newGroupSheet();
  else if (sheet.type === 'me') inner = meSheet();
  const enter = !$sheet.firstElementChild || $sheet.dataset.type !== sheet.type;
  $sheet.dataset.type = sheet.type;
  $sheet.innerHTML = `<div class="sheet-backdrop" data-action="backdrop"><div class="sheet${sheet.type === 'editor' ? ' full' : ''}${enter ? ' enter' : ''}" role="dialog" aria-modal="true" aria-label="${esc(sheet.label || '')}">${inner}</div></div>`;
  document.body.style.overflow = 'hidden';
  const el = $sheet.querySelector('.sheet');
  if (keep) el.scrollTop = keep;
  if (sheet.focus) { el.querySelector(sheet.focus)?.focus(); sheet.focus = null; }
}

// ---------- event detail
async function openEvent(id, startIso) {
  let ev = S.events.find((e) => e.id === id);
  if (!ev) {
    const s = new Date(startIso);
    const { data } = await sb.rpc('visible_events', { p_from: addDays(s, -1).toISOString(), p_to: addDays(s, 2).toISOString() });
    ev = (data || []).find((e) => e.id === id);
  }
  if (!ev) { showToast("Couldn't open that event.", true); return; }
  const start = new Date(startIso);
  openSheet({ type: 'event', label: ev.title || 'Busy', ev, start, guests: null });
  if (ev.is_mine && ev.group_id) {
    const { data } = await sb.from('invites').select('status, profiles!invites_user_id_fkey(display_name)').eq('event_id', id);
    if (sheet && sheet.ev === ev) { sheet.guests = data || []; renderSheet(); }
  }
}
function eventSheet() {
  const { ev, start } = sheet;
  const end = new Date(start.getTime() + (new Date(ev.ends_at) - new Date(ev.starts_at)));
  const L = look(ev);
  const rows = [];
  const lastDay = addDays(sod(end), -1);
  rows.push(ev.all_day && lastDay > start
    ? `<div class="list-row">${icon('clock')}<span class="grow">${fmtDate(start)} – ${fmtDate(lastDay)}<br><span class="label muted">All day</span></span></div>`
    : `<div class="list-row">${icon('clock')}<span class="grow">${fmtDate(start)}<br><span class="label muted">${esc(fmtRange(start, end, ev.all_day))}</span></span></div>`);
  if (ev.repeat && ev.repeat !== 'none') rows.push(`<div class="list-row">${icon('repeat')}<span class="grow">${REPEAT_LABEL[ev.repeat]}</span></div>`);
  if (ev.location) rows.push(`<div class="list-row">${icon('pin')}<span class="grow">${esc(ev.location)}</span></div>`);
  if (ev.notes) rows.push(`<div class="list-row">${icon('note')}<span class="grow" style="white-space:pre-wrap">${esc(ev.notes)}</span></div>`);
  if (ev.is_mine && (ev.alerts || []).length) rows.push(`<div class="list-row">${icon('bell')}<span class="grow">${ev.alerts.map(alertLabel).map(esc).join('<br>')}</span></div>`);
  if (ev.is_mine) { const st = shareText(ev); rows.push(`<div class="list-row">${icon(st.icon)}<span class="grow">${esc(st.text)}</span></div>`); }
  let guests = '';
  if (ev.is_mine && ev.group_id) {
    guests = `<section class="card list" aria-label="Guests"><div class="list-row"><span class="h2 grow">Replies</span></div>
      ${sheet.guests == null ? '<div class="list-row muted">Loading…</div>' : sheet.guests.map((g) => `<div class="list-row"><span class="avatar small" aria-hidden="true">${initial(g.profiles?.display_name)}</span><span class="grow">${esc(g.profiles?.display_name)}</span>
        <span class="status ${g.status === 'going' ? 'going' : g.status === 'declined' ? 'declined' : 'waiting'}">${g.status === 'going' ? 'Going' : g.status === 'declined' ? "Can't go" : 'Waiting'}</span></div>`).join('')}</section>`;
  }
  let actions = '';
  if (ev.is_mine) actions = `<div class="row"><button type="button" class="btn btn-outline grow" data-action="edit-event">Edit</button><button type="button" class="btn btn-danger" data-action="delete-event">Delete</button></div>`;
  else if (ev.my_status) actions = `<div class="row">
      <button type="button" class="btn ${ev.my_status === 'going' ? 'btn-accent' : 'btn-outline'} grow" data-action="reply" data-id="${ev.id}" data-status="going" aria-pressed="${ev.my_status === 'going'}">Going</button>
      <button type="button" class="btn ${ev.my_status === 'declined' ? 'btn-accent' : 'btn-outline'} grow" data-action="reply" data-id="${ev.id}" data-status="declined" aria-pressed="${ev.my_status === 'declined'}">Can't go</button></div>`;
  return `<div class="sheet-grip"></div>
    <div class="row" style="align-items:flex-start">
      <span class="c-${L.color}" style="width:12px;height:12px;border-radius:999px;background:var(--evt);margin-top:8px;flex:none" aria-hidden="true"></span>
      <div class="grow"><h2 class="h-event">${esc(L.busy ? 'Busy' : ev.title)}</h2>
        <span class="label muted">${ev.is_mine ? (ev.kind === 'reminder' ? 'Your reminder' : 'Your calendar') : `${esc(ev.owner_name)}'s calendar${ev.my_status === 'pending' ? ' · invite waiting for your reply' : ''}`}</span></div>
      <button type="button" class="icon-btn plain" data-action="close" aria-label="Close">${icon('x')}</button>
    </div>
    <div class="card list">${rows.join('')}</div>
    ${L.busy ? `<p class="note">${icon('eyeOff', 'sm')} ${esc(ev.owner_name)} only shares when they're busy, not what they're doing.</p>` : ''}
    ${guests}${actions}`;
}

// ---------- editor
function newDraft(over = {}) {
  const base = S.date && !sameDay(S.date, today()) ? new Date(S.date.getFullYear(), S.date.getMonth(), S.date.getDate(), 9) : new Date();
  const start = new Date(base); if (sameDay(base, new Date()) && base.getMinutes()) { start.setHours(start.getHours() + 1, 0, 0, 0); }
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + HOUR);
  return {
    id: null, kind: 'event', reminder_type: 'birthday', title: '', date: dayKey(start), start: timeKey(start), endDate: dayKey(end), end: timeKey(end),
    all_day: false, repeat: 'none', location: '', notes: '', is_private: true, groups: [], detail: 'busy', alerts: [],
    groupEvent: null, invitees: [], ...over
  };
}
function draftFromEvent(ev) {
  const s = new Date(ev.starts_at), e = new Date(ev.ends_at);
  return {
    id: ev.id, kind: ev.kind, reminder_type: ev.reminder_type || 'birthday', title: ev.title || '', date: dayKey(s), start: timeKey(s),
    endDate: dayKey(ev.all_day ? (addDays(sod(e), -1) < s ? s : addDays(sod(e), -1)) : e), end: timeKey(ev.all_day ? addDays(s, 0) : e), all_day: ev.all_day, repeat: ev.repeat, location: ev.location || '', notes: ev.notes || '',
    is_private: ev.is_private, groups: [...(ev.share_group_ids || [])], detail: ev.detail, alerts: [...(ev.alerts || [])],
    groupEvent: ev.group_id || null, invitees: [], originalEnd: ev.ends_at
  };
}
const TIME_FIELDS = ['date', 'start', 'endDate', 'end'];
// The start and end a draft describes (all-day ends are the start of the day after).
function draftRange(d) {
  if (d.kind === 'reminder') { const s = fromKey(d.date); return { s, e: addDays(s, 1) }; }
  if (d.all_day) { const s = fromKey(d.date); return { s, e: addDays(fromKey(d.endDate || d.date), 1) }; }
  return { s: combine(d.date, d.start), e: combine(d.endDate || d.date, d.end) };
}
function editorSheet() {
  const d = sheet.draft, rem = d.kind === 'reminder', grp = d.groupEvent ? S.groupsById[d.groupEvent] : null;
  const heading = d.id ? (rem ? 'Edit reminder' : 'Edit event') : grp ? 'Group event' : rem ? 'New reminder' : 'New event';
  const sw = (on) => `<span class="switch" aria-hidden="true"></span>`;
  const alertOpts = ALERTS[rem || d.all_day ? 'reminder' : 'event'];
  const shareRows = S.groups.map((g) => `
    <button type="button" class="list-row c-${g.color}" data-action="draft-group" data-id="${g.id}" aria-pressed="${d.groups.includes(g.id)}">
      <span class="avatar small" style="background:var(--evt-soft)" aria-hidden="true"><span class="dot"></span></span>
      <span class="grow" style="display:flex;flex-direction:column"><span style="font-weight:600">${esc(g.name)}</span><span class="label muted">${g.members.length} people</span></span>${sw()}</button>`).join('');
  const sharing = !grp ? `
    <section class="card list" aria-label="Who can see this">
      <div class="list-row"><span class="h2 grow">Who can see this</span></div>
      <button type="button" class="list-row" data-action="draft-private" aria-pressed="${d.is_private}">
        <span class="avatar small" aria-hidden="true">${icon('lock', 'sm')}</span>
        <span class="grow" style="display:flex;flex-direction:column"><span style="font-weight:600">Private</span><span class="label muted">Only you see this</span></span>${sw()}</button>
      ${d.is_private ? '' : shareRows || '<div class="list-row label muted">You have no groups yet. Make one in the Groups tab.</div>'}
    </section>
    ${!d.is_private && d.groups.length && !rem ? `
    <section class="card" aria-label="What they see">
      <h2 class="h2">What they see</h2>
      <div class="grid2">
        <button type="button" class="option" data-action="draft-detail" data-v="full" aria-pressed="${d.detail === 'full'}">${icon('eye')}<span style="font-weight:600">Full details</span><span class="label muted">Title, time, place and notes</span></button>
        <button type="button" class="option" data-action="draft-detail" data-v="busy" aria-pressed="${d.detail === 'busy'}">${icon('eyeOff')}<span style="font-weight:600">Busy only</span><span class="label muted">Just that you're not free</span></button>
      </div>
      <div class="chip ${d.detail === 'busy' ? 'busy' : 'c-tangerine'}" style="flex-direction:column;align-items:flex-start;gap:2px;cursor:default">
        <span class="label muted" style="font-weight:500">How ${esc(listNames(d.groups.map((g) => S.groupsById[g]?.name).filter(Boolean)))} see${d.groups.length === 1 ? 's' : ''} it</span>
        <span>${d.detail === 'busy' ? `${esc(S.me.display_name)} is busy` : esc(d.title || 'Your event')}</span>
      </div>
    </section>` : ''}
    ${!d.is_private && d.groups.length && rem ? `<p class="note">${icon('eye', 'sm')} Everyone in ${esc(listNames(d.groups.map((g) => S.groupsById[g]?.name).filter(Boolean)))} will see this reminder on their calendar.</p>` : ''}
    ${!d.is_private && !d.groups.length ? '<p class="note">Pick at least one group, or switch Private back on.</p>' : ''}` : '';
  const others = grp ? grp.members.filter((m) => m.id !== S.me.id) : [];
  const inviteBlock = grp && !d.id ? `
    <section class="card list" aria-label="Invite">
      <div class="list-row"><span class="h2 grow">Invite from ${esc(grp.name)}</span><span class="label muted">${d.invitees.length} selected</span></div>
      ${others.length ? others.map((m) => `<button type="button" class="list-row" role="checkbox" data-action="draft-invitee" data-id="${m.id}" aria-checked="${d.invitees.includes(m.id)}">
        <span class="avatar small" aria-hidden="true">${initial(m.display_name)}</span>
        <span class="grow" style="display:flex;flex-direction:column"><span style="font-weight:600">${esc(m.display_name)}</span><span class="label muted">@${esc(m.username)}</span></span>
        <span class="check">${icon('check', 'sm')}</span></button>`).join('') : '<div class="list-row label muted">No one else is in this group yet.</div>'}
    </section>
    <p class="note">${icon('eye', 'sm')} Guests see full details. Everyone else in ${esc(grp.name)} sees you as busy.</p>` : '';
  return `<form data-form="editor" style="display:contents" novalidate>
    <div class="sheet-head">
      <button type="button" class="btn btn-text" data-action="close" style="padding:0">Cancel</button>
      <h2 class="h2">${heading}</h2>
      <button type="submit" class="btn btn-primary sm">${grp && !d.id ? 'Send invite' : 'Save'}</button>
    </div>
    ${!d.id && !grp ? `<div class="seg" role="group" aria-label="What are you adding">
      <button type="button" data-action="draft-kind" data-v="event" aria-pressed="${!rem}">Event</button>
      <button type="button" data-action="draft-kind" data-v="reminder" aria-pressed="${rem}">Reminder</button></div>` : ''}
    ${rem ? `<div class="row wrap" role="group" aria-label="Kind of reminder">${REMINDER_TYPES.map(([k, l]) => `<button type="button" class="pill" data-action="draft-rtype" data-v="${k}" aria-pressed="${d.reminder_type === k}">${l}</button>`).join('')}</div>` : ''}
    <div class="field"><label class="label" for="e-title">Title</label>
      <input class="input title-input" id="e-title" name="title" value="${esc(d.title)}" maxlength="120" required placeholder="${rem ? 'e.g. Mum’s birthday' : grp ? `Dinner with ${esc(grp.name)}` : 'e.g. Lunch with a friend'}"></div>
    <div class="card list">
      ${rem ? `<label class="list-row"><span class="grow">Date</span><input class="inline-input" type="date" name="date" value="${d.date}" required></label>` : `
        <button type="button" class="list-row" data-action="draft-allday" aria-pressed="${d.all_day}"><span class="grow">All day</span>${sw()}</button>
        <div class="list-row"><span class="grow">Starts</span>
          <input class="inline-input" type="date" name="date" value="${d.date}" aria-label="Start date" required>
          ${d.all_day ? '' : `<input class="inline-input" type="time" name="start" value="${d.start}" aria-label="Start time" required>`}</div>
        <div class="list-row"><span class="grow">Ends</span>
          <input class="inline-input" type="date" name="endDate" value="${d.endDate || d.date}" min="${d.date}" aria-label="End date" required>
          ${d.all_day ? '' : `<input class="inline-input" type="time" name="end" value="${d.end}" aria-label="End time" required>`}</div>
        ${(() => { const r = draftRange(d); return r.e <= r.s ? `<div class="list-row label warn" role="alert">${icon('alert', 'sm')} It ends before it starts. Pick a later end.</div>` : ''; })()}`}
      <label class="list-row"><span class="grow">Repeat</span>
        <select class="inline-input" name="repeat" style="appearance:none;-webkit-appearance:none;font-weight:600">
          ${Object.entries(REPEAT_LABEL).map(([k, l]) => `<option value="${k}" ${d.repeat === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${rem ? '' : `<label class="list-row"><span class="grow" style="flex:none">Place</span><input class="inline-input grow" name="location" value="${esc(d.location)}" placeholder="Add a place" maxlength="200"></label>`}
    </div>
    <div class="field"><label class="label" for="e-notes">Notes</label><textarea class="input" id="e-notes" name="notes" maxlength="2000" placeholder="Anything people should know">${esc(d.notes)}</textarea></div>
    ${inviteBlock}
    ${sharing}
    <section class="card list" aria-label="Remind me">
      <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:0"><span class="h2">Remind me</span><span class="label muted">Shows at the top of your calendar when it's time</span></div>
      ${alertOpts.map(([m, l]) => `<button type="button" class="list-row" role="checkbox" data-action="draft-alert" data-v="${m}" aria-checked="${d.alerts.includes(m)}"><span class="grow">${l}</span><span class="check">${icon('check', 'sm')}</span></button>`).join('')}
    </section>
    ${d.id ? '<button type="button" class="btn btn-danger big" data-action="delete-event">Delete</button>' : ''}
  </form>`;
}
async function saveDraft() {
  const d = sheet.draft, rem = d.kind === 'reminder';
  if (!d.title.trim()) { showToast('Give it a title first.', true); sheet.focus = '#e-title'; renderSheet(); return; }
  if (!d.date) { showToast('Pick a date.', true); return; }
  const allDay = rem || d.all_day;
  const { s: starts, e: ends } = draftRange(d);
  if (isNaN(starts) || isNaN(ends)) { showToast('Pick a start and an end.', true); return; }
  if (ends <= starts) { showToast('It ends before it starts. Pick a later end.', true); return; }
  const grp = d.groupEvent;
  const isPrivate = grp ? false : d.is_private || !d.groups.length;
  const row = {
    kind: d.kind, reminder_type: rem ? d.reminder_type : null, title: d.title.trim(),
    starts_at: starts.toISOString(), ends_at: ends.toISOString(), all_day: allDay,
    location: rem ? null : d.location.trim() || null, notes: d.notes.trim() || null,
    is_private: isPrivate, detail: grp || rem ? 'full' : d.detail, repeat: d.repeat,
    alerts: d.alerts, group_id: grp || null
  };
  const shareTo = grp ? [grp] : isPrivate ? [] : d.groups;
  sheet.saving = true;
  try {
    let id = d.id;
    if (id) {
      const { error } = await sb.from('events').update(row).eq('id', id);
      if (error) throw error;
      const { error: e2 } = await sb.from('event_shares').delete().eq('event_id', id);
      if (e2) throw e2;
    } else {
      const { data, error } = await sb.from('events').insert(row).select('id').single();
      if (error) throw error;
      id = data.id;
    }
    if (shareTo.length) {
      const { error } = await sb.from('event_shares').insert(shareTo.map((g) => ({ event_id: id, group_id: g })));
      if (error) throw error;
    }
    if (grp && !d.id && d.invitees.length) {
      const { error } = await sb.from('invites').insert(d.invitees.map((u) => ({ event_id: id, user_id: u })));
      if (error) throw error;
    }
    closeSheet();
    showToast(grp && !d.id ? `Invite sent to ${d.invitees.length} ${d.invitees.length === 1 ? 'person' : 'people'}` : rem ? 'Reminder saved' : 'Event saved');
    if (grp && !d.id) { S.tab = 'calendar'; S.view = 'day'; S.date = sod(starts); S.scrollToNow = true; }
    await refresh(['events', 'invites']);
  } catch (e) { showToast(niceError(e), true); }
  if (sheet) sheet.saving = false;
}

// ---------- groups
function groupSheet() {
  const g = S.groupsById[sheet.id];
  if (!g) return '<p>That group is gone.</p>';
  const owner = g.owner_id === S.me.id;
  return `<div class="sheet-grip"></div>
    <div class="row c-${g.color}"><span class="dot" style="width:12px;height:12px"></span><h2 class="h-event grow">${esc(g.name)}</h2>
      <button type="button" class="icon-btn plain" data-action="close" aria-label="Close">${icon('x')}</button></div>
    ${owner ? `<div class="field"><span class="label">When you share an event with this group, start with</span>
      <div class="seg" role="group"><button type="button" data-action="group-detail" data-v="full" aria-pressed="${g.default_detail === 'full'}">Full details</button>
      <button type="button" data-action="group-detail" data-v="busy" aria-pressed="${g.default_detail === 'busy'}">Busy only</button></div></div>` : ''}
    <section class="card list" aria-label="Members">
      <div class="list-row"><span class="h2 grow">${g.members.length} ${g.members.length === 1 ? 'person' : 'people'}</span></div>
      ${g.members.map((m) => `<div class="list-row"><span class="avatar small" aria-hidden="true">${initial(m.display_name)}</span>
        <span class="grow" style="display:flex;flex-direction:column"><span style="font-weight:600">${esc(m.display_name)}${m.id === S.me.id ? ' (you)' : ''}${m.id === g.owner_id ? ' · manager' : ''}</span><span class="label muted">@${esc(m.username)}</span></span>
        ${owner && m.id !== S.me.id ? `<button type="button" class="btn btn-text sm" data-action="remove-member" data-id="${m.id}" aria-label="Remove ${esc(m.display_name)}">Remove</button>` : ''}</div>`).join('')}
    </section>
    ${owner ? `<form data-form="add-member" class="field" novalidate>
      <label class="label" for="m-user">Add people by username</label>
      <div class="row"><input class="input grow" id="m-user" name="username" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="@username" style="border-radius:999px;height:48px">
      <button type="submit" class="btn btn-outline">Add</button></div></form>` : ''}
    <div class="row">
      <button type="button" class="btn btn-outline grow" data-action="group-find">${icon('clock')} Find a time</button>
      ${owner ? '<button type="button" class="btn btn-danger" data-action="delete-group">Delete group</button>' : '<button type="button" class="btn btn-danger" data-action="leave-group">Leave</button>'}
    </div>`;
}
function newGroupSheet() {
  const d = sheet.draft;
  return `<form data-form="new-group" style="display:contents" novalidate>
    <div class="sheet-head"><button type="button" class="btn btn-text" data-action="close" style="padding:0">Cancel</button>
      <h2 class="h2">New group</h2><button type="submit" class="btn btn-primary sm">Create</button></div>
    <div class="field"><label class="label" for="g-name">Name</label>
      <input class="input" id="g-name" name="name" value="${esc(d.name)}" maxlength="40" required placeholder="Office, Family, Friends…"></div>
    <div class="field"><span class="label">Colour</span>
      <div class="row wrap">${COLORS.map((c) => `<button type="button" class="pill c-${c}" data-action="ng-color" data-v="${c}" aria-pressed="${d.color === c}"><span class="dot"></span>${c[0].toUpperCase() + c.slice(1)}</button>`).join('')}</div></div>
    <div class="field"><span class="label">When you share an event with this group, start with</span>
      <div class="seg" role="group"><button type="button" data-action="ng-detail" data-v="full" aria-pressed="${d.detail === 'full'}">Full details</button>
      <button type="button" data-action="ng-detail" data-v="busy" aria-pressed="${d.detail === 'busy'}">Busy only</button></div></div>
    <p class="note">You can add people right after you create it.</p>
  </form>`;
}
function meSheet() {
  return `<div class="sheet-grip"></div>
    <div class="row"><span class="avatar" aria-hidden="true">${initial(S.me.display_name)}</span>
      <div class="grow"><h2 class="h-event">${esc(S.me.display_name)}</h2><span class="label muted">@${esc(S.me.username)}${S.session?.user?.email && !S.session.user.email.endsWith('@' + USERNAME_EMAIL_DOMAIN) ? ' · ' + esc(S.session.user.email) : ''}</span></div>
      <button type="button" class="icon-btn plain" data-action="close" aria-label="Close">${icon('x')}</button></div>
    <form data-form="profile" class="field" novalidate>
      <label class="label" for="p-name">Your name</label>
      <div class="row"><input class="input grow" id="p-name" name="name" value="${esc(S.me.display_name)}" maxlength="40" required>
      <button type="submit" class="btn btn-outline">Save</button></div>
    </form>
    <div class="card"><span class="h2">Put Huddle on your Home Screen</span>
      <span class="label muted">In Safari, tap the Share button, then “Add to Home Screen”. Huddle then opens like an app.</span></div>
    <button type="button" class="btn btn-outline big" data-action="sign-out">Sign out</button>`;
}

// ---------------------------------------------------------------- toast
let toastTimer;
function showToast(msg, err = false) {
  clearTimeout(toastTimer);
  $toast.innerHTML = `<div class="toast${err ? ' err' : ''}" role="${err ? 'alert' : 'status'}">${esc(msg)}</div>`;
  toastTimer = setTimeout(() => { $toast.innerHTML = ''; }, err ? 5000 : 2500);
}

// ---------------------------------------------------------------- actions
function go(change) { change(); S.scrollToNow = true; render(); loadEvents().then(render).catch((e) => showToast(niceError(e), true)); }
const actions = {
  'auth-mode': (el) => { S.authMode = el.dataset.mode; render(); },
  tab: (el) => { S.tab = el.dataset.tab; window.scrollTo(0, 0); render(); if (S.tab === 'invites') refresh(['invites']); },
  view: (el) => go(() => { S.view = el.dataset.view; store.set('view', S.view); }),
  today: () => go(() => { S.date = today(); }),
  prev: () => go(() => step(-1)),
  next: () => go(() => step(1)),
  'pick-day': (el) => go(() => { S.date = fromKey(el.dataset.date); if (el.dataset.go) { S.view = el.dataset.go; store.set('view', S.view); } }),
  'pick-month': (el) => go(() => { const m = +el.dataset.month, now = new Date(); S.view = 'month'; store.set('view', 'month'); S.date = now.getMonth() === m && now.getFullYear() === S.date.getFullYear() ? today() : new Date(S.date.getFullYear(), m, 1); }),
  'toggle-cal': (el) => { const id = el.dataset.cal; S.enabled.has(id) ? S.enabled.delete(id) : S.enabled.add(id); store.set('enabled', [...S.enabled]); render(); },
  'new-event': () => openSheet({ type: 'editor', label: 'New event', draft: newDraft(), focus: '#e-title' }),
  'open-event': (el) => openEvent(el.dataset.id, el.dataset.start),
  close: () => closeSheet(),
  retry: () => { S.loadError = null; render(); bootstrap(); },
  backdrop: (el, e) => { if (e.target === el) closeSheet(); },
  me: () => openSheet({ type: 'me', label: 'Your account' }),
  'sign-out': async () => { closeSheet(); await sb.auth.signOut(); },
  // editor
  'draft-kind': (el) => { const d = sheet.draft; d.kind = el.dataset.v; if (d.kind === 'reminder') { d.all_day = true; if (d.repeat === 'none') d.repeat = 'yearly'; d.alerts = [-540, 900]; } else { d.all_day = false; d.alerts = []; if (d.repeat === 'yearly') d.repeat = 'none'; } renderSheet(); },
  'draft-rtype': (el) => { sheet.draft.reminder_type = el.dataset.v; if (el.dataset.v === 'bill' && sheet.draft.repeat === 'yearly') sheet.draft.repeat = 'monthly'; renderSheet(); },
  'draft-allday': () => {
    const d = sheet.draft; d.all_day = !d.all_day; d.alerts = [];
    if (!d.endDate || fromKey(d.endDate) < fromKey(d.date)) d.endDate = d.date;
    if (!d.all_day) { const r = draftRange(d); if (r.e <= r.s) { const e = new Date(r.s.getTime() + HOUR); d.endDate = dayKey(e); d.end = timeKey(e); } }
    renderSheet();
  },
  'draft-private': () => { const d = sheet.draft; d.is_private = !d.is_private; renderSheet(); },
  'draft-group': (el) => {
    const d = sheet.draft, id = el.dataset.id;
    if (d.groups.includes(id)) d.groups = d.groups.filter((g) => g !== id);
    else { if (!d.groups.length) d.detail = S.groupsById[id]?.default_detail || 'busy'; d.groups.push(id); }
    renderSheet();
  },
  'draft-detail': (el) => { sheet.draft.detail = el.dataset.v; renderSheet(); },
  'draft-alert': (el) => { const d = sheet.draft, v = +el.dataset.v; d.alerts = d.alerts.includes(v) ? d.alerts.filter((a) => a !== v) : [...d.alerts, v].sort((a, b) => a - b); renderSheet(); },
  'draft-invitee': (el) => { const d = sheet.draft, id = el.dataset.id; d.invitees = d.invitees.includes(id) ? d.invitees.filter((x) => x !== id) : [...d.invitees, id]; renderSheet(); },
  'edit-event': () => { const ev = sheet.ev; openSheet({ type: 'editor', label: 'Edit', draft: draftFromEvent(ev) }); },
  'delete-event': async () => {
    const id = sheet.ev?.id || sheet.draft?.id;
    const repeat = (sheet.ev || sheet.draft).repeat;
    if (!confirm(repeat && repeat !== 'none' ? 'Delete this and every repeat of it?' : 'Delete this?')) return;
    const { error } = await sb.from('events').delete().eq('id', id);
    if (error) { showToast(niceError(error), true); return; }
    closeSheet(); showToast('Deleted'); refresh(['events', 'invites']);
  },
  reply: async (el) => {
    const { error } = await sb.from('invites').update({ status: el.dataset.status, responded_at: new Date().toISOString() })
      .eq('event_id', el.dataset.id).eq('user_id', S.me.id);
    if (error) { showToast(niceError(error), true); return; }
    showToast(el.dataset.status === 'going' ? "You're going. It's on your calendar." : "Got it. We'll let them know.");
    if (sheet?.type === 'event') closeSheet();
    refresh(['events', 'invites']);
  },
  // groups
  'new-group': () => {
    const used = new Set(S.groups.map((g) => g.color));
    const color = ['blush', 'cobalt', 'olive', 'sun', 'tangerine', 'slate'].find((c) => !used.has(c)) || 'blush';
    openSheet({ type: 'new-group', label: 'New group', draft: { name: '', color, detail: 'busy' }, focus: '#g-name' });
  },
  'dismiss-alert': (el) => { const d = store.get('dismissed', []); d.push(el.dataset.key); store.set('dismissed', d.slice(-300)); render(); },
  'ng-color': (el) => { sheet.draft.color = el.dataset.v; renderSheet(); },
  'ng-detail': (el) => { sheet.draft.detail = el.dataset.v; renderSheet(); },
  'open-group': (el) => openSheet({ type: 'group', label: 'Group', id: el.dataset.id }),
  'group-detail': async (el) => {
    const { error } = await sb.from('groups').update({ default_detail: el.dataset.v }).eq('id', sheet.id);
    if (error) { showToast(niceError(error), true); return; }
    S.groupsById[sheet.id].default_detail = el.dataset.v; renderSheet();
  },
  'remove-member': async (el) => {
    const g = S.groupsById[sheet.id], m = g.members.find((x) => x.id === el.dataset.id);
    if (!confirm(`Remove ${m?.display_name} from ${g.name}?`)) return;
    const { error } = await sb.from('group_members').delete().eq('group_id', g.id).eq('user_id', el.dataset.id);
    if (error) { showToast(niceError(error), true); return; }
    await refresh(['groups', 'events']);
  },
  'delete-group': async () => {
    const g = S.groupsById[sheet.id];
    if (!confirm(`Delete ${g.name}? Events shared with it become private again.`)) return;
    const { error } = await sb.from('groups').delete().eq('id', g.id);
    if (error) { showToast(niceError(error), true); return; }
    closeSheet(); showToast('Group deleted'); refresh(['groups', 'events']);
  },
  'leave-group': async () => {
    const g = S.groupsById[sheet.id];
    if (!confirm(`Leave ${g.name}?`)) return;
    const { error } = await sb.from('group_members').delete().eq('group_id', g.id).eq('user_id', S.me.id);
    if (error) { showToast(niceError(error), true); return; }
    closeSheet(); showToast(`You left ${g.name}`); refresh(['groups', 'events']);
  },
  'group-find': () => { S.find.groupId = sheet.id; S.find.sel = null; closeSheet(); S.tab = 'find'; render(); },
  // find a time
  'find-group': (el) => { S.find.groupId = el.dataset.id; S.find.sel = null; render(); },
  'find-week': (el) => { S.find.weekStart = addDays(S.find.weekStart, 7 * +el.dataset.dir); S.find.sel = null; render(); },
  'find-window': (el) => { S.find.window = el.dataset.w; store.set('findWindow', S.find.window); S.find.sel = null; render(); },
  'find-dur': (el) => { S.find.dur = +el.dataset.n; render(); },
  'pick-slot': (el) => { S.find.sel = new Date(el.dataset.t); render(); },
  'plan-group': () => {
    const F = S.find, g = S.groupsById[F.groupId];
    if (!F.sel || !g) return;
    const s = F.sel, e = new Date(s.getTime() + F.dur * HOUR);
    openSheet({ type: 'editor', label: 'Group event', focus: '#e-title', draft: newDraft({
      date: dayKey(s), start: timeKey(s), endDate: dayKey(e), end: timeKey(e), groupEvent: g.id, is_private: false, groups: [g.id], detail: 'full',
      invitees: g.members.filter((m) => m.id !== S.me.id).map((m) => m.id) }) });
  }
};
function step(dir) {
  const d = S.date;
  if (S.view === 'day') S.date = addDays(d, dir);
  else if (S.view === 'week') S.date = addDays(d, 7 * dir);
  else if (S.view === 'month') { const t = new Date(d.getFullYear(), d.getMonth() + dir, 1); const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); S.date = new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), last)); }
  else S.date = new Date(d.getFullYear() + dir, d.getMonth(), 1);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (!fn) return;
  if (el.dataset.action !== 'backdrop') e.preventDefault();
  fn(el, e);
});
document.addEventListener('input', (e) => {
  if (sheet?.type === 'editor' && e.target.name && !TIME_FIELDS.includes(e.target.name) && e.target.closest('[data-form="editor"]')) sheet.draft[e.target.name] = e.target.value;
  if (sheet?.type === 'new-group' && e.target.name === 'name') sheet.draft.name = e.target.value;
});
document.addEventListener('change', (e) => {
  if (sheet?.type !== 'editor' || !e.target.name) return;
  const d = sheet.draft, name = e.target.name;
  if (!TIME_FIELDS.includes(name)) { d[name] = e.target.value; return; }
  if (!e.target.value) return;
  const before = draftRange(d);
  d[name] = e.target.value;
  if ((name === 'date' || name === 'start') && d.kind !== 'reminder') {
    // Moving the start moves the end too, keeping the same length.
    const ns = draftRange(d).s;
    if (d.all_day) d.endDate = dayKey(addDays(ns, Math.max(1, Math.round((before.e - before.s) / (24 * HOUR))) - 1));
    else { const ne = new Date(ns.getTime() + Math.max(15 * 60000, before.e - before.s || HOUR)); d.endDate = dayKey(ne); d.end = timeKey(ne); }
  }
  renderSheet();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (drag.active) cancelDrag(); else if (sheet) closeSheet(); } });

// ---------------------------------------------------------------- drag to move
// Your own events can be dragged: up/down for time, sideways (week view) or onto
// a date (week strip, week header, month grid) for the day. On touch screens,
// press and hold first so normal scrolling still works.
const drag = { el: null, ev: null, active: false, suppress: false, timer: null };
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('[data-drag]');
  if (!el || sheet || (e.pointerType === 'mouse' && e.button !== 0)) return;
  const ev = S.events.find((x) => x.id === el.dataset.id);
  if (!ev || !ev.is_mine) return;
  const r = el.getBoundingClientRect();
  Object.assign(drag, { el, ev, occStart: new Date(el.dataset.start), x0: e.clientX, y0: e.clientY, offX: e.clientX - r.left, offY: e.clientY - r.top,
    w: r.width, h: r.height, pointerId: e.pointerId, active: false, target: null, x: e.clientX, y: e.clientY });
  clearTimeout(drag.timer);
  if (e.pointerType !== 'mouse') drag.timer = setTimeout(() => { if (drag.el === el) startDrag(); }, 350);
});
document.addEventListener('pointermove', (e) => {
  if (!drag.el || e.pointerId !== drag.pointerId) return;
  drag.x = e.clientX; drag.y = e.clientY;
  if (!drag.active) {
    const moved = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0);
    if (e.pointerType === 'mouse') { if (moved > 6) startDrag(); else return; }
    else { if (moved > 10) { clearTimeout(drag.timer); drag.el = null; } return; }
  }
  moveDrag();
});
document.addEventListener('pointerup', (e) => {
  if (!drag.el || e.pointerId !== drag.pointerId) return;
  clearTimeout(drag.timer);
  if (drag.active) endDrag(); else drag.el = null;
});
document.addEventListener('pointercancel', () => { clearTimeout(drag.timer); if (drag.active) cancelDrag(); else drag.el = null; });
document.addEventListener('touchmove', (e) => { if (drag.active) e.preventDefault(); }, { passive: false });
document.addEventListener('contextmenu', (e) => { if (drag.el) e.preventDefault(); });
document.addEventListener('click', (e) => { if (drag.suppress) { drag.suppress = false; e.preventDefault(); e.stopPropagation(); } }, true);

function startDrag() {
  drag.active = true;
  const g = drag.el.cloneNode(true);
  g.removeAttribute('data-action'); g.removeAttribute('data-drag');
  g.classList.add('drag-ghost');
  g.style.cssText = `position:fixed;left:0;top:0;width:${drag.w}px;height:${drag.h}px;margin:0`;
  document.body.appendChild(g);
  drag.ghost = g;
  drag.label = document.createElement('div');
  drag.label.className = 'drag-label';
  document.body.appendChild(drag.label);
  drag.el.classList.add('drag-source');
  document.body.classList.add('dragging');
  moveDrag();
}
function dropTarget(x, y) {
  const hit = document.elementFromPoint(x, y);
  if (!hit) return null;
  const ev = drag.ev, dur = new Date(ev.ends_at) - new Date(ev.starts_at), o = drag.occStart;
  const col = hit.closest('[data-col]');
  if (col) {
    const d = fromKey(col.dataset.col);
    if (ev.all_day) return { node: col, start: d, end: new Date(d.getTime() + dur) };
    const r = col.getBoundingClientRect();
    let mins = Math.round((((y - drag.offY) - r.top) / 48) * 60 / 15) * 15;
    mins = Math.max(0, Math.min(24 * 60 - 15, mins));
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, mins);
    return { node: col, start, end: new Date(start.getTime() + dur) };
  }
  const day = hit.closest('[data-date]');
  if (day) {
    const d = fromKey(day.dataset.date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), o.getHours(), o.getMinutes());
    return { node: day, start, end: new Date(start.getTime() + dur) };
  }
  return null;
}
function moveDrag() {
  const { x, y } = drag;
  drag.ghost.style.transform = `translate(${x - drag.offX}px, ${y - drag.offY}px)`;
  // Scroll the timeline when dragging near its top or bottom edge.
  const wrap = document.querySelector('.timeline-wrap');
  if (wrap) {
    const r = wrap.getBoundingClientRect();
    if (y < r.top + 40 && y > r.top - 60) wrap.scrollTop -= 12;
    else if (y > r.bottom - 40 && y < r.bottom + 60) wrap.scrollTop += 12;
  }
  const t = dropTarget(x, y);
  if (drag.target?.node && drag.target.node !== t?.node) drag.target.node.classList.remove('drop-target');
  if (t) t.node.classList.add('drop-target');
  drag.target = t;
  drag.label.textContent = t ? `${fmtDate(t.start)}${drag.ev.all_day ? '' : ' · ' + fmtRange(t.start, t.end)}` : 'Drop on a day or time';
  drag.label.style.transform = `translate(calc(${x}px - 50%), ${Math.max(8, y - drag.offY - 44)}px)`;
}
function cleanupDrag() {
  drag.ghost?.remove(); drag.label?.remove();
  drag.el?.classList.remove('drag-source');
  drag.target?.node?.classList.remove('drop-target');
  document.body.classList.remove('dragging');
  Object.assign(drag, { el: null, active: false, ghost: null, label: null });
}
function cancelDrag() { cleanupDrag(); }
function endDrag() {
  const t = drag.target, ev = drag.ev, from = drag.occStart;
  drag.suppress = true; setTimeout(() => { drag.suppress = false; }, 400);
  cleanupDrag();
  if (!t || t.start.getTime() === from.getTime()) return;
  moveEvent(ev, t.start.getTime() - from.getTime(), t.start);
}
async function moveEvent(ev, delta, newStart) {
  if (ev.repeat && ev.repeat !== 'none' && !confirm('This one repeats. Move every repeat by the same amount?')) return;
  const before = { starts_at: ev.starts_at, ends_at: ev.ends_at };
  const row = { starts_at: new Date(new Date(ev.starts_at).getTime() + delta).toISOString(), ends_at: new Date(new Date(ev.ends_at).getTime() + delta).toISOString() };
  Object.assign(ev, row); render(); // show it in the new spot straight away
  const { error } = await sb.from('events').update(row).eq('id', ev.id);
  if (error) { Object.assign(ev, before); render(); showToast(niceError(error), true); return; }
  showToast(`Moved to ${fmtDate(newStart)}${ev.all_day ? '' : ' at ' + fmtTime(newStart)}${ev.group_id ? '. Guests will see the new time.' : ''}`);
  refresh(['events', 'invites']);
}
document.addEventListener('submit', async (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form));
  const btn = form.querySelector('[type="submit"]') || $sheet.querySelector('[type="submit"]');
  if (btn) btn.disabled = true;
  try {
    if (form.dataset.form === 'auth') await submitAuth(f);
    else if (form.dataset.form === 'editor') { for (const k of TIME_FIELDS) if (f[k]) sheet.draft[k] = f[k]; if (!sheet.saving) await saveDraft(); }
    else if (form.dataset.form === 'new-group') await createGroup();
    else if (form.dataset.form === 'add-member') await addMember(f.username);
    else if (form.dataset.form === 'profile') await saveProfile(f.name);
  } finally { if (btn && btn.isConnected) btn.disabled = false; }
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function submitAuth(f) {
  const password = String(f.password || '');
  if (S.authMode === 'create') {
    const username = String(f.username || '').trim().toLowerCase().replace(/^@/, '');
    const email = String(f.email || '').trim().toLowerCase();
    const name = String(f.name || '').trim();
    if (!name) { showToast('Add your name so friends recognise you.', true); return; }
    if (!EMAIL_RE.test(email)) { showToast("That email address doesn't look right.", true); return; }
    if (!/^[a-z0-9._]{3,24}$/.test(username)) { showToast('Usernames are 3–24 letters, numbers, dots or underscores.', true); return; }
    if (password.length < 8) { showToast('Passwords need at least 8 characters.', true); return; }
    const { data: free, error: e1 } = await sb.rpc('username_available', { p_username: username });
    if (e1) { showToast(niceError(e1), true); return; }
    if (!free) { showToast('That username is taken. Try another.', true); return; }
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username, display_name: name } } });
    if (error) { showToast(/already registered|already exists/i.test(error.message) ? 'That email already has an account. Try signing in.' : niceError(error), true); return; }
    if (!data.session) showToast('Account made, but Supabase wants email confirmation. Turn off "Confirm email" (see README), then sign in.', true);
    return;
  }
  const login = String(f.login || '').trim().toLowerCase().replace(/^@(?=[^@]*$)/, '');
  if (!login || !password) { showToast('Enter your username or email, and your password.', true); return; }
  if (login.includes('@')) {
    const { error } = await sb.auth.signInWithPassword({ email: login, password });
    if (error) showToast(niceError(error), true);
    return;
  }
  // Username: the "sign-in" function on Supabase finds the email for it.
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ username: login, password })
    });
  } catch { res = null; }
  if (res && res.ok) {
    const s = await res.json();
    const { error } = await sb.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token });
    if (error) showToast(niceError(error), true);
    return;
  }
  if (res && res.status === 400) { const b = await res.json().catch(() => ({})); showToast(b.error || "That username and password don't match.", true); return; }
  // Function not set up yet: fall back to accounts made before email sign-up existed.
  const { error } = await sb.auth.signInWithPassword({ email: `${login}@${USERNAME_EMAIL_DOMAIN}`, password });
  if (error) showToast(/Invalid login/i.test(error.message) ? "That username and password don't match. If you signed up with an email, try signing in with it." : niceError(error), true);
}
async function createGroup() {
  const d = sheet.draft;
  if (!d.name.trim()) { showToast('Give the group a name.', true); return; }
  const { data, error } = await sb.from('groups').insert({ name: d.name.trim(), color: d.color, default_detail: d.detail, owner_id: S.me.id }).select('id').single();
  if (error) { showToast(niceError(error), true); return; }
  await loadGroups();
  S.enabled.add(data.id); store.set('enabled', [...S.enabled]);
  render();
  openSheet({ type: 'group', label: 'Group', id: data.id, focus: '#m-user' });
  showToast(`${d.name.trim()} created. Now add people.`);
}
async function addMember(raw) {
  const username = String(raw || '').trim().toLowerCase().replace(/^@/, '');
  if (!username) return;
  const { error } = await sb.rpc('add_member_by_username', { p_group: sheet.id, p_username: username });
  if (error) { showToast(/No one has/.test(error.message) ? `No one has the username @${username}.` : niceError(error), true); return; }
  showToast(`Added @${username}`);
  sheet.focus = '#m-user';
  await refresh(['groups', 'events']);
}
async function saveProfile(name) {
  name = String(name || '').trim();
  if (!name) return;
  const { error } = await sb.from('profiles').update({ display_name: name }).eq('id', S.me.id);
  if (error) { showToast(niceError(error), true); return; }
  S.me.display_name = name; showToast('Saved'); render();
}

// ---------------------------------------------------------------- start
if (!configured) render();
else {
  sb.auth.onAuthStateChange((event, session) => {
    const was = S.session?.user?.id, now = session?.user?.id;
    S.session = session;
    if (!session) { S.ready = false; S.me = null; S.events = []; S.eventsKey = null; S.groups = []; S.invites = { received: [], sent: [] }; sheet = null; render(); return; }
    if (was !== now) { S.ready = false; render(); setTimeout(bootstrap, 0); }
  });
  sb.auth.getSession().then(({ data }) => { if (!data.session) render(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.ready) refresh(['events', 'invites']); });
  setInterval(() => { if (S.ready && document.visibilityState === 'visible' && S.tab === 'calendar' && !sheet) render(); }, 60000);
}
