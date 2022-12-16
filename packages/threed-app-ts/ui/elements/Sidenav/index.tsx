import { useEffect, useState, ReactNode } from 'react'

// nextjs components
// import { useLocation, NavLink } from "react-router-dom"
import { useRouter } from 'next/navigation'
import NextLink from "next/link"
// import NextLink from '#/lib/utils/NextLink'

// @mui material components
import MuiLink from '@mui/material/Link'
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// Custom styles for the Sidenav
import SidenavCollapse from '#/ui/elements/Sidenav/SidenavCollapse'
import SidenavItem from '#/ui/elements/Sidenav/SidenavItem'
import SidenavList from '#/ui/elements/Sidenav/SidenavList'
import SidenavRoot from '#/ui/elements/Sidenav/SidenavRoot'
import sidenavLogoLabel from '#/ui/elements/Sidenav/styles/sidenav'

// Custom styles for DashboardNavbar
// import {
//   navbar,
//   navbarContainer,
//   navbarRow,
//   navbarIconButton,
//   navbarDesktopMenu,
//   navbarMobileMenu,
// } from "~/components/elements/Navbars/DashboardNavbar/styles"

// ThreeD Garden context
import { useMaterialUIController, setMiniSidenav, setTransparentSidenav, setWhiteSidenav } from '#/ui/context'

import { StaticImageData } from 'next/image'
// type StaticImageData = {
//   src: string
//   height: number
//   width: number
//   blurDataURL?: string
// }

// Declaring props types for Sidenav
interface Props {
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'dark'
  brandLogo?: string | StaticImageData
  brandName: string
  light?: boolean
  routes: {
    [key: string]:
      | ReactNode
      | string
      | {
          [key: string]:
            | ReactNode
            | string
            | {
                [key: string]: ReactNode | string
              }[]
        }[]
  }[]
  [key: string]: any
}

