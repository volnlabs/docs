import nextra from 'nextra'

const withNextra = nextra({
  contentDirBasePath: '/',
  defaultShowCopyCode: true
})

export default withNextra({
  async redirects() {
    return [
      { source: '/', destination: '/axiomos/main', permanent: false },
      { source: '/axiomos', destination: '/axiomos/main', permanent: false }
    ]
  }
})
