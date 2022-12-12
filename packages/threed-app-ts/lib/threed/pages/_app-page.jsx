import { useEffect } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { setState } from '#/lib/threed/stores/store'
import Header from '#/ui/components/head'
import Dom from '#/ui/components/dom'
// import '~/styles/index.css'

// ==============================================================
// CUSTOM IMPORT (SSR true|false)
const LCanvas = dynamic(() => import('#/lib/threed/components/canvas/canvas'), {
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
