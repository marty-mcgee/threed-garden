// react
import {
  useState,
  useEffect,
  useMemo,
  JSXElementConstructor,
  Key,
  ReactElement,
} from "react"

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom"

// @mui material components
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import Icon from "@mui/material/Icon"

// Company Juice Dashboard components
import MDBox from "components/MDBox"

// Company Juice Dashboard examples
import Sidenav from "examples/Sidenav"
import Configurator from "examples/Configurator"

// Company Juice Dashboard themes
import theme from "themes/theme-light"
import themeRTL from "themes/theme-light/theme-rtl"

// Company Juice Dashboard Dark Mode themes
import themeDark from "themes/theme-dark"
import themeDarkRTL from "themes/theme-dark/theme-rtl"

// RTL plugins
import rtlPlugin from "stylis-plugin-rtl"
import { CacheProvider } from "@emotion/react"
import createCache from "@emotion/cache"

// Company Juice Dashboard routes
import routes from "routes"

// Company Juice Dashboard contexts
import {
  useMaterialUIController,
  setMiniSidenav,
  setOpenConfigurator,
} from "context"

// Images
import brandWhite from "assets/images/logos/logo-threedgarden.png"
import brandDark from "assets/images/logos/logo-threedgarden-alt.png"

export default function App() {
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
  const { pathname } = useLocation()

  // Cache for the rtl
  useMemo(() => {
    const pluginRtl: any = rtlPlugin
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [pluginRtl],
    })

    setRtlCache(cacheRtl)
  }, [])

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false)
      setOnMouseEnter(true)
    }
  }

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true)
      setOnMouseEnter(false)
    }
  }

  // Change the openConfigurator state
  const handleConfiguratorOpen = () =>
    setOpenConfigurator(dispatch, !openConfigurator)

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction)
  }, [direction])

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0
    document.scrollingElement.scrollTop = 0
  }, [pathname])

  const getRoutes = (allRoutes: any[]): any =>
    allRoutes.map(
      (route: {
        collapse: any
        route: string
        component: ReactElement<any, string | JSXElementConstructor<any>>
        key: Key
      }) => {
        if (route.collapse) {
          return getRoutes(route.collapse)
        }

        if (route.route) {
          return (
            <Route
              path={route.route}
              element={route.component}
              key={route.key}
            />
          )
        }

        return null
      }
    )

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
      onClick={handleConfiguratorOpen}>
      <Icon fontSize="small" color="inherit">
        settings
      </Icon>
    </MDBox>
  )

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
        <CssBaseline />
        {layout === "dashboard" && (
          <>
            <Sidenav
              color={sidenavColor}
              brand={
                (transparentSidenav && !darkMode) || whiteSidenav
                  ? brandDark
                  : brandWhite
              }
              brandName="Company Juice"
              routes={routes}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
            />
            <Configurator />
            {configsButton}
          </>
        )}
        {layout === "vr" && <Configurator />}
        <Routes>
          {getRoutes(routes)}
          <Route path="*" element={<Navigate to="/dashboards/analytics" />} />
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      {layout === "dashboard" && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={
              (transparentSidenav && !darkMode) || whiteSidenav
                ? brandDark
                : brandWhite
            }
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
      <Routes>
        {getRoutes(routes)}
        <Route path="*" element={<Navigate to="/dashboards/analytics" />} />
      </Routes>
    </ThemeProvider>
  )
}
