# volnlabs docs

Docs for [axiomOS](https://github.com/pro-utkarshM/axiomOS), [rbpf](https://github.com/volnlabs/rbpf) and [axiomos-sim](https://github.com/volnlabs/voln-vp). Built with [Nextra 4](https://nextra.site).

```sh
npm install
npm run dev     # http://localhost:3000 → /axiomos/main
npm run build   # also builds the Pagefind search index
```

## Layout

- `content/axiomos/<branch>/` — one docs tree per axiomOS branch (`main`, `v0.5-runtime`, `fpga-bringup`, `v0.5.0-alpha.3`)
- `content/rbpf/`, `content/axiomos-sim/` — single-version docs
- `components/Branch.tsx` — navbar branch switcher + non-main banner

## Adding an axiomOS branch

1. `cp -r content/axiomos/main content/axiomos/<slug>` and rewrite `/axiomos/main/` links to `/axiomos/<slug>/`.
2. Add `<slug>: { type: 'page', title: '<git ref>' }` to `content/axiomos/_meta.ts`.
3. Add a row to `BRANCHES` in `components/Branch.tsx` and the slug to the list in `app/layout.tsx`.
4. Add a `changes-from-main.mdx` page.

`zod` is pinned to 4.1.12 via `overrides`: zod 4.6 breaks Nextra 4.6.1's layout prop validation.
