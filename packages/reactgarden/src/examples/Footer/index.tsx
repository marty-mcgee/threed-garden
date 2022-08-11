// @mui material components
import Link from "@mui/material/Link"
import Icon from "@mui/material/Icon"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"

// Company Juice Dashboard Base Styles
import typography from "themes/theme-light/base/typography"

// Declaring props types for Footer
interface Props {
  company?: {
    href: string
    name: string
  }
  links?: {
    href: string
    name: string
  }[]
  [key: string]: any
}

function Footer({ company, links }: Props): JSX.Element {
  const { href, name } = company
  const { size } = typography

  const renderLinks = () =>
    links.map((link) => (
      <MDBox key={link.name} component="li" px={2} lineHeight={1}>
        <Link href={link.href} target="_blank">
          <MDTypography variant="button" fontWeight="regular" color="text">
            {link.name}
          </MDTypography>
        </Link>
      </MDBox>
    ))

  return (
    <MDBox
      width="100%"
      display="flex"
      flexDirection={{ xs: "column", lg: "row" }}
      justifyContent="space-between"
      alignItems="center"
      px={1.5}>
      <MDBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
        color="text"
        fontSize={size.sm}
        px={1.5}>
        <MDBox fontSize={size.md} color="text" mb={-0.5} mx={0.25}>
          <Icon color="inherit" fontSize="inherit">
            favorite
          </Icon>
        </MDBox>
        {new Date().getFullYear()}
        <Link href={href} target="_blank">
          <MDTypography variant="button" fontWeight="normal">
            &nbsp;{name}&nbsp;
          </MDTypography>
        </Link>
      </MDBox>
      <MDBox
        component="ul"
        sx={({ breakpoints }) => ({
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          listStyle: "none",
          mt: 3,
          mb: 0,
          p: 0,

          [breakpoints.up("lg")]: {
            mt: 0,
          },
        })}>
        {renderLinks()}
      </MDBox>
    </MDBox>
  )
}

// Declaring default props for Footer
Footer.defaultProps = {
  company: { href: "https://companyjuice.com/", name: "Company Juice" },
  links: [
    { href: "https://companyjuice.com/", name: "Company Juice" },
    { href: "https://companyjuice.com/presentation", name: "About Us" },
    { href: "https://companyjuice.com/blog", name: "Blog" },
    { href: "https://companyjuice.com/license", name: "License" },
  ],
}

export default Footer
