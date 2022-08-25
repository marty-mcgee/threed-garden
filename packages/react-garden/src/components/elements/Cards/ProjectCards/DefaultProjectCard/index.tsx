// nextjs components
import Link from "next/link"

// @mui material components
import Card from "@mui/material/Card"
import CardMedia from "@mui/material/CardMedia"
import Tooltip from "@mui/material/Tooltip"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"
import MDButton from "~/components/mui/MDButton"
import MDAvatar from "~/components/mui/MDAvatar"

// Declaring props types for DefaultProjectCard
interface Props {
  image: string
  label: string
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
    | "light"
    | "dark"
    | "white"
    label: string
  }
  authors?: {
    image: string
    name: string
  }[]
  [key: string]: any
}

function DefaultProjectCard({
  image,
  label,
  title,
  description,
  action,
  authors,
}: Props): JSX.Element {
  const renderAuthors = authors.map(({ image: media, name }) => (
    <Tooltip key={name} title={name} placement="bottom">
      <MDAvatar
        src={media}
        alt={name}
        size="xs"
        sx={({ borders: { borderWidth }, palette: { white } }) => ({
          border: `${borderWidth[2]} solid ${white.main}`,
          cursor: "pointer",
          position: "relative",
          ml: -1.25,

          "&:hover, &:focus": {
            zIndex: "10",
          },
        })}
      />
    </Tooltip>
  ))

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "transparent",
        boxShadow: "none",
        overflow: "visible",
      }}>
      <MDBox position="relative" width="100.25%" shadow="xl" borderRadius="xl">
        <CardMedia
          src={image}
          component="img"
          title={title}
          sx={{
            maxWidth: "100%",
            margin: 0,
            boxShadow: ({ boxShadows: { md } }) => md,
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </MDBox>
      <MDBox mt={1} mx={0.5}>
        <MDTypography
          variant="button"
          fontWeight="regular"
          color="text"
          textTransform="capitalize">
          {label}
        </MDTypography>
        <MDBox mb={1}>
          {1 === 0 && action.type === "internal" ? (
            <MDTypography
              component={Link}
              href={action.route}
              variant="h5"
              textTransform="capitalize">
              {title}
            </MDTypography>
          ) : (
            <MDTypography
              component="a"
              href={action.route}
              target="_blank"
              rel="noreferrer"
              variant="h5"
              textTransform="capitalize">
              {title}
            </MDTypography>
          )}
        </MDBox>
        <MDBox mb={3} lineHeight={0}>
          <MDTypography variant="button" fontWeight="light" color="text">
            {description}
          </MDTypography>
        </MDBox>
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems="center">
          {1 === 0 && action.type === "internal" ? (
            <MDButton
              component={Link}
              href={action.route}
              variant="outlined"
              size="small"
              color={action.color}>
              {action.label}
            </MDButton>
          ) : (
            <MDButton
              component="a"
              href={action.route}
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              size="small"
              color={action.color}>
              {action.label}
            </MDButton>
          )}
          <MDBox display="flex">{renderAuthors}</MDBox>
        </MDBox>
      </MDBox>
    </Card>
  )
}

// Declaring default props for DefaultProjectCard
DefaultProjectCard.defaultProps = {
  authors: [],
}

export default DefaultProjectCard
