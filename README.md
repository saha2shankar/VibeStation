# VibeStation 🎧

Modern, Spotify‑inspired web music player built with **HTML**, **CSS**, and **Vanilla JavaScript**.  
VibeStation turns a simple list of `.mp3` files into a fully‑featured, playlist‑driven music experience.

---

## Features

**Core playback**

- Play / pause, next, previous
- Clickable + draggable seek bar
- Volume slider and mute / unmute
- Auto‑play next track
- Active song highlighting in the sidebar
- Current time / total duration display

**Playlist system**

- Left sidebar **“Your Library”** showing tracks for the active playlist
- Each card in the main grid represents a **playlist**
- Playlists are backed by **folders inside `/songs`**
- Switching playlists reloads the song list from the corresponding folder

**Advanced UX**

- Shuffle mode
- Repeat off / all / one
- Keyboard shortcuts:
  - `Space` → play / pause
  - `ArrowRight` / `ArrowLeft` → seek ±5 seconds
  - `ArrowUp` / `ArrowDown` → volume up / down
  - `M` → mute / unmute
- Persistent state via `localStorage`:
  - Last played song
  - Volume + mute
  - Shuffle + repeat mode
  - Favorites
- Animated audio visualizer (Web Audio API)
- Search box to filter songs in the current playlist
- Song metadata parsing from filename (`Title - Artist.mp3`)
- Favorites (like button) with sidebar star indicator
- Track index display (`current / total`)
- Toast notifications (now playing, favorite added/removed)
- Smooth fade‑in / fade‑out on play / pause

**UI / UX**

- Dark, glassy VibeStation theme
- Responsive layout: desktop, tablet, mobile
- Sliding sidebar on small screens (hamburger + close)
- Floating bottom playbar with rich controls
- Modern playlist cards with animated glow and hover states

---

## Tech Stack

- **HTML5** – layout and structure
- **CSS3** – custom responsive layout, gradients, glassmorphism, animations
- **Vanilla JavaScript (ES6+)** – modular player logic
- **Web Audio API** – audio visualizer

No external UI frameworks or JS libraries are used.

---

## Project Structure

```text
Spodify/
  public/
    *.svg              # Icons (play, pause, nav, etc.)
  songs/
    *.mp3              # Optional: root songs used by "All Library"
    focus-flow/
      *.mp3
    midnight-drive/
      *.mp3
    sunset-chill/
      *.mp3
    bass-booster/
      *.mp3
    vibe-classics/
      *.mp3
  index.html           # Main UI shell
  style.css            # Main styles for layout + theme
  utility.css          # Small utility classes (flex, spacing, etc.)
  main.js              # Player module (VibeStation logic)
  README.md
```

---

## Setup & Local Development

### 1. Clone the repository

```bash
git clone <YOUR_REPO_URL> VibeStation
cd VibeStation
```

### 2. Add your audio files

Put `.mp3` files into the `songs` directory:

- `songs/` – files here appear in the **All Library** playlist.
- `songs/focus-flow/`
- `songs/midnight-drive/`
- `songs/sunset-chill/`
- `songs/bass-booster/`
- `songs/vibe-classics/`

Each subfolder acts as a **separate playlist**. When you click a playlist card, VibeStation loads `.mp3` files from that folder only.

### 3. Run a local HTTP server

The player expects to reach your files via:

```js
BASE_URL = "http://127.0.0.1:3000";
```

You can use any static server that:

- Serves `index.html` and static assets.
- Exposes the `songs/` folder so that a request to  
  `http://127.0.0.1:3000/songs/<playlist-folder>/` returns a simple HTML directory listing with `<a>` links to `.mp3` files.

Examples (pick one that fits your stack):

- Node / npm (global `serve`):

  ```bash
  npx serve -l 3000 .
  ```

- Python (simple HTTP server; does not provide directory listings on all setups, but works if you adjust fetching logic):
  ```bash
  python -m http.server 3000
  ```

Adjust `BASE_URL` in `main.js` if you run the server on a different host or port.

### 4. Open the app

Visit:

```text
http://127.0.0.1:3000/
```

Select a playlist card, then click any song in the sidebar to start playing.

---

## How Playlists Work

In `main.js`, each playlist is defined with a `folder`:

```js
{
  id: "sunset-chill",
  name: "Sunset Chill",
  description: "Warm lofi and acoustic vibes",
  folder: "songs/sunset-chill",
  cover: "<image-url>",
}
```

On click:

1. The app fetches `BASE_URL + "/" + folder + "/"`.
2. Parses the HTML directory listing and extracts all `.mp3` links.
3. Normalizes filenames into `title` / `artist`.
4. Renders them in the sidebar.

To add a new playlist:

1. Create a folder in `songs/` (e.g. `songs/workout-energy`).
2. Drop `.mp3` files inside.
3. Add a playlist entry to the `playlists` array in `main.js`.

---

## Git: Prepare for First Push

From the project root:

```bash
# 1. Initialize git (if not already a repo)
git init

# 2. Check status
git status

# 3. Stage files
git add .

# 4. Commit with a clear message
git commit -m "chore: initial VibeStation setup"

# 5. Add remote
git remote add origin https://github.com/saha2shankar/VibeStation.git

# 6. Push to main branch
git branch -M main
git push -u origin main
```

After this, your code is on GitHub (or your Git provider) and ready for deployment.

---

## Deployment Options

VibeStation is a **static frontend** that fetches audio files from `/songs`. Deployment mainly means:

- Host `index.html`, `style.css`, `utility.css`, `main.js`, `public/`, and `songs/`.
- Make sure the `songs/` paths match the `BASE_URL` you configured.

### Option A: GitHub Pages

1. Push the repo to GitHub (see Git section above).
2. In GitHub:
   - Settings → Pages → Source: `Deploy from a branch`.
   - Select `main` and `/ (root)` or `/docs` depending on your layout.
3. Update `BASE_URL` in `main.js` to point to your Pages domain, e.g.:

   ```js
   const BASE_URL = window.location.origin;
   ```

4. Ensure the `songs/` folder is committed and publicly served.

> Note: GitHub Pages may **not** provide directory listings the same way as a raw HTTP server. For production, you may want to replace the HTML-directory parsing with a static JSON manifest of songs.

### Option B: Netlify / Vercel / Static Host

1. Connect your Git repo to Netlify or Vercel.
2. Configure a static build (no build command, output directory `.`).
3. Set `BASE_URL` in `main.js` to:

   ```js
   const BASE_URL = window.location.origin;
   ```

4. Make sure the `songs/` directory is deployed along with the code.

### Option C: Custom Node or Nginx Server

If you run your own server:

- Serve the project at `http://your-domain:3000/` (or update `BASE_URL`).
- Configure the server to list `/songs/...` directories as simple HTML pages with links, or expose an API endpoint that returns a JSON list of songs and adjust `getSongsList` accordingly.

---

## Customizing

- **Branding / Theme**  
  Change colors and gradients in `:root` inside `style.css`, especially:
  - `--vibe-green`
  - `--accent-secondary`

- **Playlists**  
  Add / remove playlist entries in the `playlists` array in `main.js`.

- **Shortcuts**  
  Extend `handleKeyboard` in `main.js` to add more keyboard controls (e.g. `S` for shuffle toggle).

---

## License

You can adapt this project freely for learning and personal use. For commercial use, adjust licensing to match your needs and third‑party content (icons, images, and audio).
