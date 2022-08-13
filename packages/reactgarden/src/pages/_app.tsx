// following this tutorial:
// https://dev.to/hajhosein/nextjs-mui-v5-typescript-tutorial-and-starter-3pab

import React from 'react'
// import PropTypes from 'prop-types'
import Head from "next/head"
import { AppProps } from "next/app"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { CacheProvider, EmotionCache } from "@emotion/react"
import theme from "themes/theme-dark"
import createEmotionCache from "themes/createEmotionCache"

// Material UI Context Provider
import { MaterialUIControllerProvider } from "context"

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

// NOTE: THROWS ERROR if using .babelrc
// "Syntax error: Unexpected reserved word 'interface'."
interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

// export default function MyApp(props: MyAppProps) {
const MyApp: React.FunctionComponent<MyAppProps> = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  return (
    <CacheProvider value={emotionCache}>
      <MaterialUIControllerProvider>
        <Head>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
        </Head>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </MaterialUIControllerProvider>
    </CacheProvider>
  )
}

export default MyApp

// MyApp.propTypes = {
//   Component: PropTypes.elementType.isRequired,
//   emotionCache: PropTypes.object,
//   pageProps: PropTypes.object.isRequired,
// }

/* WORKING
import { AppProps } from 'next/app'
import '../styles/index.css'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
*/

/* OLD
import React from "react"
import ReactDOM from "react-dom"
import App from "next/app"
import Head from "next/head"
import Router from "next/router"

import PageChange from "components/PageChange/PageChange.js"

import "assets/css/nextjs-material-dashboard.css?v=1.1.0"

Router.events.on("routeChangeStart", (url) => {
  console.log(`Loading: ${url}`)
  document.body.classList.add("body-page-transition")
  ReactDOM.render(
    <PageChange path={url} />,
    document.getElementById("page-transition")
  )
})
Router.events.on("routeChangeComplete", () => {
  ReactDOM.unmountComponentAtNode(document.getElementById("page-transition"))
  document.body.classList.remove("body-page-transition")
})
Router.events.on("routeChangeError", () => {
  ReactDOM.unmountComponentAtNode(document.getElementById("page-transition"))
  document.body.classList.remove("body-page-transition")
})

export default class MyApp extends App {
  componentDidMount() {
    const comment = document.createComment(`HEY HEY HEY`)
    document.insertBefore(comment, document.documentElement)
  }

  static async getInitialProps({ Component, router, ctx }) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    return { pageProps }
  }

  render() {
    const { Component, pageProps } = this.props
    console.log("Component", Component)

    const Layout = Component.layout || (({ children }) => <>({children})</>)

    return (
      <>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, shrink-to-fit=no"
          />
          <title>React Garden</title>
          <script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}`} />
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </>
    )
  }
}
*/
