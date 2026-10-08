'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

// ponytail: branch list lives here; add a row when a new axiomOS branch gets docs
export const BRANCHES = [
  { slug: 'main', ref: 'main', label: 'main (stable)' },
  { slug: 'v0.5-runtime', ref: 'feat/v0.5-runtime', label: 'feat/v0.5-runtime' },
  { slug: 'fpga-bringup', ref: 'feat/fpga-bringup', label: 'feat/fpga-bringup' },
  { slug: 'v0.5.0-alpha.3', ref: 'release/v0.5.0-alpha.3', label: 'release/v0.5.0-alpha.3' }
]

function current(pathname: string) {
  const m = pathname.match(/^\/axiomos\/([^/]+)(\/.*)?$/)
  return m ? { slug: m[1], rest: m[2] ?? '' } : null
}

export function BranchSwitcher({ pages }: { pages: Record<string, string[]> }) {
  const pathname = usePathname()
  const router = useRouter()
  const cur = current(pathname)
  if (!cur) return null
  return (
    <select
      aria-label="axiomOS branch"
      value={cur.slug}
      onChange={e => {
        const target = `/axiomos/${e.target.value}${cur.rest}`
        // same page on other branch if it exists, else branch root
        router.push(pages[e.target.value]?.includes(target) ? target : `/axiomos/${e.target.value}`)
      }}
      className="branch-switcher"
    >
      {BRANCHES.map(b => (
        <option key={b.slug} value={b.slug}>
          {b.label}
        </option>
      ))}
    </select>
  )
}

export function BranchBanner() {
  const cur = current(usePathname())
  if (!cur || cur.slug === 'main') return null
  const b = BRANCHES.find(b => b.slug === cur.slug)
  return (
    <div style={{ padding: '6px 16px', textAlign: 'center', fontSize: 14, background: 'rgba(234,179,8,.15)' }}>
      Viewing <code>{b?.ref ?? cur.slug}</code> docs — not the stable branch.{' '}
      <Link href={`/axiomos/${cur.slug}/changes-from-main`} style={{ textDecoration: 'underline' }}>
        Changes vs main
      </Link>{' · '}
      <Link href="/axiomos/main" style={{ textDecoration: 'underline' }}>
        Go to main
      </Link>
    </div>
  )
}
