// [MM] APPROACH: TS ( future with APOLLO MUI/CHAKRA)
// ========================================================

// react
import React, {
  useState,
  useEffect,
  useMemo,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  FunctionComponent
} from "react"

// old way. new way: do with TS interfaces
// import PropTypes from "prop-types"

// react-router components
// import { Routes, Route, Navigate, useLocation } from "react-router-dom"

// nextjs
import type { NextPage } from "next"
import type { AppProps } from "next/app"
// import { AppProps } from "next/app"
import Head from "next/head"
import { useRouter, withRouter, NextRouter } from "next/router"

// theme: mui
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import Icon from "@mui/material/Icon"
// theme: mui: Material UI Context Provider
import {
  MaterialUIControllerProvider,
  useMaterialUIController,
  setMiniSidenav,
  setOpenConfigurator,
} from "~/context"
// theme: mui: emotion cache
import { CacheProvider, EmotionCache } from "@emotion/react"
import createEmotionCache from "~/themes/common/createEmotionCache"
import createCache from "@emotion/cache"
// theme: mui: custom
import themeLight from "~/themes/theme-light"
import themeLightRTL from "~/themes/theme-light/theme-rtl"
import themeDark from "~/themes/theme-dark"
import themeDarkRTL from "~/themes/theme-dark/theme-rtl"
import rtlPlugin from "stylis-plugin-rtl"

// @fullcalendar styles (NOT HERE)
// import "@fullcalendar/common/main.css"
// import "@fullcalendar/daygrid/main.css"
// import "@fullcalendar/timegrid/main.css"

// images
import favicon from "~/assets/images/logos/favicon.png"
import appleIcon from "~/assets/images/logos/apple-icon.png"
import brandWhite from "~/assets/images/logos/logo-threedgarden.png"
import brandDark from "~/assets/images/logos/logo-threedgarden-alt.png"

// dashboard components
import MDBox from "~/components/mui/MDBox"

// dashboard examples
import Sidenav from "~/components/elements/Sidenav"
import Configurator from "~/components/elements/Configurator"

// dashboard routes
import routes from "~/routes/routes"

// theme: chakra
// import { ChakraProvider } from "@chakra-ui/react"

// api: apollo: graphql
// import { ApolloProvider } from "@apollo/client"
// import { useApollo } from "~/lib/apollo/client"

// ========================================================

// client-side cache, shared for the whole session of the user in the browser
const clientSideEmotionCache = createEmotionCache() // using insertionPoint
// const clientSideEmotionCache = createCache({ key: "css", prepend: true })

// ========================================================
// TS

interface WithRouterProps {
  router: NextRouter
}
interface MyComponentProps extends WithRouterProps { }

type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactNode
}

type AppPropsWithLayoutEmotion = AppProps & {
  Component: NextPageWithLayout,
  emotionCache?: EmotionCache,
  router: NextRouter
}
// OR !!!
interface IAppPropsWithLayoutEmotion extends AppProps {
  Component: NextPageWithLayout,
  emotionCache?: EmotionCache
}
// NOTE: ^throws error if using .babelrc
// "Syntax error: Unexpected reserved word 'interface'."

// ========================================================
// MAIN

// export default function MyApp(props: IAppPropsWithLayoutEmotion) { ???
const Main: React.FunctionComponent<IAppPropsWithLayoutEmotion> = (props: AppPropsWithLayoutEmotion) => { // [MM] ooooo, very interesting (type|interface)

  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props

  const [controller, dispatch] = useMaterialUIController()
  const {
    miniSidenav,
    direction,
    layout,
    openConfigurator,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
  } = controller
  const [onMouseEnter, setOnMouseEnter] = useState(false)
  const [rtlCache, setRtlCache] = useState(null)
  const { pathname } = useRouter()

  // ========================================================
  // useMemo

  // cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    })
    setRtlCache(cacheRtl)
  }, [])

  // ========================================================
  // event handlers

  // open sidenav when mouse enter on mini sidenav?
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false)
      setOnMouseEnter(true)
    }
  }

  // close sidenav when mouse leave mini sidenav?
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true)
      setOnMouseEnter(false)
    }
  }

  // change the openConfigurator state
  const handleConfiguratorOpen = () =>
    setOpenConfigurator(dispatch, !openConfigurator)

  // ========================================================
  // useEffect

  // setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction])

  // setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname])

  // ========================================================
  // components

  const brandIcon =
    (transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite

  const configsButton = (
    <MDBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.25rem"
      height="3.25rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="small" color="inherit">
        Settings
      </Icon>
    </MDBox>
  )

  // ========================================================
  // RETURN TSX
  return (
    <ThemeProvider theme={darkMode ? themeDark : themeLight}>
      <CssBaseline />
      <Component {...pageProps} />
      {layout === "dashboard" && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={brandIcon}
            brandName="ThreeD Garden"
            routes={routes}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
          <Configurator />
          {configsButton}
        </>
      )}
      {layout === "vr" && <Configurator />}
    </ThemeProvider>
  )
}

