// Huddle settings — fill in the two values from Supabase
// (Supabase › Project Settings › API, or the "Connect" button on your project).
export const SUPABASE_URL = 'https://fweswcmixcladaveqwbu.supabase.co';       // looks like https://abcdxyz.supabase.co
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZXN3Y21peGNsYWRhdmVxd2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMjk3NjUsImV4cCI6MjEwNzcwNTc2NX0.LphcB-twvqQLh3l9QDzOr8qU1hGgK7GzO1x4XPj0xCE'; // the "anon" / "publishable" key — safe to put here

// Huddle signs people in with a username. Behind the scenes Supabase needs an
// email address, so each username becomes  username@<this domain>.
// No emails are ever sent to it. Only change this before anyone signs up.
export const USERNAME_EMAIL_DOMAIN = 'users.huddle.app';

// Public key for phone notifications (the matching private key goes in Supabase › Edge Functions › Secrets).
export const VAPID_PUBLIC_KEY = 'BB_3muFIARuPXUPp4x2AlYhMCe3QVlB3DLRSceVJNnBrY4PXdL6Ruu6wiON9irj5OSvyET6A7zJ9gm21N03ywGk';
