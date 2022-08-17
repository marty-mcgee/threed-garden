// nextjs components
import Link from "next/link"

// @mui material components
import Card from "@mui/material/Card"
import MuiLink from "@mui/material/Link"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"
import MDButton from "~/components/MDButton"

// Declaring props types for SimpleBlogCard
interface Props {
  image: string
  title: string
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
    | "dark"
    | "light"
    | "default"
    label: string
    [key: string]: any
  }
}

function SimpleBlogCard({
  image,
  title,
  description,
  action,
}: Props): JSX.Element {
  return (
    <Card>
      <MDBox position="relative" borderRadius="lg" mt={-3} mx={2}>
        <MDBox
          component="img"
          src={image}
          alt={title}
          borderRadius="lg"
          shadow="md"
          width="100%"
          height="100%"
          position="relative"
          zIndex={1}
        />
        <MDBox
          borderRadius="lg"
          shadow="md"
          width="100%"
          height="100%"
          position="absolute"
          left={0}
          top="3%"
          sx={{
            backgroundImage: `url(${image})`,
            transform: "scale(0.94)",
            filter: "blur(12px)",
            backgroundSize: "cover",
          }}
        />
      </MDBox>
      <MDBox p={3}>
        <MDTypography
          display="inline"
          variant="h3"
          textTransform="capitalize"
          fontWeight="bold">
          {title}
        </MDTypography>
        <MDBox mt={2} mb={3}>
          <MDTypography variant="body2" component="p" color="text">
            {description}
          </MDTypography>
        </MDBox>
        {action.type === "external" ? (
          <MuiLink href={action.route} target="_blank" rel="noreferrer">
            <MDButton color={action.color ? action.color : "dark"}>
              {action.label}
            </MDButton>
          </MuiLink>
        ) : (
          <Link href={action.route}>
            <MDButton color={action.color ? action.color : "dark"}>
              {action.label}
            </MDButton>
          </Link>
        )}
      </MDBox>
    </Card>
  )
}

export default SimpleBlogCard