// ========================================================
// APP
const MyApp: React.FunctionComponent<IAppPropsWithLayoutEmotion> = (props: AppPropsWithLayoutEmotion) => { // [MM] ooooo, very interesting (type|interface)

  console.log(`[MM] MyApp: ThreeDGarden @ ${new Date().toISOString()}`)

  const { Component, emotionCache = clientSideEmotionCache, pageProps, router } = props

  return (
    <MaterialUIControllerProvider>
      <CacheProvider value={emotionCache}>
        <Head>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
          <meta name="threed-garden" content="initial-scale=1, width=device-width" />
          <link rel="icon" href={favicon.src} />
          <link rel="apple-touch-icon" sizes="76x76" href={appleIcon.src} />
          <title>ThreeD Garden</title>
        </Head>
        <Main Component={Component} pageProps={pageProps} router={router} />
      </CacheProvider>
    </MaterialUIControllerProvider>
  )
}

export default MyApp

/* EXAMPLE -- TARGET APPROACH with APOLLO + CHAKRA and TYPES
// https://stackoverflow.com/questions/73340415/react-component-cannot-be-used-as-a-jsx-component

import * as React from "react"
import Head from "next/head"
import type { NextPage } from "next"
import type { AppProps } from "next/app"

import { theme } from "@boilerplate/theme"
import { ChakraProvider } from "@chakra-ui/react"

import { ApolloProvider } from "@apollo/client"
import { useApollo } from "~/lib/apollo/client"

type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function BoilerplateApp(props: AppPropsWithLayout) {
  const { Component, pageProps } = props
  const apolloClient = useApollo(pageProps.initialApolloState)
  const getLayout = Component.getLayout ?? ((page) => page)

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <ChakraProvider theme={theme}>
        <ApolloProvider client={apolloClient}>{getLayout(<Component {...pageProps} />)}</ApolloProvider>
      </ChakraProvider>

    </>
  )
}
*/

// following this tutorial:
// https://dev.to/hajhosein/nextjs-mui-v5-typescript-tutorial-and-starter-3pab

// import React from 'react'
// // import PropTypes from 'prop-types'
// import Head from "next/head"
// import { AppProps } from "next/app"
// import { ThemeProvider } from "@mui/material/styles"
// import CssBaseline from "@mui/material/CssBaseline"
// import { CacheProvider, EmotionCache } from "@emotion/react"
// import theme from "~/themes/theme-dark"
// import createEmotionCache from "~/themes/createEmotionCache"

// // Material UI Context Provider
// import { MaterialUIControllerProvider } from "~/context"

// // Client-side cache, shared for the whole session of the user in the browser.
// const clientSideEmotionCache = createEmotionCache()

// // NOTE: THROWS ERROR if using .babelrc
// // "Syntax error: Unexpected reserved word 'interface'."
// interface IAppPropsWithEmotion extends AppProps {
//   emotionCache?: EmotionCache
// }

// // export default function MyApp(props: IAppPropsWithEmotion) {
// const MyApp: React.FunctionComponent<IAppPropsWithEmotion> = (props) => {
//   const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
//   return (
//     <CacheProvider value={emotionCache}>
//       <MaterialUIControllerProvider>
//         <Head>
//           <meta name="viewport" content="initial-scale=1, width=device-width" />
//         </Head>
//         <ThemeProvider theme={theme}>
//           {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
//           <CssBaseline />
//           <Component {...pageProps} />
//         </ThemeProvider>
//       </MaterialUIControllerProvider>
//     </CacheProvider>
//   )
// }

// export default MyApp

// MyApp.propTypes = {
//   Component: PropTypes.elementType.isRequired,
//   emotionCache: PropTypes.object,
//   pageProps: PropTypes.object.isRequired,
// }


/* WORKING APPROACH (DEFAULT)
import { AppProps } from 'next/app'
import '../styles/index.css'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
*/

/* OLD NEXT 10 APPROACH
import React from "react"
import ReactDOM from "react-dom"
import App from "next/app"
import Head from "next/head"
import Router from "next/router"

import PageChange from "~/components/PageChange/PageChange.js"

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
