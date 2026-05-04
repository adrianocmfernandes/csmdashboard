# SCOUTASTIC Dashboard Quickstart (Non‑Developer Friendly)

## Which is easier: localhost or CodeSandbox?
For non-developers, **CodeSandbox is easier**.

- No terminal setup
- No package installs on your machine
- Instant live preview in browser

Use localhost only if someone technical is helping you.

## Option A (Recommended): CodeSandbox
1. Open [https://codesandbox.io](https://codesandbox.io).
2. Create a new **React** sandbox.
3. In the left file panel, open `src/App.tsx` (your screenshot shows this file).
4. Replace all file contents with this repo's `App.jsx` contents.
5. Rename `src/App.tsx` to `src/App.jsx` (right-click file -> Rename).
6. Open `src/index.tsx` and make sure it imports `./App`.
7. Delete `import "./styles.css";` from the app file because this dashboard uses inline styles only.
8. (Optional) Remove `src/styles.css` if not used.
9. Ensure dependency `recharts` is installed (Dependencies panel).
10. Wait a few seconds: the dashboard should render in preview.

### If your preview is blank
- Confirm `recharts` is installed.
- Confirm the file exports the component (`export default App`).
- If TypeScript errors appear, keep this file as `App.jsx` (not `App.tsx`).
- Hard refresh the browser tab.

## Option B: Localhost (only if needed)
1. Install **Node.js LTS** from [https://nodejs.org](https://nodejs.org).
2. Open Terminal / Command Prompt.
3. Create a React app (or use an existing one).
4. Copy this repo's `App.jsx` into `src/App.jsx`.
5. Install charts package:
   - `npm install recharts`
6. Start the app:
   - `npm run dev` (Vite) **or** `npm start` (Create React App)
7. Open the shown localhost URL (often `http://localhost:5173` or `http://localhost:3000`).

## About your “vision” and next steps
A practical non-technical flow is:
1. Launch in CodeSandbox first (visual confirmation).
2. Click **UPLOAD DATA** and test with your CSV exports.
3. Verify one club’s KPIs and intervention alerts against known numbers.
4. Share the sandbox URL with stakeholders for feedback.
5. After validation, ask a developer to wire this into your internal data pipeline and hosting.


## Resetting data
- Click **RESET DATA** in the header.
- Confirm the dialog.
- The dashboard restores the original built-in sample dataset and clears uploaded additions.
