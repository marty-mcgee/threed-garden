// react-routers components
import Link from "next/link"

// @mui material components
import Card from "@mui/material/Card"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"
import MDAvatar from "~/components/MDAvatar"
import MDButton from "~/components/MDButton"

// Declaring props types for ProfilesList
interface Props {
  title: string
  profiles: {
    image: string
    name: string
    description: string
    action: {
      type: "external" | "internal"
      route: string
      color:
      | "primary"
      | "secondary"
      | "info"
      | "success"
      | "warning"
      | "error"
      | "light"
      | "dark"
      label: string
    }
  }[]
  shadow?: boolean
  [key: string]: any
}

function ProfilesList({ title, profiles, shadow }: Props): JSX.Element {
  const renderProfiles = profiles.map(
    ({ image, name, description, action }) => (
      <MDBox
        key={name}
        component="li"
        display="flex"
        alignItems="center"
        py={1}
        mb={1}>
        <MDBox mr={2}>
          <MDAvatar src={image} alt="something here" shadow="md" />
        </MDBox>
        <MDBox
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          justifyContent="center">
          <MDTypography variant="button" fontWeight="medium">
            {name}
          </MDTypography>
          <MDTypography variant="caption" color="text">
            {description}
          </MDTypography>
        </MDBox>
        <MDBox ml="auto">
          {action.type === "internal" ? (
            <MDButton
              component={Link}
              to={action.route}
              variant="text"
              color="info">
              {action.label}
            </MDButton>
          ) : (
            <MDButton
              component="a"
              href={action.route}
              target="_blank"
              rel="noreferrer"
              variant="text"
              color={action.color}>
              {action.label}
            </MDButton>
          )}
        </MDBox>
      </MDBox>
    )
  )

  return (
    <Card sx={{ height: "100%", boxShadow: !shadow && "none" }}>
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
          {renderProfiles}
        </MDBox>
      </MDBox>
    </Card>
  )
}

// Declaring defualt props for ProfilesList
ProfilesList.defaultProps = {
  shadow: true,
}

export default ProfilesList