function Sidenav({ color, brandLogo, brandName, light, routes, ...rest }: Props): JSX.Element {
  const [openCollapse, setOpenCollapse] = useState<boolean | string>(false)
  const [openNestedCollapse, setOpenNestedCollapse] = useState<boolean | string>(false)
  const [controller, dispatch] = useMaterialUIController()
  const { miniSidenav, transparentSidenav, transparentNavbar, whiteSidenav, darkMode } = controller
  // const route = useLocation()
  const route = useRouter()
  const { pathname } = route
  const collapseName = pathname.split('/').slice(1)[0]
  const items = pathname.split('/').slice(1)
  const itemParentName = items[1]
  const itemName = items[items.length - 1]

  let textColor:
    | 'primary'
    | 'secondary'
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'dark'
    | 'white'
    | 'inherit'
    | 'text'
    | 'light' = 'white'

  if (transparentSidenav || (whiteSidenav && !darkMode)) {
    textColor = 'dark'
  } else if (whiteSidenav && darkMode) {
    textColor = 'inherit'
  }

  // ===============================================================
  // [MM] HEY HEY HEY -- VERY IMPORTANT SECTION HERE

  // [MM] SIMPLE CLOSE SIDENAV / COLLAPSE
  const closeSidenav = () => setMiniSidenav(dispatch, true)

  // [MM] migrated from DashboardNavbar
  const hamburgerMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav)

  // [MM] BEGIN COMPONENTDIDMOUNT HOOK -- A BIG ONE
  useEffect(() => {
    setOpenCollapse(collapseName)
    setOpenNestedCollapse(itemParentName)
  }, [])

  // [MM] HEY HEY HEY -- ANOTHER BIG ONE 333
  useEffect(() => {
    // A function that sets the mini state of the sidenav.
    function handleMiniSidenav() {
      setMiniSidenav(dispatch, window.innerWidth < 333)
      setTransparentSidenav(dispatch, window.innerWidth < 333 ? false : transparentSidenav)
      setWhiteSidenav(dispatch, window.innerWidth < 333 ? false : whiteSidenav)
    }

    /**
     The event listener that's calling the handleMiniSidenav function when resizing the window.
    */
    window.addEventListener('resize', handleMiniSidenav)

    // Call the handleMiniSidenav function to set the state with the initial value.
    handleMiniSidenav()

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleMiniSidenav)
  }, [dispatch, route])

  // Render all the nested collapse items from the routes.js
  const renderNestedCollapse = (collapse: any) => {
    const template = collapse.map(({ name, route, key, href }: any) =>
      href ? (
        <MuiLink
          key={key}
          href={href}
          target='_blank'
          rel='noreferrer'
          sx={{ textDecoration: 'none' }}
        >
          <SidenavItem
            name={name}
            nested
          />
        </MuiLink>
      ) : (
        <NextLink
          href={route}
          key={key}
          style={{ textDecoration: 'none' }}
        >
          <SidenavItem
            name={name}
            active={route === pathname}
            nested
          />
        </NextLink>
      )
    )

    return template
  }
  // Render the all the collpases from the routes.js
  const renderCollapse = (collapses: any) =>
    collapses.map(({ name, collapse, route, href, key }: any) => {
      let returnValue

      if (collapse) {
        returnValue = (
          <SidenavItem
            key={key}
            color={color}
            name={name}
            active={key === itemParentName ? 'isParent' : false}
            open={openNestedCollapse === key}
            onClick={({ currentTarget }: any) =>
              openNestedCollapse === key && currentTarget.classList.contains('MuiListItem-root')
                ? setOpenNestedCollapse(false)
                : setOpenNestedCollapse(key)
            }
          >
            {renderNestedCollapse(collapse)}
          </SidenavItem>
        )
      } else {
        returnValue = href ? (
          <MuiLink
            href={href}
            key={key}
            target='_blank'
            rel='noreferrer'
            sx={{ textDecoration: 'none' }}
          >
            <SidenavItem
              color={color}
              name={name}
              active={key === itemName}
            />
          </MuiLink>
        ) : (
          <NextLink
            href={route}
            key={key}
            style={{ textDecoration: 'none' }}
          >
            <SidenavItem
              color={color}
              name={name}
              active={key === itemName}
            />
          </NextLink>
        )
      }
      return <SidenavList key={key}>{returnValue}</SidenavList>
    })

  // Render all the routes from the routes.js (All the visible items on the Sidenav)
  const renderRoutes = routes.map(({ type, name, icon, title, collapse, noCollapse, key, href, route }: any) => {
    let returnValue

    if (type === 'collapse') {
      if (href) {
        returnValue = (
          <MuiLink
            href={href}
            key={key}
            target='_blank'
            rel='noreferrer'
            sx={{ textDecoration: 'none' }}
          >
            <SidenavCollapse
              name={name}
              icon={icon}
              active={key === collapseName}
              noCollapse={noCollapse}
            />
          </MuiLink>
        )
      } else if (noCollapse && route) {
        returnValue = (
          <NextLink
            href={route}
            key={key}
          >
            <SidenavCollapse
              name={name}
              icon={icon}
              noCollapse={noCollapse}
              active={key === collapseName}
            >
              {collapse ? renderCollapse(collapse) : null}
            </SidenavCollapse>
          </NextLink>
        )
      } else {
        returnValue = (
          <SidenavCollapse
            key={key}
            name={name}
            icon={icon}
            active={key === collapseName}
            open={openCollapse === key}
            onClick={() => (openCollapse === key ? setOpenCollapse(false) : setOpenCollapse(key))}
          >
            {collapse ? renderCollapse(collapse) : null}
          </SidenavCollapse>
        )
      }
    } else if (type === 'title') {
      returnValue = (
        <MDTypography
          key={key}
          color={textColor}
          display='block'
          variant='caption'
          fontWeight='bold'
          textTransform='uppercase'
          pl={3}
          mt={2}
          mb={1}
          ml={-0.3}
        >
          {title}
        </MDTypography>
      )
    } else if (type === 'divider') {
      returnValue = (
        <Divider
          key={key}
          sx={{ my: 1 }}
          light={
            (!darkMode && !whiteSidenav && !transparentSidenav) || (darkMode && !transparentSidenav && whiteSidenav)
          }
        />
      )
    }

    return returnValue
  })

  // Styles for the navbar icons
  const iconsStyle = ({ palette: { dark, white, text }, functions: { rgba } }: { palette: any; functions: any }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main

      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main
      }

      return colorValue
    },
  })

  return (
    <SidenavRoot
      {...rest}
      variant='permanent'
      ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
    >
      <MDBox
        pt={2}
        pb={2}
        px={2}
        textAlign='center'
      >
        <NextLink href='/'>
          <MDBox
            display='flex'
            alignItems='center'
            sx={{ cursor: 'pointer' }}
          >
            {/*
            {brandLogo && brandLogo?.src ? (
            */}
            <MDBox
              component='img'
              src={brandLogo}
              alt={brandName}
              width='2.0rem'
            />
            {/*
            ) : (
               brandName
            )}
            */}
            <MDBox
              width={!brandName && '100%'}
              sx={(theme) => sidenavLogoLabel(theme, { miniSidenav })}
            >
              <MDTypography
                component='h6'
                variant='button'
                fontWeight='medium'
                color={textColor}
              >
                {brandName}
              </MDTypography>
            </MDBox>
          </MDBox>
        </NextLink>
      </MDBox>
      <Divider
        sx={{ mt: 0, mb: 1 }}
        light={(!darkMode && !whiteSidenav && !transparentSidenav) || (darkMode && !transparentSidenav && whiteSidenav)}
      />
      <List>{renderRoutes}</List>
    </SidenavRoot>
  )
}

// Declaring default props for Sidenav
Sidenav.defaultProps = {
  color: 'info',
  brandLogo: null,
  light: false,
}

export default Sidenav

// ========
/*
<MDBox
display={{ xs: "block", xl: "block" }}
position="absolute"
top={19}
right={19}
p={0}
// onClick={closeSidenav}
// onClick={hamburgerMiniSidenav}
sx={{ cursor: "pointer" }}>
<MDTypography color="secondary">
  <Icon sx={{ fontWeight: "bold" }}>close</Icon>
  <Icon fontSize="small" sx={iconsStyle}>
    {miniSidenav ? "menu" : "menu_open"}
  </Icon>
  <IconButton
    sx={navbarDesktopMenu}
    onClick={hamburgerMiniSidenav}
    size="small"
    disableRipple>
    <Icon fontSize="small" sx={iconsStyle}>
      {miniSidenav ? "menu" : "menu_open"}
    </Icon>
  </IconButton>
</MDTypography>
</MDBox>
*/
