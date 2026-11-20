<div align="center">
  <img src="static/assets/iterverse/mark.svg" width="96px" height="96px" alt="Iterverse Terminal logo" />
</div>

<h1 align="center">Iterverse Terminal</h1>

<h3 align="center">
  Browser-based command line labs for Bridgerland Technical College
</h3>

Live at [terminal.iterverse.net](https://terminal.iterverse.net). Each lab runs a
Linux shell inside the [v86](https://github.com/copy/v86) x86 emulator
(WebAssembly) in the browser, so students need nothing installed and cannot
damage anything. Adapted from [sandbox.bio](https://sandbox.bio) (MIT
licensed). `URL_ASSETS` in `src/config.js` still points at `assets.sandbox.bio`.

It's part of **Iterverse**, BTECH IT's umbrella platform alongside
[Library](https://github.com/cuaquero/iterverse_library),
[Reps](https://github.com/cuaquero/iterverse_reps),
[Labs](https://github.com/cuaquero/iterverse_labs),
[Hub](https://github.com/cuaquero/iterverse_hub) (the shared roster/
entitlement service this repo depends on),
[Simulations](https://github.com/cuaquero/iterverse_simulations),
[Packets](https://github.com/cuaquero/iterverse_packets),
[Scripts](https://github.com/cuaquero/iterverse_scripts),
[HelpDesk](https://github.com/cuaquero/iterverse_helpdesk),
[Type](https://github.com/cuaquero/iterverse_type), and
[Scheduler](https://github.com/cuaquero/iterverse_scheduler). See the Labs
repo's `design-system/` for the shared brand tokens and Iterverse mark
every product draws from.

## Labs

| Lab | Folder |
| --- | --- |
| Terminal Basics | `src/content/terminal-basics` |
| Terminal Exercises | `src/content/carpentries-shell-novice` |
| Sandbox terminal | `src/content/playground` (route `/tutorials/playground`) |

Labs can also be authored in the browser at `/admin` (see "Access and admin"
below). Those are stored in D1 and merged into the home page list at runtime.

## Access and admin

Students sign in through Cloudflare Access (one-time PIN) at `/auth/access`.
The route verifies the Access JWT (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`), then
asks Hub's `POST /api/entitlement/check` (`ROSTER_API_URL`, bearer
`ROSTER_SERVICE_KEY`) whether the email is entitled to product `cli`. That is a
per-course grant in Hub: only students enrolled in a course with the
CLI product granted get in, and Hub admin emails are always entitled.
A successful check creates a 12-hour session cookie (`cli_session`) stored in
the `SESSIONS` KV namespace. `src/hooks.server.js` redirects any request without
a session to `/auth/access`, except `/auth/access`, `/no-access` and `/admin`.
A failed or errored entitlement check (including a wrong `ROSTER_SERVICE_KEY`)
shows `/no-access`, not an error. Files under `static/` are served by the
asset layer without running the hook.

`/admin` is for staff and uses a separate Access Application
(`ACCESS_AUD_ADMIN`), not the student roster gate. It manages labs and steps in
the `LABS_DB` D1 database (`migrations/0001_labs.sql`); the student-facing read
is `GET /api/labs`, behind the normal session gate. Admin-authored steps
support Markdown plus `<Alert>`, `<Execute>` and `<Link>`; `<Quiz>`, `<Image>`
and `<Exercise>` work only in code-based labs.

## Local development

```bash
git clone https://github.com/cuaquero/iterverse_terminal.git
cd iterverse_terminal
./bin/setup.sh
```

`setup.sh` writes a `.env` with `PUBLIC_USE_PRD_ASSETS=true`, runs
`bin/build.sh` (copies each lab's `data/` into `static/data/`), runs
`npm install`, and starts `npm run dev`. Plain `vite dev` has no Worker
runtime, so the session gate is skipped locally; test Access and entitlement
with `wrangler dev` or a deployed Worker.

Scripts: `npm run build` (runs `bin/build.sh`, then `vite build`),
`npm test` (Playwright, checks that the installed command-line tools run;
needs `npm run build` first and the v86 assets), `npm run test:unit` (Vitest).
The GitHub Actions workflow in `.github/workflows/tests.yml` has no push
triggers, so tests do not run automatically.

## Deployment

A single Cloudflare Worker named `iterverse-cli` (`wrangler.toml`), built with
`@sveltejs/adapter-cloudflare` and served on the custom domain
`terminal.iterverse.net`. Deploy with `npm run build` then `npx wrangler
deploy`. Bindings: `LABS_DB` (D1 `iterverse-cli-labs`), `SESSIONS` (KV),
`ASSETS`. Secret: `ROSTER_SERVICE_KEY`, which must equal Hub's `SERVICE_KEY`
(redeploying is not needed for a Worker secret change). Apply D1 schema changes
with `npx wrangler d1 migrations apply iterverse-cli-labs --remote`.
`RENAME-PLAN.md` records the move from `cli.iterverse.net`.

## Adding a lab

1. Copy the template:

   ```bash
   LAB_ID=my-new-lab
   cp -r ./src/content/_template "./src/content/$LAB_ID"
   ```

2. Edit `src/content/$LAB_ID/config.js`: set `id` to `$LAB_ID`, plus `name`, `description`, `tools`, `difficulty`, and the `steps` array.
3. Write one Markdown file per step in `steps/`. Any data files go in `data/` and get listed in `files`.
4. Register the lab in `src/stores/tutorials.js`: import its config, then add it to both `staticTutorials` and `staticLabs`.
5. `./bin/build.sh` to copy the new `data/` files into `static/`, then `npm run dev`.

### Step Markdown

Steps are Markdown with Svelte components available:

- `<Execute command={"ls -l"} />`: a button that pastes and runs a command in the student's terminal.
- `<Exercise criteria={[...]} hints={[...]} />`: checked criteria with progressive hints.
- `<Quiz ... />`: multiple choice (radio if one answer, checkboxes if several).
- `> text`: an emphasized callout box.

`tools` lists the command-line binaries the lab needs; they are fetched at load time, so only list what the lab actually uses.
