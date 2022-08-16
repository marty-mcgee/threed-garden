import { ReactNode } from "react"

// nextjs components
import Link from "next/link"

// @mui material components
import Card from "@mui/material/Card"
import Icon from "@mui/material/Icon"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"

// Declaring props types for CategoriesList
interface Props {
  title: string
  categories: {
    color?:
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "light"
    | "dark"
    icon: ReactNode | string
    name: string
    description: ReactNode
    route: string
  }[]
  [key: string]: any
}

function CategoriesList({ title, categories }: Props): JSX.Element {
  const renderItems = categories.map(
    ({ color, icon, name, description, route }, key) => (
      <MDBox
        key={name}
        component="li"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        borderRadius="lg"
        py={1}
        pr={2}
        mb={categories.length - 1 === key ? 0 : 1}>
        <MDBox display="flex" alignItems="center">
          <MDBox
            display="grid"
            alignItems="center"
            justifyContent="center"
            bgColor={color}
            borderRadius="lg"
            shadow="md"
            color="white"
            width="2rem"
            height="2rem"
            mr={2}
            variant="gradient"
            fontSize="0.875rem">
            <Icon
              sx={{
                display: "grid",
                placeItems: "center",
              }}>
              {icon}
            </Icon>
          </MDBox>
          <MDBox display="flex" flexDirection="column">
            <MDTypography
              variant="button"
              color={color}
              fontWeight="medium"
              gutterBottom>
              {name}
            </MDTypography>
            <MDTypography variant="caption" color="text">
              {description}
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDBox display="flex">
          <MDTypography
            component={Link}
            variant="button"
            color={color}
            to={route}
            sx={{
              lineHeight: 0,
              transition: "all 0.2s cubic-bezier(.34,1.61,.7,1.3)",
              p: 0.5,

              "&:hover, &:focus": {
                transform: "translateX(5px)",
              },
            }}>
            <Icon sx={{ fontWeight: "bold" }}>chevron_right</Icon>
          </MDTypography>
        </MDBox>
      </MDBox>
    )
  )

  return (
    <Card>
      <MDBox pt={2} px={2}>
        <MDTypography
          variant="h6"
          fontWeight="medium"
          textTransform="capitalize">
          {title}
        </MDTypography>
      </MDBox>
      <MDBox p={2}>
        <MDBox component="ul" display="flex" flexDirection="column" p={0} m={0}>
          {renderItems}
        </MDBox>
      </MDBox>
    </Card>
  )
}

export default CategoriesList
