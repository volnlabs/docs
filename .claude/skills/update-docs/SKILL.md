---
name: update-docs
description: Refresh the volnlabs docs site (Nextra 4, this repo) from the source projects it documents — axiomOS (per-branch trees), rbpf, and axiomos-sim. Use whenever the user asks to update, sync, refresh or regenerate the docs, says the docs are stale or behind the code, mentions new commits/merges in axiomOS, rbpf or axiomos-sim that should be reflected, or wants a new axiomOS branch added to the branch switcher.
---

# Update volnlabs docs

The site mirrors source repos into `content/`. Each docs tree records which source commit it was last synced to in `sources.json` (next to this file). An update = read what changed since that commit, rewrite only the affected pages, verify the build, advance the recorded commit.

Work incrementally from the diff. Regenerating whole trees throws away reviewed wording and costs far more; only rewrite pages whose subject actually changed.

## Docs tree ↔ source map

| Docs tree | Source | Notes |
|---|---|---|
| `content/axiomos/<slug>/` | axiomOS branch (see `sources.json`) | One full tree per branch. Non-main trees have `changes-from-main.mdx`. |
| `content/rbpf/` | rbpf `main` | |
| `content/axiomos-sim/` | axiomos-sim (repo `voln-vp`) `main` | Some pages document unmerged branches and say so in a Callout. |

Repo paths and GitHub slugs for source links live in `sources.json`.

## Workflow

### 1. See what changed

```sh
python3 .claude/skills/update-docs/changes.py --fetch          # all trees
python3 .claude/skills/update-docs/changes.py axiomos/main     # one tree
```

It fetches `origin` (read-only for the user's checkouts) and prints commits + diffstat from the synced commit to the branch head. Trees marked "up to date" need nothing. If everything is up to date, tell the user and stop.

Never checkout, pull or modify the source repos — they are the user's working checkouts. Read with `git -C <repo> show <ref>:<path>`, `git diff <synced>..<ref> -- <path>`, `git ls-tree`.

### 2. Map changes to pages

For each changed tree, decide which pages cover the changed files. Pages start with a "Relevant source files" list linking to GitHub paths, so `grep -rl '<changed/path>' content/<tree>` finds most of them. Changes with no matching page (a new subsystem, new crate, new board) need a new page plus a `_meta.ts` entry.

Also check:
- **axiomOS `main` changed** → non-main branch trees copied from main may share the fix. Only touch them if that branch also contains the commit (`git merge-base --is-ancestor <sha> <branch-ref>`), and update its `changes-from-main.mdx` if the delta vs main shifted.
- **Branch merged into main** → tell the user; ask whether to drop that branch tree (remove the folder, its `_meta.ts` entry, the `BRANCHES` row in `components/Branch.tsx`, and the slug list in `app/layout.tsx`).
- **README/docs contradict code** → follow the code and say so on the page; the existing docs do this deliberately.

### 3. Edit pages

For more than a couple of trees, spawn one subagent per tree in parallel. Give each: the tree dir (write only there), source repo + ref, the synced..head range, the page list from step 2, and the conventions below. Tell them **not** to run `next build` — parallel builds share `.next/` and corrupt each other. They validate MDX with:

```sh
node -e "const {compile}=require('@mdx-js/mdx');const fs=require('fs');for(const f of process.argv.slice(1)){compile(fs.readFileSync(f,'utf8')).catch(e=>console.log(f,e.message))}" $(find content/<tree> -name '*.mdx')
```

#### Page conventions

- First line `# Title` (after imports). Then **Relevant source files**: bullet links to `https://github.com/<github>/blob/<branch>/<path>`. Use the tree's own branch in links, never `main` for a branch tree.
- Imports at top: `import { Callout, Steps, Tabs, Cards } from 'nextra/components'` — only what's used.
- Internal links absolute: `/axiomos/<slug>/...`, `/rbpf/...`, `/axiomos-sim/...`.
- Every folder has `_meta.ts` (`export default { slug: 'Title' }`) ordering its pages, and an `index.mdx` (a folder without one makes a 404 link in the sidebar).
- MDX: escape `<`, `{`, `}` in prose (wrap in backticks); no HTML comments; generics only inside code.
- Mermaid via ```` ```mermaid ```` for flows/architecture.
- Callouts sparingly — real caveats only (`warning`/`info`). The site already has many.
- Factual only. State unverified numbers as "from <doc>, not re-run".

### 4. Verify (main session, once)

```sh
rm -rf .next && npm run build      # also builds the Pagefind index
```

Then crawl internal links on the production server:

```sh
(npx next start -p 3125 > /tmp/next-start.log 2>&1 &); until curl -s localhost:3125 >/dev/null; do sleep 1; done
find .next/server/app -name '*.html' | xargs grep -ohE 'href="/(axiomos|rbpf|axiomos-sim)[^"#?]*"' | sort -u | sed 's/href="//;s/"$//' \
  | while read l; do c=$(curl -s -o /dev/null -w '%{http_code}' "localhost:3125$l"); [ "$c" != 200 ] && echo "BROKEN $c $l"; done
```

`/` and `/axiomos` answer 307 (redirect to `/axiomos/main`) — expected. Fix anything else. Stop the server by port (`ss -ltnpH 'sport = :3125'` → kill the pid); `pkill -f next…` matches your own shell command line and kills it.

### 5. Record and commit

For each tree you brought up to date:

```sh
python3 .claude/skills/update-docs/changes.py --mark <tree> <head-sha>
```

Commit on a branch (not `main`) with `sources.json` included, e.g. `docs: sync axiomos/main to b8953b5`. Push / open a PR only when the user asks.

## Adding a new axiomOS branch

1. `cp -r content/axiomos/main content/axiomos/<slug>`; rewrite `/axiomos/main/` → `/axiomos/<slug>/` and `blob/main/` → `blob/<branch>/` inside it.
2. `content/axiomos/_meta.ts`: add `'<slug>': { type: 'page', title: '<branch>' }` (no `display: 'hidden'` — it breaks the page map).
3. `components/Branch.tsx` `BRANCHES` row + slug in the list in `app/layout.tsx`.
4. Rewrite pages for the branch's diff vs main (`git diff main...<branch>`) and write `changes-from-main.mdx`. A branch can be *behind* main (check `git rev-list --count <branch>..main`) — then roll pages back, not forward.
5. Add an entry to `sources.json` with `synced` = branch head after the docs are done.

## Known gotchas

- `zod` is pinned to 4.1.12 in `package.json` `overrides`: newer zod makes every page 500 under Nextra 4.6.1 ("expected nonoptional ... at children"). Don't remove it when bumping deps unless Nextra is bumped too.
- Theme utility classes (`x:...`) only exist if Nextra's own CSS uses them; custom styling goes in `app/globals.css`.
