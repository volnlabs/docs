import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import './globals.css'
import { BranchBanner, BranchSwitcher } from '../components/Branch'

export const metadata = {
  title: { default: 'volnlabs docs', template: '%s – volnlabs docs' },
  description: 'Documentation for axiomOS, rbpf and axiomos-sim'
}

export default async function RootLayout({ children }) {
  const pageMap = await getPageMap()
  const branchPages = Object.fromEntries(
    await Promise.all(
      ['main', 'v0.5-runtime', 'fpga-bringup', 'v0.5.0-alpha.3'].map(async b => [
        b,
        collectRoutes(await getPageMap(`/axiomos/${b}`))
      ])
    )
  )
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          banner={<BranchBanner />}
          navbar={
            <Navbar logo={<b>volnlabs</b>} projectLink="https://github.com/volnlabs">
              <BranchSwitcher pages={branchPages} />
            </Navbar>
          }
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/volnlabs/docs/tree/main"
          footer={<Footer>MIT {new Date().getFullYear()} © volnlabs</Footer>}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}

function collectRoutes(items: any[], out: string[] = []): string[] {
  for (const i of items) {
    if (i.route) out.push(i.route)
    if (i.children) collectRoutes(i.children, out)
  }
  return out
}
