import { ReactNode } from "react"

// nextjs components
import Link from "next/link"

// @mui material components
import Collapse from "@mui/material/Collapse"
import Icon from "@mui/material/Icon"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

// Declaring props types for DefaultNavbarDropdown
interface Props {
  name: string
  icon?: ReactNode
  children?: ReactNode
  collapseStatus?: boolean
  light?: boolean
  href?: string
  route?: string
  collapse: boolean
  [key: string]: any
}

function DefaultNavbarDropdown({
  name,
  icon,
  children,
  collapseStatus,
  light,
  href,
  route,
  collapse,
  ...rest
}: Props): JSX.Element {
  const linkComponent = {
    component: "a",
    href,
    target: "_blank",
    rel: "noreferrer",
  }

  const routeComponent: any = {
    component: Link,
    to: route,
  }

  return (
    <>
      <MDBox
        {...rest}
        mx={1}
        p={1}
        display="flex"
        alignItems="baseline"
        color={light ? "white" : "dark"}
        opacity={light ? 1 : 0.6}
        sx={{ cursor: "pointer", userSelect: "none" }}
        {...(route && routeComponent)}
        {...(href && linkComponent)}>
        <MDTypography
          variant="body2"
          lineHeight={1}
          color="inherit"
          sx={{ alignSelf: "center", "& *": { verticalAlign: "middle" } }}>
          {icon}
        </MDTypography>
        <MDTypography
          variant="button"
          fontWeight="regular"
          textTransform="capitalize"
          color={light ? "white" : "dark"}
          sx={{ fontWeight: "100%", ml: 1, mr: 0.25 }}>
          {name}
        </MDTypography>
        <MDTypography
          variant="body2"
          color={light ? "white" : "dark"}
          ml="auto">
          <Icon sx={{ fontWeight: "normal", verticalAlign: "middle" }}>
            {collapse && "keyboard_arrow_down"}
          </Icon>
        </MDTypography>
      </MDBox>
      {children && (
        <Collapse in={Boolean(collapseStatus)} timeout={400} unmountOnExit>
          {children}
        </Collapse>
      )}
    </>
  )
}

// Declaring default props for DefaultNavbarDropdown
DefaultNavbarDropdown.defaultProps = {
  icon: false,
  children: false,
  collapseStatus: false,
  light: false,
  href: "",
  route: "",
}

export default DefaultNavbarDropdown
