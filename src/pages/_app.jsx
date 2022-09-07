import { useEffect } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { setState } from '~/stores/store'
import Header from '~/components/seo/config'
import Dom from '~/components/layout/dom'
import '~/styles/index.css'
import '~/styles/globals.css'
import '~/styles/threed.css'
import '~/styles/annotations.css'

// ==============================================================
// CUSTOM IMPORT (SSR true|false)
const LCanvas = dynamic(() => import('~/components/layout/canvas'), {
  ssr: true,
})

// ==============================================================
// NEXT APP
const App = ({ Component, pageProps = { title: 'index' } }) => {
  const router = useRouter()

  useEffect(() => {
    setState({ router })
  }, [router])

  return (
    <>
      <Header title={pageProps.title} />
      <Dom>
        <Component {...pageProps} />
      </Dom>
      {Component?.r3f && <LCanvas>{Component.r3f(pageProps)}</LCanvas>}
    </>
  )
}

export default App
