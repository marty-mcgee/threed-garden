import { useState, useEffect } from "react"

// react-router components
// import { useLocation, Link } from "react-router-dom"
// nextjs components
import Link from "next/link"
import { useRouter, NextRouter } from "next/router"

// @material-ui core components
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import IconButton from "@mui/material/IconButton"
import Menu from "@mui/material/Menu"
import Icon from "@mui/material/Icon"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDInput from "~/components/MDInput"
import MDBadge from "~/components/MDBadge"

// ThreeD Garden examples components
import Breadcrumbs from "~/examples/Breadcrumbs"
import NotificationItem from "~/examples/Items/NotificationItem"

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
} from "~/examples/Navbars/DashboardNavbar/styles"

// ThreeD Garden context
import {
  useMaterialUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "~/context"

// Declaring prop types for DashboardNavbar
interface Props {
  absolute?: boolean
  light?: boolean
  isMini?: boolean
}

function DashboardNavbar({ absolute, light, isMini }: Props): JSX.Element {
  const [navbarType, setNavbarType] = useState<
    "fixed" | "absolute" | "relative" | "static" | "sticky"
  >()
  const [controller, dispatch] = useMaterialUIController()
  const {
    miniSidenav,
    transparentNavbar,
    fixedNavbar,
    openConfigurator,
    darkMode,
  } = controller
  const [openMenu, setOpenMenu] = useState<any>(false)
  // const route = useLocation().pathname.split("/").slice(1)
  const { pathname } = useRouter()
  const route = pathname.split("/").slice(1)

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky")
    } else {
      setNavbarType("static")
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(
        dispatch,
        (fixedNavbar && window.scrollY === 0) || !fixedNavbar
      )
    }

    /**
     The event listener that's calling the handleTransparentNavbar function when
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar)

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar()

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar)
  }, [dispatch, fixedNavbar])

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav)
  const handleConfiguratorOpen = () =>
    setOpenConfigurator(dispatch, !openConfigurator)
  const handleOpenMenu = (event: any) => setOpenMenu(event.currentTarget)
  const handleCloseMenu = () => setOpenMenu(false)

  // Render the notifications menu
  const renderMenu = () => (
    <Menu
      anchorEl={openMenu}
      anchorReference={null}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      open={Boolean(openMenu)}
      onClose={handleCloseMenu}
      sx={{ mt: 2 }}>
      <NotificationItem icon={<Icon>email</Icon>} title="Check new messages" />
      <NotificationItem
        icon={<Icon>podcasts</Icon>}
        title="Manage Podcast sessions"
      />
      <NotificationItem
        icon={<Icon>shopping_cart</Icon>}
        title="Payment successfully completed"
      />
    </Menu>
  )

  // Styles for the navbar icons
  const iconsStyle = ({
    palette: { dark, white, text },
    functions: { rgba },
  }: {
    palette: any
    functions: any
  }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main

      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main
      }

      return colorValue
    },
  })

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) =>
        navbar(theme, { transparentNavbar, absolute, light, darkMode })
      }>
      <Toolbar sx={navbarContainer}>
        <MDBox
          color="inherit"
          mb={{ xs: 1, md: 0 }}
          sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs
            icon="home"
            title={route[route.length - 1]}
            route={route}
            light={light}
          />
          <IconButton
            sx={navbarDesktopMenu}
            onClick={handleMiniSidenav}
            size="small"
            disableRipple>
            <Icon fontSize="medium" sx={iconsStyle}>
              {miniSidenav ? "menu_open" : "menu"}
            </Icon>
          </IconButton>
        </MDBox>
        {isMini ? null : (
          <MDBox sx={(theme) => navbarRow(theme, { isMini })}>
            <MDBox pr={1}>
              <MDInput label="Search here" />
            </MDBox>
            <MDBox color={light ? "white" : "inherit"}>
              <Link href="/authentication/sign-in/basic">
                <IconButton sx={navbarIconButton} size="small" disableRipple>
                  <Icon sx={iconsStyle}>account_circle</Icon>
                </IconButton>
              </Link>
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}>
                <Icon sx={iconsStyle} fontSize="medium">
                  {miniSidenav ? "menu_open" : "menu"}
                </Icon>
              </IconButton>
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                onClick={handleConfiguratorOpen}>
                <Icon sx={iconsStyle}>settings</Icon>
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={navbarIconButton}
                onClick={handleOpenMenu}>
                <MDBadge badgeContent={9} color="error" size="xs" circular>
                  <Icon sx={iconsStyle}>notifications</Icon>
                </MDBadge>
              </IconButton>
              {renderMenu()}
            </MDBox>
          </MDBox>
        )}
      </Toolbar>
    </AppBar>
  )
}

// Declaring default props for DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
}

export default DashboardNavbar
