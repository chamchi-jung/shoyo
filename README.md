# shoyo

`shoyo` is a front-end MVP for making personal taste pages. The project favors profile display density, block editing, and theme personality before social features.

## Current MVP

- `/` shows the shoyo landing page with sample rooms, visual presets, and direct editor/profile CTAs.
- `/profile/[username]` renders rich sample user pages from hardcoded data.
- `/studio/profile` provides a local block-based editor with live preview.
- The studio includes block recipes for adding finished-feeling block groups in one click.
- Drafts are saved to browser `localStorage` under `shoyo:studio-profile`.
- JSON export/import is available for local draft handoff.
- Styling uses Tailwind CSS plus profile-level CSS variables and data attributes.

## Sample Routes

```text
http://localhost:3000/
http://localhost:3000/profile/mira-room
http://localhost:3000/profile/basement-zine
http://localhost:3000/profile/pixel-room
http://localhost:3000/studio/profile
```

## Profile Blocks

Profiles are built from `ProfileBlock[]` in `src/data/sampleProfiles.ts`.

- `album`
- `movie`
- `book`
- `text`
- `image`
- `gallery`
- `video`
- `link`
- `tags`

The YouTube block only accepts a YouTube URL or video ID and renders a controlled `youtube-nocookie.com` embed. Invalid URLs show a placeholder instead of rendering arbitrary iframe input.

## Theme Controls

`ProfileTheme` connects these values to CSS variables or data attributes:

- Colors: `background`, `paper`, `ink`, `muted`, `accent`, `border`
- Background: image URL, preset wallpaper, size, overlay darkness, blur
- Card style: `paper`, `outline`, `tape`, `glass`
- Font mood: `serif`, `mono`, `clean`
- Width: `narrow`, `standard`, `wide`
- Radius: `sharp`, `soft`, `rounded`
- Shadow: `none`, `soft`, `offset`, `bold`
- Density: `dense`, `cozy`, `airy`
- Layout: `zine`, `shelf`, `room`, `homepage`

`customCss` remains in the data model for later, but unrestricted CSS editing is intentionally disabled for this MVP.

## Visual Presets

The editor includes five presets:

- Midnight Music Room
- Photocopy Zine
- Pastel Collector
- Old Homepage
- Minimal Archive

Applying a preset updates the theme, layout, density, wallpaper, radius, shadow, and block ordering.

## Run

```bash
npm install
npm run dev
```

On Windows PowerShell, use `npm.cmd` if script execution policy gets in the way:

```bash
npm.cmd install
npm.cmd run dev
```

## Supabase Auth + Public Profiles

The app can run without Supabase and will keep showing sample profiles. To enable real sign-up, login, image upload, and public profile saving:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.local.example` to `.env.local`.
4. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Restart `npm run dev`.

After that, `/studio/profile` shows an account panel. Sign up or log in, edit the profile, then use "공개 프로필 저장". The public URL is `/profile/{username}`.

## Verify

```bash
npm.cmd run lint
npm.cmd run build
```

## Explicitly Excluded

- Backend
- Login
- Database
- Payment
- Recommendation algorithm
- Follow, comments, likes
- Arbitrary user HTML, JavaScript, CSS, or iframe input
- Persistent image upload

The success bar for this MVP is whether dummy data already feels like a real personal taste-page builder.
