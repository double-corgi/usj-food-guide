# Codex Repository Rules

## Design Rules

- Treat `USJ_FOOD_GUIDE_DESIGN.md` as the primary design source of truth for the USJ food guide UI.
- If `USJ_FOOD_GUIDE_DESIGN.md` and `DESIGN.md` conflict, prefer `USJ_FOOD_GUIDE_DESIGN.md`.
- Do not change UI implementation unless the user explicitly asks for implementation work; design-document updates alone should not trigger UI changes.

## Development Server

- Do not stop the `localhost:3000` development server started with `npm run dev`.
- Do not run `kill`, `pkill`, `killall node`, or stop the dev server through `lsof`-based PID lookup and kill commands.
- Do not restart the dev server when an existing `localhost:3000` server is already responding; reuse the existing process.
- After verification, keep the `localhost:3000` dev server running and available.
- At the end of work, confirm `http://localhost:3000/` returns 200 OK.
- Allowed verification work includes localhost checks, screenshots, mobile checks, `npm run lint`, `npm run build`, and `npm run typecheck`.
- If `localhost:3000` is not responding, start it with `npm run dev` and leave it running.
