// [MM] APPROACH: TS (future with APOLLO MUI)
// ========================================================

// react
import {
  useState,
  useEffect,
  useMemo,
  ReactElement,
  ReactNode,
  FunctionComponent,
  // JSXElementConstructor,
  // Key
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
import brandLight from "~/assets/images/logos/logo-threedgarden.png"
import brandDark from "~/assets/images/logos/logo-threedgarden-alt.png"
import brandText from "~/assets/images/logos/logo-threedgarden-text.png"

// dashboard components
import MDBox from "~/components/mui/MDBox"

// dashboard examples
import Sidenav from "~/components/elements/Sidenav"
import Configurator from "~/components/elements/Configurator"

// dashboard routes
import routes from "~/routes/routes"
// import pageRoutes from "~/routes/page.routes"
// const routes = pageRoutes

// custom app css
import "~/assets/demo/css/all.css"
import "~/assets/demo/css/jquery.minicolors.css"
import "~/assets/demo/css/style.css"

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
  getLayout?: (page: ReactElement) => ReactNode
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
// MAIN APP

// export default function MyApp(props: IAppPropsWithLayoutEmotion) { ???
const App: FunctionComponent<IAppPropsWithLayoutEmotion> = (props: AppPropsWithLayoutEmotion) => {
  // [MM] ooooo, very interesting (type|interface)

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

  const brandIcon = (transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandLight

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
        settings
      </Icon>
    </MDBox>
  )

  // ========================================================
  // RETURN TSX
  return (
    <ThemeProvider theme={darkMode ? themeDark : themeLight}>

      <CssBaseline />

      {/* PASS THE COMPONENT IN */}
      <Component {...pageProps} />

      {/* SHOW/HIDE SIDENAV */}
      {layout === "dashboard" && (
        <>
          {/* <Sidenav
            color={sidenavColor}
            brandLogo={brandIcon}
            brandName="ThreeD Garden"
            routes={routes}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          /> */}
          <Sidenav
            routes={routes}
            brandLogo={brandIcon}
            brandName="ThreeD Garden"
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
          <Configurator />
          {/* {configsButton} */}
        </>
      )}

      {layout === "vr" && (
        <Configurator />
      )}

    </ThemeProvider>
  )
}

// ========================================================
// WRAPPED APP
const WrappedApp: FunctionComponent<IAppPropsWithLayoutEmotion> = (props: AppPropsWithLayoutEmotion) => {
  // [MM] ooooo, very interesting (interface|type)

  // console.debug("%cThreeD Garden", "color: green; font-size: 16px;")
  // console.debug(`[MM] WrappedApp: ThreeDGarden @ ${new Date().toISOString()}`)

  const { Component, emotionCache = clientSideEmotionCache, pageProps, router } = props

  // console.debug(`[MM] WrappedApp: Component`, Component)
  // console.debug(`[MM] WrappedApp: emotionCache`, emotionCache)
  // console.debug(`[MM] WrappedApp: pageProps`, pageProps)
  // console.debug(`[MM] WrappedApp: router`, router)

  return (
    <MaterialUIControllerProvider>
      <CacheProvider value={emotionCache}>
        <Head>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
          <meta name="threed-garden" content="initial-scale=1, width=device-width" />
          <title>ThreeDGarden</title>
          {/* <link rel="manifest" href="/site.webmanifest" /> */}

          <link rel="icon" href={favicon.src} />
          <link rel="icon" type="image/png" sizes="32x32" href="favicon/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="favicon/favicon-16x16.png" />
          <link rel="apple-touch-icon" sizes="76x76" href={appleIcon.src} />
          <link rel="apple-touch-icon" sizes="76x76" href="favicon/apple-touch-icon.png" />
          <link rel="mask-icon" href="favicon/safari-pinned-tab.svg" color="#5bbad5" />
          <meta name="msapplication-TileColor" content="#da532c" />

          <meta name="description" content="Create house and garden plans in 2D and 3D" />
          <meta name="keywords"
            content="Architecture, Planning, 3D Plan, Home Ideas, Floor Plan, Garden Planning, 3D Design Ideas, Building Plan" />
          <meta name="author" content="Marty McGee" />
          <meta name="viewport" content="initial-scale=1, viewport-fit=cover" />

          <meta name="twitter:card" content="Create house and garden plans in 2D and 3D" />
          <meta name="twitter:site" content="@companyjuice" />
          <meta name="twitter:creator" content="@martymcgee" />

          <meta property="og:title" content="ThreeDGarden" />
          <meta property="og:type" content="website" />
          <meta property="og:description" content="Design house, landscape, garden plans in 2D + 3D" />
          <meta property="og:url" content="https://threedgarden.com" />
          <meta property="og:image" content="https://threedgarden.com/api/thumb3dview" />
          <meta property="og:image:width" content="600" />
          <meta property="og:image:height" content="337" />

        </Head>

        <App Component={Component} pageProps={pageProps} router={router} />
      </CacheProvider>
    </MaterialUIControllerProvider>
  )
}

export default WrappedApp

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

/* following this tutorial:
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
*/

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
  console.debug(`Loading: ${url}`)
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
    console.debug("Component", Component)

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
