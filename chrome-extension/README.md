# Chrome Extension — Smart Email Assist

A Manifest V3 Chrome extension that adds an "AI Reply" control inside Gmail's
reply/compose box, generates a tone-selected reply via the Spring Boot
backend, and inserts it into the compose editor.

## How it works

```
Gmail page (content.js)
  -> detects the reply/compose box
  -> extracts the email you're replying to
  -> you pick a tone and click "AI Reply"
       |
       v
Extension service worker (background.js)
  -> POST {backend URL}/api/email/generate
       |
       v
Spring Boot backend -> reply-generation service
       |
       v
Generated reply text -> inserted into the Gmail compose box
```

The network call is made from the background **service worker**, not the
content script. Content scripts run inside the Gmail page and can be
constrained by Gmail's Content-Security-Policy; the service worker is a
separate extension context that only needs the host permissions declared
in `manifest.json`.

## Install (unpacked, for local development)

1. Start the backend (`email-writer-sb`) — see the root `README.md`.
2. Go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select this `chrome-extension/` folder.
5. Click the extension icon → confirm/set the **Backend URL**
   (defaults to `http://localhost:8080`, which is pre-authorized).
   If you point it at a different origin, Chrome will prompt you to grant
   that origin permission (Manifest V3 optional host permissions).
6. Open Gmail, open any email, click **Reply**. An "✨ AI Reply" control
   appears near the Send button inside the compose box. Pick a tone and
   click it.

## What's testable here vs. what to check yourself

I verified: `manifest.json` is valid JSON, and `background.js`,
`content.js`, and `popup/popup.js` all pass `node --check` (syntax-valid,
no MV3 API typos I could catch statically).

I could **not** load this into an actual Chrome browser or click through
a live Gmail thread in this environment — there's no browser available
here. Before relying on it, load it unpacked as above and confirm:
- The AI Reply control appears when you open a reply box.
- The extracted email text is what you expect (open the DevTools console
  on the Gmail tab — the content script logs nothing by default, but you
  can inspect `.a3s.aiL` elements yourself if something looks off).
- The generated reply is inserted above any quoted thread text.

## Known fragility (be upfront about this in an interview)

Gmail's DOM is not a public, versioned API. This extension relies on:
- `div[aria-label="Message Body"][contenteditable="true"]` for the
  compose editor
- `.a3s.aiL` for a rendered message body in the thread

These have been stable selectors in Gmail's web UI for a long time and
are widely used by other Gmail extensions, but a Gmail redesign can
change them. If the AI Reply button stops appearing, that's the first
place to look — inspect the compose box in DevTools and update the
selectors in `content.js`. There's no telemetry or auto-detection of
selector breakage; it fails silently (the button just doesn't show up).

## Permissions used

- `storage` — persist the backend URL you configure.
- `activeTab`, `scripting` — standard MV3 extension scaffolding.
- `host_permissions` for `localhost:8080` / `127.0.0.1:8080` — talk to the
  local backend by default.
- `optional_host_permissions` — requested at runtime only if you point
  the extension at a non-localhost backend URL.
